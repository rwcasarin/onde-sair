// GET /api/auth/me — usuário da sessão atual (ou null)
import { currentUser } from "../_lib/auth.js";
import { json, handle } from "../_lib/http.js";
export const GET = handle(async (request) => { const why = {}; const user = await currentUser(request, why); return json({ user, ...(user ? {} : { reason: why.reason }) }); });
