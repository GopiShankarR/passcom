import { Router } from "express";
import { prisma } from "../services/db";

const r = Router();
r.get("/status", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true, version: "v0.1", ruleset: await prisma.rule.count() });
});
export default r;
