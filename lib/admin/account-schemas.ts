import { z } from "zod";

export const ACCOUNT_ROLES = ["CONSULTANT", "ADMIN"] as const;
export type AccountRole = (typeof ACCOUNT_ROLES)[number];

// What the account form sends. A consultant needs a showroom and at least one model, because
// auto-assignment only picks consultants at the lead's showroom who handle its model (A10).
export const accountSchema = z
  .object({
    id: z.string().nullable(),
    name: z.string().trim().min(2, "Enter a name").max(80),
    email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
    role: z.enum(ACCOUNT_ROLES),
    showroomId: z.string(),
    modelIds: z.array(z.string()).max(50),
    active: z.boolean(),
  })
  .superRefine((account, context) => {
    if (account.role !== "CONSULTANT") return;
    if (!account.showroomId) context.addIssue({ code: "custom", path: ["showroomId"], message: "Choose a showroom" });
    if (account.modelIds.length === 0) context.addIssue({ code: "custom", path: ["modelIds"], message: "Choose at least one model" });
  });

export type AccountInput = z.input<typeof accountSchema>;
