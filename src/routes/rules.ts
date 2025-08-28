import { Router } from "express";
import { prisma } from "../services/db";
const r = Router();

r.get("/", async (req, res) => {
  const limit = Number(req.query.limit || 20);
  const rules = await prisma.rule.findMany({ take: limit, orderBy: { createdAt: "desc" } });
  res.json(rules.map(({ condition, obligations, citations, ...rest }) => ({
    ...rest, // hide internals if you want
    condition, obligations, citations
  })));
});

export default r;
