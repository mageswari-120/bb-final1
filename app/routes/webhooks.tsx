// app/routes/webhooks.tsx
// Sprint 6 — mandatory webhooks for Shopify App Store

import { type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { prisma } from "../lib/db.server";

export async function action({ request }: ActionFunctionArgs) {
  const { topic, shop, session, admin } =
    await authenticate.webhook(request);

  console.log(`[Webhook] ${topic} from ${shop}`);

  switch (topic) {
    // ── App uninstalled ───────────────────────────────────────────────────
    case "APP_UNINSTALLED": {
      if (session) {
        // Delete all sessions for this shop
        await prisma.session.deleteMany({ where: { shop } });
        // Delete shop plan record
        await prisma.shopPlan.deleteMany({ where: { shop } });
        // Note: we keep Bundle records for 30 days per GDPR data retention
      }
      break;
    }

    // ── GDPR: Shop data erasure ───────────────────────────────────────────
    case "SHOP_REDACT": {
      // Delete all shop data — bundles, plan, sessions
      await Promise.all([
        prisma.bundle.deleteMany({ where: { shop } }),
        prisma.shopPlan.deleteMany({ where: { shop } }),
        prisma.session.deleteMany({ where: { shop } }),
      ]);
      console.log(`[GDPR] Shop data erased for ${shop}`);
      break;
    }

    // ── GDPR: Customer data erasure ───────────────────────────────────────
    case "CUSTOMERS_REDACT": {
      // Bundle Builder does not store customer PII.
      // We store shop-level data only (bundle configs, plan).
      // Log receipt for compliance audit trail.
      console.log(`[GDPR] customers/redact received for ${shop} — no customer PII stored`);
      break;
    }

    // ── GDPR: Customer data request ───────────────────────────────────────
    case "CUSTOMERS_DATA_REQUEST": {
      // Bundle Builder does not store customer PII.
      console.log(`[GDPR] customers/data_request received for ${shop} — no customer PII stored`);
      break;
    }

    default: {
      console.log(`[Webhook] Unhandled topic: ${topic}`);
    }
  }

  return new Response(null, { status: 200 });
}
