import { Request, Response, NextFunction } from "express";

export function optionalAuth(_req: Request, _res: Response, next: NextFunction) {
  // For MVP, skip. Later: verify Firebase ID token here and set req.user
  next();
}
