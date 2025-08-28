import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function upsertRule(r: any) {
  await prisma.rule.upsert({
    where: { title: r.title },
    update: {
      jurisdiction: r.jurisdiction,
      category: r.category,
      condition: r.condition,
      obligations: r.obligations,
      citations: r.citations,
      version: r.version ?? 1
    },
    create: r as any
  });
}

async function main() {
  const rules: any[] = [
    // ── UNIVERSAL / FEDERAL
    {
      title: "Form I-9 Employment Eligibility Verification",
      jurisdiction: "federal",
      category: "employment",
      condition: { "and": [ { "var": "derived.us_presence" }, { "var": "derived.thresholds.gte_1" } ] },
      obligations: [{ action: "Complete Form I-9 for each employee", description: "Verify identity and work authorization within 3 business days of hire." }],
      citations: [{ name: "USCIS I-9", section: "8 U.S.C. §1324a", url: "https://www.uscis.gov/i-9" }]
    },
    {
      title: "Federal Labor Law Posters",
      jurisdiction: "federal",
      category: "employment",
      condition: { "and": [ { "var": "derived.us_presence" }, { "var": "derived.thresholds.gte_1" } ] },
      obligations: [{ action: "Post required federal labor law notices", description: "FLSA, FMLA (if applicable), OSHA, EEOC, etc., where employees can see them." }],
      citations: [{ name: "DOL Poster Advisor", section: "Postings", url: "https://www.dol.gov/general/topics/posters" }]
    },
    // Threshold-based federal
    {
      title: "ADA Title I (Employment) — ≥15 Employees",
      jurisdiction: "federal",
      category: "employment",
      condition: { "and": [ { "var": "derived.us_presence" }, { "var": "derived.thresholds.gte_15" } ] },
      obligations: [{ action: "Comply with ADA Title I", description: "Provide reasonable accommodation; avoid disability discrimination." }],
      citations: [{ name: "ADA Title I", section: "42 U.S.C. §12111 et seq.", url: "https://www.ada.gov/" }]
    },
    {
      title: "COBRA — ≥20 Employees",
      jurisdiction: "federal",
      category: "employment",
      condition: { "and": [ { "var": "derived.us_presence" }, { "var": "derived.thresholds.gte_20" } ] },
      obligations: [{ action: "Offer COBRA continuation", description: "Offer continuation coverage; provide notices." }],
      citations: [{ name: "COBRA", section: "29 U.S.C. §1161–1169", url: "https://www.dol.gov/general/topic/health-plans/cobra" }]
    },
    {
      title: "FMLA — ≥50 Employees",
      jurisdiction: "federal",
      category: "employment",
      condition: { "and": [ { "var": "derived.us_presence" }, { "var": "derived.thresholds.gte_50" } ] },
      obligations: [{ action: "Provide FMLA leave", description: "Eligible employees may take job-protected unpaid leave for specified family/medical reasons." }],
      citations: [{ name: "FMLA", section: "29 U.S.C. §2601 et seq.", url: "https://www.dol.gov/agencies/whd/fmla" }]
    },
    {
      title: "WARN Act — ≥100 Employees",
      jurisdiction: "federal",
      category: "employment",
      condition: { "and": [ { "var": "derived.us_presence" }, { "var": "derived.thresholds.gte_100" } ] },
      obligations: [{ action: "Comply with WARN Act", description: "Provide 60-day notice before covered plant closings/mass layoffs." }],
      citations: [{ name: "WARN", section: "29 U.S.C. §2101 et seq.", url: "https://www.dol.gov/agencies/eta/layoffs/warn" }]
    },
    {
      title: "EEO-1 Reporting — ≥100 employees OR ≥50 with federal contract",
      jurisdiction: "federal",
      category: "employment",
      condition: {
        "or": [
          { "var": "derived.thresholds.gte_100" },
          { "and": [ { "var": "derived.thresholds.gte_50" }, { "var": "input.entity.federal_contractor" } ] }
        ]
      },
      obligations: [{ action: "File EEO-1 report", description: "Annual workforce demographics reporting." }],
      citations: [{ name: "EEO-1", section: "EEOC", url: "https://www.eeoc.gov/employers/eeo-1-data-collection" }]
    },
    // OSHA
    {
      title: "OSHA General Duty Clause — All US Employers",
      jurisdiction: "federal",
      category: "safety",
      condition: { "var": "derived.us_presence" },
      obligations: [{ action: "Provide a safe workplace", description: "Identify and mitigate recognized hazards." }],
      citations: [{ name: "OSH Act", section: "29 U.S.C. §654(a)(1)", url: "https://www.osha.gov/laws-regs/oshact/section5-duties" }]
    },
    {
      title: "OSHA Injury/Illness Recordkeeping — ≥10 Employees",
      jurisdiction: "federal",
      category: "safety",
      condition: { "and": [ { "var": "derived.us_presence" }, { "var": "derived.thresholds.gte_10" } ] },
      obligations: [{ action: "Maintain OSHA 300/300A logs", description: "Record and post annual summary." }],
      citations: [{ name: "29 CFR Part 1904", section: "Recordkeeping", url: "https://www.osha.gov/recordkeeping" }]
    },

    // ── PAYMENTS / DATA
    {
      title: "PCI DSS — Accepting Card Payments",
      jurisdiction: "industry",
      category: "payments",
      condition: { "var": "derived.pci_applicable" },
      obligations: [{ action: "Comply with PCI DSS", description: "Use appropriate SAQ; validate controls with your processor." }],
      citations: [{ name: "PCI SSC", section: "PCI DSS", url: "https://www.pcisecuritystandards.org/" }]
    },
    {
      title: "HIPAA — Handling PHI",
      jurisdiction: "federal",
      category: "privacy",
      condition: { "var": "derived.hipaa_applicable" },
      obligations: [{ action: "Comply with HIPAA", description: "Privacy, Security, Breach Notification rules; BAAs as needed." }],
      citations: [{ name: "HIPAA", section: "45 CFR Parts 160/164", url: "https://www.hhs.gov/hipaa/index.html" }]
    },
    {
      title: "COPPA — Targeting Children Under 13",
      jurisdiction: "federal",
      category: "privacy",
      condition: { "var": "derived.coppa_applicable" },
      obligations: [{ action: "Comply with COPPA", description: "Parental consent, notices, data practices for <13." }],
      citations: [{ name: "COPPA", section: "16 CFR Part 312", url: "https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa" }]
    },

    // ── STATE PRIVACY
    {
      title: "California CCPA/CPRA",
      jurisdiction: "state:CA",
      category: "privacy",
      condition: { "var": "derived.ccpa_applicable" },
      obligations: [{ action: "Comply with CCPA/CPRA", description: "Notices, DSARs, contracts; data mapping and opt-outs." }],
      citations: [{ name: "CCPA/CPRA", section: "Cal. Civ. Code §1798.100 et seq.", url: "https://oag.ca.gov/privacy/ccpa" }]
    },
    { title: "Virginia VCDPA", jurisdiction: "state:VA", category: "privacy",
      condition: { "var": "derived.vcdpa_applicable" },
      obligations: [{ action: "Comply with VCDPA", description: "Notices, consumer rights, DPIAs for high-risk processing." }],
      citations: [{ name: "VCDPA", section: "Va. Code §59.1-575 et seq.", url: "https://law.lis.virginia.gov/vacode/title59.1/chapter53/" }]
    },
    { title: "Colorado CPA", jurisdiction: "state:CO", category: "privacy",
      condition: { "var": "derived.co_cpa_applicable" },
      obligations: [{ action: "Comply with Colorado CPA", description: "Consent for sensitive data, universal opt-out." }],
      citations: [{ name: "CPA", section: "Colo. Rev. Stat. §6-1-1301 et seq.", url: "https://coag.gov/resources/colorado-privacy-act/" }]
    },
    { title: "Connecticut CTDPA", jurisdiction: "state:CT", category: "privacy",
      condition: { "var": "derived.ct_ctdpa_applicable" },
      obligations: [{ action: "Comply with CTDPA", description: "Notices, rights, contracts." }],
      citations: [{ name: "CTDPA", section: "Public Act 22-15", url: "https://portal.ct.gov/AG/Consumer-Resources/Privacy/Connecticut-Data-Privacy-Act" }]
    },
    { title: "Utah UCPA", jurisdiction: "state:UT", category: "privacy",
      condition: { "var": "derived.ut_ucpa_applicable" },
      obligations: [{ action: "Comply with UCPA", description: "Notice, opt-out for selling/ads; threshold with revenue." }],
      citations: [{ name: "UCPA", section: "Utah Code §13-61-101 et seq.", url: "https://consumerprotection.utah.gov/privacy/" }]
    },
    { title: "New York SHIELD Act (Data Security)", jurisdiction: "state:NY", category: "privacy",
      condition: { "var": "derived.ny_shield_applicable" },
      obligations: [{ action: "Implement NY SHIELD safeguards", description: "Administrative, technical, and physical safeguards." }],
      citations: [{ name: "SHIELD", section: "Gen. Bus. Law §899-bb", url: "https://ag.ny.gov/internet/data-breach" }]
    },

    // ── STATE/LOCAL SPECIFICS
    {
      title: "Illinois BIPA — Biometric Information",
      jurisdiction: "state:IL",
      category: "privacy",
      condition: { "and": [ { "var": "derived.state_presence.IL" }, { "var": "input.data_practices.collects_biometric_data" } ] },
      obligations: [{ action: "Comply with BIPA", description: "Written consent, retention schedule, security controls." }],
      citations: [{ name: "BIPA", section: "740 ILCS 14", url: "https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=3004" }]
    },
    {
      title: "Chicago Food Establishment License",
      jurisdiction: "city:IL-Chicago",
      category: "licenses",
      condition: { "and": [ { "var": "derived.city_is.Chicago" }, { "var": "input.operations.serves_food" } ] },
      obligations: [{ action: "Obtain Food Establishment License", description: "City license and inspections for restaurants." }],
      citations: [{ name: "City of Chicago", section: "Food Protection", url: "https://www.chicago.gov/" }]
    },
    {
      title: "Illinois Sales Tax (ROT) Registration",
      jurisdiction: "state:IL",
      category: "tax",
      condition: { "and": [ { "var": "derived.state_presence.IL" }, { "var": "derived.sells_goods" } ] },
      obligations: [{ action: "Register for IL sales tax (ROT)", description: "Collect/remit sales tax on taxable sales (incl. prepared food)." }],
      citations: [{ name: "IDOR", section: "Sales & Use Tax", url: "https://www2.illinois.gov/rev" }]
    },
    // Economic nexus (generic)
    {
      title: "Sales Tax Economic Nexus (Generic Check)",
      jurisdiction: "multi-state",
      category: "tax",
      condition: { "and": [
        { ">=": [ { "var": "input.size.annual_revenue_usd" }, 100000 ] },           // heuristic
        { ">=": [ { "var": "input.locations.online_sales_states.length" }, 1 ] }
      ] },
      obligations: [{ action: "Assess economic nexus & register where required", description: "Thresholds vary by state; review sales into each state." }],
      citations: [{ name: "Wayfair", section: "South Dakota v. Wayfair (2018)", url: "https://www.supremecourt.gov/opinions/17pdf/17-494_j4el.pdf" }]
    },
  ];

  // ── Payroll registration + posters for key states (extend as needed)
  const payrollStates = ["CA", "NY", "TX", "IL"];
  for (const st of payrollStates) {
    rules.push({
      title: `Register as Employer for Payroll Taxes — ${st}`,
      jurisdiction: `state:${st}`,
      category: "employment",
      condition: { "and": [ { "var": `derived.has_employees_by_state.${st}` }, { "var": "derived.us_presence" } ] },
      obligations: [{ action: `Register for ${st} withholding & unemployment insurance`, description: "Obtain state tax IDs; set up payroll filings and remittance." }],
      citations: [{ name: `${st} Revenue/Workforce`, section: "Employer registration", url: "https://www.google.com/search?q="+st+" employer payroll registration" }]
    });
    rules.push({
      title: `State Labor Law Posters — ${st}`,
      jurisdiction: `state:${st}`,
      category: "employment",
      condition: { "and": [ { "var": `derived.has_employees_by_state.${st}` }, { "var": "derived.us_presence" } ] },
      obligations: [{ action: `Post required labor law notices for ${st}`, description: "State-specific wage/hour, safety, discrimination posters." }],
      citations: [{ name: `${st} labor posters`, section: "State postings", url: "https://www.google.com/search?q="+st+" labor law posters" }]
    });
  }

  // Upsert all
  for (const r of rules) await upsertRule(r);
  console.log("Seeded rules:", rules.length);
}

main().finally(() => prisma.$disconnect());
