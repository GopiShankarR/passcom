import { Request, Response, NextFunction } from "express";
import { prisma } from "../services/db";

export async function idempotency(req: Request, res: Response, next: NextFunction) {
  const key = req.header("Idempotency-Key");
  if (!key) return next(); // allow but recommend sending a key

  const existing = await prisma.session.findUnique({ where: { idempotencyKey: key } });
  if (existing) {
    const evaln = await prisma.evaluation.findFirst({
      where: { sessionId: existing.id },
      orderBy: { createdAt: "desc" }
    });
    if (evaln) return res.status(200).json(evaln.results);
  }
  (req as any)._idempoKey = key;
  next();
}
