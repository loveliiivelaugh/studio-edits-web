import type { NextFunction, Request, Response } from "express";

export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    role: string;
  };
};

export function authMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.header("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    req.user = {
      id: "stub-user",
      role: "editor",
    };
  }

  next();
}
