import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { STAFF_ROLES, type Role } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Financial model upload.
 *
 * A route rather than a server action because a spreadsheet is comfortably
 * past the default body limit a server action will accept, and the failure
 * when it isn't is a generic 500 with nothing useful in it. Same shape as
 * /api/admin/upload — the private bucket needs no client-facing policy and the
 * service role key never leaves the server.
 */

const BUCKET = "reports";
const PREFIX = "internal/financial-model";
const MAX_BYTES = 40 * 1024 * 1024;

const ALLOWED = new Set([
  "xlsx",
  "xlsm",
  "xls",
  "csv",
  "numbers",
  "pdf",
]);

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

  // Membership, not equality — 'owner' is also staff. See lib/authApi.ts.
  if (!profile?.role || !STAFF_ROLES.includes(profile.role as Role)) {
    return NextResponse.json({ error: "Staff only." }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "That file is over 40MB. Check it isn't carrying embedded data." },
      { status: 400 }
    );
  }

  /*
    Extension allow-list, not a block-list.

    The bucket is private and every read is a signed URL, so this isn't
    guarding against an executable being served. It guards against the actual
    mistake: dragging the wrong thing into the box and then not noticing for a
    fortnight, because the model folder happily accepted a screenshot.
  */
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED.has(ext)) {
    return NextResponse.json(
      { error: `A .${ext} isn't a financial model. Expected xlsx, xlsm, xls, csv, numbers or pdf.` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Epoch prefix so listing sorts newest-first by name alone, and so the
  // upload time survives independently of storage metadata.
  const path = `${PREFIX}/${Date.now()}-${safeName}`;

  const bytes = Buffer.from(await file.arrayBuffer());

  // upsert:false — the timestamp makes collisions effectively impossible, and
  // if one somehow happens it should fail rather than silently overwrite a
  // version somebody may have already sent to an investor.
  const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, path });
}
