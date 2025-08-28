import jsonLogic from "json-logic-js";
import { prisma } from "../db";
import type { BusinessProfile } from "../../schemas/businessProfile";
import { derive } from "./derive";

/** slugify for public IDs */
const slug = (s: unknown) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

/** best-effort federal domain hint from title/category */
function detectDomain(title?: string, category?: string) {
  const t = String(title ?? "").toLowerCase();
  if (t.includes("osha")) return "osha";
  if (t.includes("hipaa")) return "hipaa";
  if (t.includes("ccpa")) return "ccpa";
  if (t.includes("vcdpa")) return "vcdpa";
  if (t.includes("eeo-1") || t.includes("eeo1")) return "eeoc";
  if (t.includes("fmla")) return "fmla";
  if (t.includes("cobra")) return "cobra";
  if (t.includes("warn")) return "warn";
  if (t.includes("ada")) return "ada";
  if (t.includes("coppa")) return "coppa";
  if (t.includes("pci")) return "pci";
  if (t.includes("bipa")) return "bipa";
  return slug(category || "general");
}

/** Build external/public ruleId from our stored rule row */
function publicRuleId(
  rule: { jurisdiction?: string; title?: string; category?: string },
  ctx: { primaryState?: string }
) {
  const j = rule.jurisdiction ?? "";
  const title = rule.title ?? "general";
  const domain = detectDomain(rule.title, rule.category);

  // federal
  if (j === "federal") {
    return `federal:${domain}:${slug(title)}`;
  }

  // state:*  (we store like "state:CA")
  if (j.startsWith("state:")) {
    const st = j.split(":")[1]?.toUpperCase() || ctx.primaryState?.toUpperCase() || "US";
    return `state:${st}:${slug(title)}`;
  }

  // city:*  (existing format is often "city:IL-Chicago"; normalize to "city:Chicago,IL")
  if (j.startsWith("city:")) {
    const rest = j.slice(5);
    let city = "";
    let st = ctx.primaryState?.toUpperCase() || "US";
    if (rest.includes("-")) {
      const [stRaw, cityRaw] = rest.split("-", 2);
      st = (stRaw || "").toUpperCase();
      city = cityRaw || "";
    } else if (rest.includes(",")) {
      const [cityRaw, stRaw] = rest.split(",", 2);
      city = cityRaw || "";
      st = (stRaw || "").toUpperCase();
    } else {
      city = rest;
    }
    return `city:${city},${st}:${slug(title)}`;
  }

  // fallback: treat as state:primary
  const st = ctx.primaryState?.toUpperCase() || "US";
  return `state:${st}:${slug(title)}`;
}

export async function evaluateProfile(profile: BusinessProfile) {
  const derived = derive(profile);
  const rules = await prisma.rule.findMany();

  const hits: Array<{ ruleId: string; title: string; why: any }> = [];

  for (const r of rules) {
    const input = { input: profile, derived };
    try {
      const ok = !!jsonLogic.apply(r.condition as any, input);
      if (ok) {
        const pubId = publicRuleId(
          { jurisdiction: r.jurisdiction, title: r.title, category: r.category },
          { primaryState: profile.locations?.primary?.state }
        );
        const title = r.title || "Untitled rule";

        hits.push({
          ruleId: pubId,
          title,
          why: r.condition
        });
      }
    } catch {
      // malformed rule; ignore
    }
  }

  // obligations aligned to the same public ruleId
  const obligations = hits.flatMap((h) =>
    (rules.find((rr) => {
      // match by title to pull obligations; titles are unique in our seed
      return rr.title === h.title;
    })?.obligations as any[] | undefined || []).map((o) => ({
      ...o,
      ruleId: h.ruleId,
      ruleTitle: h.title
    }))
  );

  return {
    obligations,
    hits,
    derived
  };
}
