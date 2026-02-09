import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import { getDb } from "@/lib/firebase";

function getBearerToken(req: Request): string | null {
  const raw = req.headers.get("authorization");
  if (!raw) return null;
  const [scheme, token] = raw.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

export async function requireUser(req: Request) {
  if (getApps().length === 0) {
    getDb();
  }

  const token = getBearerToken(req);
  if (!token) return null;

  try {
    const decoded = await getAuth().verifyIdToken(token);
    return decoded;
  } catch {
    return null;
  }
}
