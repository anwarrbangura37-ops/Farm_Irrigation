import { getAuth } from "@clerk/express";
import type { RequestHandler } from "express";

const ADMIN_EMAIL = "koromajoel933@gmail.com";

export const requireFarmUser: RequestHandler = (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to access farm data." });
    return;
  }
  next();
};

export const requireFarmAdmin: RequestHandler = (req, res, next) => {
  const auth = getAuth(req);
  const claims = auth.sessionClaims as Record<string, unknown> | null;
  const email = claims?.email;

  if (typeof email !== "string" || email.trim().toLowerCase() !== ADMIN_EMAIL) {
    res.status(403).json({ error: "Administrator access is required." });
    return;
  }

  next();
};
