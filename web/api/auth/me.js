// GET /api/auth/me — usuário da sessão atual (ou null)
import { currentUser } from "../_lib/auth.js";
import { json, handle } from "../_lib/http.js";
import { googleClientId } from "../_lib/google.js";
export const GET = handle(async (request) => json({ user: await currentUser(request), google: await googleClientId() }));
