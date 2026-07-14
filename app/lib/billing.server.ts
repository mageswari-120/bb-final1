// app/lib/billing.server.ts
import { authenticate, BASIC_PLAN, PRO_PLAN } from "../shopify.server";

export const PLANS = {
  FREE: {
    id:              "FREE",
    name:            "Free",
    monthlyPrice:    0,
    maxBundles:      1,
    mixMatch:        false,
    discountTiers:   false,
    analyticsAccess: false,
  },
  BASIC: {
    id:              "BASIC",
    name:            "Basic",
    monthlyPrice:    9.99,
    maxBundles:      10,
    mixMatch:        true,
    discountTiers:   true,
    analyticsAccess: false,
  },
  PRO: {
    id:              "PRO",
    name:            "Pro",
    monthlyPrice:    24.99,
    maxBundles:      Infinity,
    mixMatch:        true,
    discountTiers:   true,
    analyticsAccess: true,
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type Plan   = typeof PLANS[PlanId];

export async function getActivePlan(request: Request): Promise<PlanId> {
  const { billing } = await authenticate.admin(request);
  const { hasActivePayment, appSubscriptions } = await billing.check({
    plans:  [BASIC_PLAN, PRO_PLAN],
    isTest: process.env.NODE_ENV !== "production",
  });
  if (!hasActivePayment) return "FREE";
  const active = appSubscriptions.find((s: any) => s.status === "ACTIVE");
  if (!active) return "FREE";
  if (active.name === PRO_PLAN)   return "PRO";
  if (active.name === BASIC_PLAN) return "BASIC";
  return "FREE";
}

export async function requestUpgrade(
  request: Request,
  planId: Exclude<PlanId, "FREE">,
  returnUrl: string,
): Promise<string> {
  const { billing } = await authenticate.admin(request);
  const planName    = planId === "PRO" ? PRO_PLAN : BASIC_PLAN;
  const plan        = PLANS[planId];
  const { confirmationUrl } = await billing.request({
    plan:         planName,
    amount:       plan.monthlyPrice,
    currencyCode: "USD",
    interval:     "EVERY_30_DAYS",
    isTest:       process.env.NODE_ENV !== "production",
    returnUrl,
  });
  return confirmationUrl;
}

export async function cancelSubscription(request: Request): Promise<void> {
  const { billing } = await authenticate.admin(request);
  const { appSubscriptions } = await billing.check({
    plans:  [BASIC_PLAN, PRO_PLAN],
    isTest: process.env.NODE_ENV !== "production",
  });
  const active = appSubscriptions.find((s: any) => s.status === "ACTIVE");
  if (active) {
    await billing.cancel({
      subscriptionId: active.id,
      isTest: process.env.NODE_ENV !== "production",
    });
  }
}

export function canCreateBundle(plan: Plan, currentCount: number): boolean {
  return currentCount < plan.maxBundles;
}
export function canUseMixMatch(plan: Plan):      boolean { return plan.mixMatch; }
export function canUseDiscountTiers(plan: Plan): boolean { return plan.discountTiers; }
export function canAccessAnalytics(plan: Plan):  boolean { return plan.analyticsAccess; }

export function gateMessage(feature: "mixMatch" | "discountTiers" | "analytics" | "bundleLimit"): string {
  const map: Record<string, string> = {
    mixMatch:      "Mix & match bundles are available on the Basic plan and above.",
    discountTiers: "Discount tiers are available on the Basic plan and above.",
    analytics:     "Analytics are available on the Pro plan.",
    bundleLimit:   "You've reached your bundle limit. Upgrade to create more.",
  };
  return map[feature] ?? "Upgrade your plan to access this feature.";
}
