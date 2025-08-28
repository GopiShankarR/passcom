import { z } from "zod";

// Reusable small schemas
const StateCode = z.string().length(2);
const PositiveInt = z.number().int().nonnegative();

const OperationsSchema = z
  .object({
    serves_food: z.boolean().default(false),
    sells_alcohol: z.boolean().default(false),
    brick_and_mortar: z.boolean().default(true),
    ecommerce: z.boolean().default(false),
    is_healthcare_provider: z.boolean().default(false),
    is_contractor_or_construction: z.boolean().default(false),
  })
  .partial()           // ← make all fields optional
  .default({});        // ← now {} is a valid default

const DataPracticesSchema = z
  .object({
    collects_personal_data: z.boolean().default(false),
    collects_biometric_data: z.boolean().default(false),
    collects_payment_cards: z.boolean().default(false),
    stores_payment_cards: z.boolean().default(false),
    processes_phi: z.boolean().default(false),
    processes_ssn: z.boolean().default(false),
    targets_children_u13: z.boolean().default(false),
    records_per_year_estimate: PositiveInt.optional(),
    consumers_by_state: z.record(StateCode, PositiveInt).default({}),
  })
  .partial()           // ← make all fields optional
  .default({});        // ← {} ok now

const PaymentsSchema = z.object({
  accepts_card_payments: z.boolean().default(false),
  stores_card_data: z.boolean().default(false),   // optional extra flag (not required by rules)
}).partial().default({});

export const BusinessProfileSchema = z.object({
  as_of_date: z.string(),

  entity: z.object({
    legal_form: z.enum(["llc","c_corp","s_corp","sole_prop","partnership","nonprofit_other"]),
    federal_contractor: z.boolean().optional().default(false),
  }),

  industry: z.object({
    naics_codes: z.array(z.string().regex(/^[0-9]{2,6}$/)).min(1),
    description: z.string().optional(),
  }),

  locations: z.object({
    primary: z.object({
      country: z.literal("US"),
      state: StateCode,
      city: z.string(),
      postal_code: z.string(),
    }),
    operating_states: z.array(StateCode).default([]),
    online_sales_states: z.array(StateCode).default([]),
    has_remote_employees_by_state: z.record(StateCode, PositiveInt).default({}),
  }),

  size: z.object({
    employee_count_total: PositiveInt,
    employee_count_by_state: z.record(StateCode, PositiveInt).default({}),
    annual_revenue_usd: z.number().nonnegative().optional(),
  }),

  operations: OperationsSchema,
  payments: PaymentsSchema,
  data_practices: DataPracticesSchema,
});

export type BusinessProfile = z.infer<typeof BusinessProfileSchema>;
