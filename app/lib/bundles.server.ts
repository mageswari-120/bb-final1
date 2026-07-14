// app/lib/bundles.server.ts
// CRUD for bundles + metafield sync to Shopify (Sprint 5)

import { prisma } from "./db.server";
import { authenticate } from "../shopify.server";

// ── Types ────────────────────────────────────────────────────────────────────

export interface TierRow {
  minItems: number;
  discount: number;
  label:    string;
}

export interface DisplayConfig {
  heading:   string;
  subtitle:  string;
  ctaLabel:  string;
}

export interface BundleCreateInput {
  shop:         string;
  title:        string;
  mode:         "fixed" | "mix_match";
  sourceType:   string;
  collectionId: string;
  minItems:     number;
  maxItems?:    number | null;
  allowRepeat:  boolean;
  status:       "active" | "draft";
  display:      DisplayConfig;
  tiers:        TierRow[];
}

export interface BundleRecord {
  id:           string;
  shop:         string;
  title:        string;
  status:       string;
  mode:         string;
  sourceType:   string;
  collectionId: string;
  minItems:     number;
  maxItems:     number | null;
  allowRepeat:  boolean;
  display:      DisplayConfig;
  tiers:        TierRow[];
  updatedAt:    Date;
  createdAt:    Date;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toRecord(raw: any): BundleRecord {
  return {
    ...raw,
    display: JSON.parse(raw.displayJson || "{}"),
    tiers:   JSON.parse(raw.tiersJson   || "[]"),
  };
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export async function getBundles(shop: string): Promise<BundleRecord[]> {
  const rows = await prisma.bundle.findMany({
    where:   { shop },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(toRecord);
}

export async function getBundle(id: string, shop: string): Promise<BundleRecord | null> {
  const row = await prisma.bundle.findFirst({ where: { id, shop } });
  return row ? toRecord(row) : null;
}

export async function createBundle(input: BundleCreateInput): Promise<BundleRecord> {
  const row = await prisma.bundle.create({
    data: {
      shop:         input.shop,
      title:        input.title,
      status:       input.status,
      mode:         input.mode,
      sourceType:   input.sourceType,
      collectionId: input.collectionId,
      minItems:     input.minItems,
      maxItems:     input.maxItems ?? null,
      allowRepeat:  input.allowRepeat,
      displayJson:  JSON.stringify(input.display),
      tiersJson:    JSON.stringify(input.tiers),
    },
  });
  return toRecord(row);
}

export async function updateBundle(
  id: string,
  input: BundleCreateInput,
): Promise<BundleRecord> {
  const row = await prisma.bundle.update({
    where: { id },
    data: {
      title:        input.title,
      status:       input.status,
      mode:         input.mode,
      sourceType:   input.sourceType,
      collectionId: input.collectionId,
      minItems:     input.minItems,
      maxItems:     input.maxItems ?? null,
      allowRepeat:  input.allowRepeat,
      displayJson:  JSON.stringify(input.display),
      tiersJson:    JSON.stringify(input.tiers),
    },
  });
  return toRecord(row);
}

export async function deleteBundle(id: string, shop: string): Promise<void> {
  await prisma.bundle.delete({ where: { id, shop } });
}

// ── Sprint 5: Metafield sync ─────────────────────────────────────────────────
// After every create/update, write bundle JSON to a shop metafield so the
// theme section can read it without an app proxy round-trip if needed.

export const METAFIELD_NAMESPACE = "bundle_builder";
export const METAFIELD_KEY       = "bundles";

/**
 * Writes all active bundles for a shop to a single shop metafield (JSON array).
 * Called after every bundle create/update/delete.
 */
export async function syncBundlesMetafield(
  request: Request,
  shop: string,
): Promise<void> {
  try {
    const { admin } = await authenticate.admin(request);

    const bundles = await getBundles(shop);
    const activeBundles = bundles
      .filter(b => b.status === "active")
      .map(b => ({
        id:           b.id,
        title:        b.title,
        mode:         b.mode,
        collectionId: b.collectionId,
        minItems:     b.minItems,
        maxItems:     b.maxItems,
        allowRepeat:  b.allowRepeat,
        display:      b.display,
        tiers:        b.tiers,
      }));

    await admin.graphql(
      `#graphql
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id namespace key value }
          userErrors  { field message }
        }
      }`,
      {
        variables: {
          metafields: [
            {
              ownerId:   `gid://shopify/Shop/current`,
              namespace: METAFIELD_NAMESPACE,
              key:       METAFIELD_KEY,
              type:      "json",
              value:     JSON.stringify(activeBundles),
            },
          ],
        },
      },
    );
  } catch (err) {
    // Non-fatal — app proxy is the primary data path
    console.error("[BundleBuilder] metafield sync failed:", err);
  }
}
