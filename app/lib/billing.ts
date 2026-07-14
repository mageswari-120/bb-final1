export type PlanId = "FREE" | "BASIC" | "PRO";

export const PLANS = {
  FREE: {
    name: "Free",
    monthlyPrice: 0,
  },
  BASIC: {
    name: "Basic",
    monthlyPrice: 9.99,
  },
  PRO: {
    name: "Pro",
    monthlyPrice: 19.99,
  },
} satisfies Record<PlanId, {
  name: string;
  monthlyPrice: number;
}>;