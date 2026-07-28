import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Report artifact upload. Goes through the server so the private bucket
 * needs no client-facing storage policy and the service role key never
 * leaves the server.
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const reportId = String(form.get("reportId") ?? "");
  const companyId = form.get("companyId") ? String(form.get("companyId")) : null;

  if (!(file instanceof File) || !reportId) {
    return NextResponse.json({ error: "Missing file or reportId." }, { status: 400 });
  }

  const admin = createAdminClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${companyId ?? "unassigned"}/${reportId}/${Date.now()}-${safeName}`;

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
    report_id: reportId,
    company_id: companyId,
    storage_path: path,
    filename: file.name,
    content_type: file.type || null,
    size_bytes: file.size,
    uploaded_by: user.id,
  });

  if (dbErr) {
    await admin.storage.from("reports").remove([path]);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, path });
}
