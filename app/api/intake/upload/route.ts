import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

// Document formats only. Deliberately excludes .csv/.xlsx-style bulk data
// exports, which are the shape member-level claims arrive in — accepting
// those needs the PHI firewall built first.
const ALLOWED = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/png",
  "image/jpeg",
]);

/**
 * Intake document upload. Authenticated requester uploads material tied to
 * their own request; goes through the server so the private bucket needs no
 * client-facing storage policy.
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const requestId = String(form.get("requestId") ?? "");

  if (!(file instanceof File) || !requestId) {
    return NextResponse.json({ error: "Missing file or request." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "That file is over 25 MB. Email it to us instead." },
      { status: 413 }
    );
  }

  if (file.type && !ALLOWED.has(file.type)) {
    return NextResponse.json(
      {
        error:
          "We can take PDF, PowerPoint, Word or image files. Spreadsheets and data extracts need a separate secure channel — mention it and we'll set one up.",
      },
      { status: 415 }
    );
  }

  const admin = createAdminClient();

  // The request must belong to this user.
  const { data: request } = await admin
    .from("report_requests")
    .select("id, user_id, company_id")
    .eq("id", requestId)
    .maybeSingle();

  if (!request || request.user_id !== user.id) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `intake/${requestId}/${Date.now()}-${safeName}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await admin.storage
    .from("reports")
    .upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { error: dbErr } = await admin.from("report_files").insert({
    request_id: requestId,
    company_id: request.company_id,
    storage_path: path,
    filename: file.name,
    content_type: file.type || null,
    size_bytes: file.size,
    kind: "intake",
    uploaded_by: user.id,
  });

  if (dbErr) {
    await admin.storage.from("reports").remove([path]);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, filename: file.name });
}
