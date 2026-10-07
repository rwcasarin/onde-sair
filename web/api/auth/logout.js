// POST /api/auth/logout
import { clearCookie } from "../_lib/auth.js";
import { json, handle } from "../_lib/http.js";
export const POST = handle(async () => json({ ok: true }, 200, { "set-cookie": clearCookie() }));
