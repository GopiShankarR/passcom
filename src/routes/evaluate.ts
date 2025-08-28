import { Router } from "express";
import { BusinessProfileSchema } from "../schemas/businessProfile";
import { evaluateProfile } from "../services/evaluator/evaluate";
import { prisma } from "../services/db";

const r = Router();

r.post("/", async (req, res) => {
  const parse = BusinessProfileSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "invalid_profile", details: parse.error.flatten() });
  }
  const profile = parse.data;
  const result = await evaluateProfile(profile);

  // idempotency persistence
  let sessionId: string | null = null;
  const key = (req as any)._idempoKey as string | undefined;
  if (key) {
    const session = await prisma.session.upsert({
      where: { idempotencyKey: key },
      update: { profile },
      create: { idempotencyKey: key, profile }
    });
    sessionId = session.id;
  }
  if (sessionId) {
    await prisma.evaluation.create({ data: { sessionId, profile, results: result } });
  }

  res.json(result);
});

export default r;
