import type { BusinessProfile } from "../../schemas/businessProfile";

export type DerivedFacts = {
  us_presence: boolean;
  employee_count_total: number;
  thresholds: {
    gte_1: boolean; gte_10: boolean; gte_15: boolean; gte_20: boolean; gte_50: boolean; gte_100: boolean;
  };
  state_presence: Record<string, boolean>;          // CA: true, IL: true, ...
  has_employees_by_state: Record<string, boolean>;  // states with >0 employees
  city_is: Record<string, boolean>;                 // { Chicago: true }
  multi_state_employer: boolean;
  consumers_by_state: Record<string, number>;
  // Privacy flags
  ccpa_applicable: boolean;     // CA
  vcdpa_applicable: boolean;    // VA
  co_cpa_applicable: boolean;   // CO
  ct_ctdpa_applicable: boolean; // CT
  ut_ucpa_applicable: boolean;  // UT
  ny_shield_applicable: boolean;// NY
  // Sectoral/data flags
  pci_applicable: boolean;
  hipaa_applicable: boolean;
  coppa_applicable: boolean;
  // Convenience
  sells_goods: boolean;         // heuristic: serves_food or ecommerce
};

export function derive(profile: BusinessProfile): DerivedFacts {
  const total = profile.size?.employee_count_total ?? 0;

  const primaryState = profile.locations?.primary?.state;
  const states = new Set<string>([
    ...(primaryState ? [primaryState] : []),
    ...((profile.locations?.operating_states) ?? []),
    ...Object.keys(profile.locations?.has_remote_employees_by_state ?? {})
  ]);

  const state_presence = Object.fromEntries(Array.from(states).map(s => [s, true]));
  const has_employees_by_state: Record<string, boolean> = {};
  Object.entries(profile.size?.employee_count_by_state ?? {}).forEach(([s, v]) => {
    if ((v ?? 0) > 0) has_employees_by_state[s] = true;
  });

  const multi_state_employer = Object.keys(state_presence).length > 1;

  const consumers_by_state = profile.data_practices?.consumers_by_state ?? {};
  const revenue = profile.size?.annual_revenue_usd ?? 0;
  const consumers = (st: string) => consumers_by_state[st] ?? 0;

  // ── Privacy (approximate but practical thresholds)
  const ccpa_applicable     = !!(state_presence["CA"] && profile.data_practices?.collects_personal_data && (consumers("CA") >= 100_000 || revenue >= 25_000_000));
  const vcdpa_applicable    = !!(state_presence["VA"] && profile.data_practices?.collects_personal_data && (consumers("VA") >= 100_000));
  const co_cpa_applicable   = !!(state_presence["CO"] && profile.data_practices?.collects_personal_data && (consumers("CO") >= 100_000));
  const ct_ctdpa_applicable = !!(state_presence["CT"] && profile.data_practices?.collects_personal_data && (consumers("CT") >= 100_000));
  const ut_ucpa_applicable  = !!(state_presence["UT"] && profile.data_practices?.collects_personal_data && (consumers("UT") >= 100_000 && revenue >= 25_000_000));
  const ny_shield_applicable= !!(consumers("NY") > 0 && profile.data_practices?.collects_personal_data);

  const pci_applicable   = !!profile.payments?.accepts_card_payments;
  const hipaa_applicable = !!profile.data_practices?.processes_phi;
  const coppa_applicable = !!profile.data_practices?.targets_children_u13;

  const city_is: Record<string, boolean> = {};
  if (profile.locations?.primary?.city) city_is[profile.locations.primary.city] = true;

  const sells_goods = !!(profile.operations?.serves_food || profile.operations?.ecommerce);

  return {
    us_presence: profile.locations?.primary?.country === "US",
    employee_count_total: total,
    thresholds: {
      gte_1: total >= 1, gte_10: total >= 10, gte_15: total >= 15,
      gte_20: total >= 20, gte_50: total >= 50, gte_100: total >= 100,
    },
    state_presence,
    has_employees_by_state,
    city_is,
    multi_state_employer,
    consumers_by_state,
    ccpa_applicable, vcdpa_applicable, co_cpa_applicable, ct_ctdpa_applicable, ut_ucpa_applicable, ny_shield_applicable,
    pci_applicable, hipaa_applicable, coppa_applicable,
    sells_goods
  };
}
