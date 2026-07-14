// app/routes/app-proxy.bundle-products.tsx
// App proxy endpoint: GET /apps/bundle-builder/api/bundle-products?bundle_id=xxx
// Called by the storefront theme section JS

import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getBundle } from "../lib/bundles.server";
import { getProductsForCollection } from "../lib/products.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { storefront, session } = await authenticate.public.appProxy(request);

  const url      = new URL(request.url);
  const bundleId = url.searchParams.get("bundle_id");

  if (!bundleId) {
    return json({ error: "bundle_id is required" }, { status: 400 });
  }

  const bundle = await getBundle(bundleId, session.shop);

  if (!bundle) {
    return json({ error: "Bundle not found" }, { status: 404 });
  }

  if (bundle.status !== "active") {
    return json({ error: "Bundle is not active" }, { status: 404 });
  }

  // Fetch products from Shopify Admin API
  const products = await getProductsForCollection(
    request,
    bundle.collectionId,
    50,
  );

  return json(
    {
      bundle: {
        id:           bundle.id,
        title:        bundle.title,
        mode:         bundle.mode,
        sourceType:   bundle.sourceType,
        collectionId: bundle.collectionId,
        minItems:     bundle.minItems,
        maxItems:     bundle.maxItems,
        allowRepeat:  bundle.allowRepeat,
        display:      bundle.display,
        tiers:        bundle.tiers,
      },
      products,
    },
    {
      headers: {
        // Allow Shopify storefront to cache for 60s
        "Cache-Control": "public, max-age=60",
      },
    },
  );
}
