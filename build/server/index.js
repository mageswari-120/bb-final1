var _a;
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable, json, redirect } from "@remix-run/node";
import { RemixServer, Meta, Links, Outlet, ScrollRestoration, Scripts, useLoaderData, useActionData, useNavigation, useNavigate, Form, useSubmit } from "@remix-run/react";
import * as isbotModule from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { shopifyApp, BillingInterval, AppDistribution, ApiVersion, boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import "@shopify/shopify-app-remix/adapters/node";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { PrismaClient } from "@prisma/client";
import { Button, Page, Layout, Banner, Card, BlockStack, Text, TextField, Select, InlineStack, Checkbox, Badge, DataTable, Divider, Box, List, EmptyState, Modal, TextContainer } from "@shopify/polaris";
import { useState } from "react";
const ABORT_DELAY = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, remixContext, loadContext) {
  let prohibitOutOfOrderStreaming = isBotRequest(request.headers.get("user-agent")) || remixContext.isSpaMode;
  return prohibitOutOfOrderStreaming ? handleBotRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  ) : handleBrowserRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  );
}
function isBotRequest(userAgent) {
  if (!userAgent) {
    return false;
  }
  if ("isbot" in isbotModule && typeof isbotModule.isbot === "function") {
    return isbotModule.isbot(userAgent);
  }
  if ("default" in isbotModule && typeof isbotModule.default === "function") {
    return isbotModule.default(userAgent);
  }
  return false;
}
function handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
function handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
const polarisStyles = "/assets/styles-BeiPL2RV.css";
const prisma = global.prismaGlobal ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}
const BASIC_PLAN = "Bundle Builder Basic";
const PRO_PLAN = "Bundle Builder Pro";
const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  apiVersion: ApiVersion.January24,
  scopes: (_a = process.env.SCOPES) == null ? void 0 : _a.split(","),
  appUrl: process.env.SHOPIFY_APP_URL,
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  billing: {
    [BASIC_PLAN]: {
      amount: 9.99,
      currencyCode: "USD",
      interval: BillingInterval.Every30Days
    },
    [PRO_PLAN]: {
      amount: 24.99,
      currencyCode: "USD",
      interval: BillingInterval.Every30Days
    }
  },
  hooks: {
    afterAuth: async ({ session }) => {
      shopify.registerWebhooks({ session });
    }
  },
  future: {
    v3_webhookAdminContext: true,
    v3_authenticatePublic: true,
    v3_lineItemBilling: true,
    unstable_newEmbeddedAuthStrategy: true
  },
  ...process.env.SHOP_CUSTOM_DOMAIN ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] } : {}
});
ApiVersion.January24;
shopify.addDocumentResponseHeaders;
const authenticate = shopify.authenticate;
shopify.unauthenticated;
shopify.login;
shopify.registerWebhooks;
shopify.sessionStorage;
const links = () => [
  { rel: "stylesheet", href: polarisStyles }
];
async function loader$5({ request }) {
  await authenticate.admin(request);
  return null;
}
function App() {
  return /* @__PURE__ */ jsxs("html", { children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width,initial-scale=1" }),
      /* @__PURE__ */ jsx("link", { rel: "preconnect", href: "https://cdn.shopify.com/" }),
      /* @__PURE__ */ jsx(
        "link",
        {
          rel: "stylesheet",
          href: "https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        }
      ),
      /* @__PURE__ */ jsx(Meta, {}),
      /* @__PURE__ */ jsx(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsxs(AppProvider, { isEmbeddedApp: true, apiKey: process.env.SHOPIFY_API_KEY || "", children: [
        /* @__PURE__ */ jsxs(NavMenu, { children: [
          /* @__PURE__ */ jsx("a", { href: "/app", rel: "home", children: "Bundles" }),
          /* @__PURE__ */ jsx("a", { href: "/app/billing", children: "Billing" })
        ] }),
        /* @__PURE__ */ jsx(Outlet, {})
      ] }),
      /* @__PURE__ */ jsx(ScrollRestoration, {}),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function ErrorBoundary() {
  return boundary.error(useRouteError());
}
const headers = (headersArgs) => boundary.headers(headersArgs);
function useRouteError() {
  const { useRouteError: useRouteError2 } = require("@remix-run/react");
  return useRouteError2();
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  default: App,
  headers,
  links,
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
function toRecord(raw) {
  return {
    ...raw,
    display: JSON.parse(raw.displayJson || "{}"),
    tiers: JSON.parse(raw.tiersJson || "[]")
  };
}
async function getBundles(shop) {
  const rows = await prisma.bundle.findMany({
    where: { shop },
    orderBy: { updatedAt: "desc" }
  });
  return rows.map(toRecord);
}
async function getBundle(id, shop) {
  const row = await prisma.bundle.findFirst({ where: { id, shop } });
  return row ? toRecord(row) : null;
}
async function createBundle(input) {
  const row = await prisma.bundle.create({
    data: {
      shop: input.shop,
      title: input.title,
      status: input.status,
      mode: input.mode,
      sourceType: input.sourceType,
      collectionId: input.collectionId,
      minItems: input.minItems,
      maxItems: input.maxItems ?? null,
      allowRepeat: input.allowRepeat,
      displayJson: JSON.stringify(input.display),
      tiersJson: JSON.stringify(input.tiers)
    }
  });
  return toRecord(row);
}
async function updateBundle(id, input) {
  const row = await prisma.bundle.update({
    where: { id },
    data: {
      title: input.title,
      status: input.status,
      mode: input.mode,
      sourceType: input.sourceType,
      collectionId: input.collectionId,
      minItems: input.minItems,
      maxItems: input.maxItems ?? null,
      allowRepeat: input.allowRepeat,
      displayJson: JSON.stringify(input.display),
      tiersJson: JSON.stringify(input.tiers)
    }
  });
  return toRecord(row);
}
async function deleteBundle(id, shop) {
  await prisma.bundle.delete({ where: { id, shop } });
}
const METAFIELD_NAMESPACE = "bundle_builder";
const METAFIELD_KEY = "bundles";
async function syncBundlesMetafield(request, shop) {
  try {
    const { admin } = await authenticate.admin(request);
    const bundles = await getBundles(shop);
    const activeBundles = bundles.filter((b) => b.status === "active").map((b) => ({
      id: b.id,
      title: b.title,
      mode: b.mode,
      collectionId: b.collectionId,
      minItems: b.minItems,
      maxItems: b.maxItems,
      allowRepeat: b.allowRepeat,
      display: b.display,
      tiers: b.tiers
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
              ownerId: `gid://shopify/Shop/current`,
              namespace: METAFIELD_NAMESPACE,
              key: METAFIELD_KEY,
              type: "json",
              value: JSON.stringify(activeBundles)
            }
          ]
        }
      }
    );
  } catch (err) {
    console.error("[BundleBuilder] metafield sync failed:", err);
  }
}
async function getProductsForCollection(request, collectionId, limit = 50) {
  var _a2, _b, _c;
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(
    `#graphql
    query collectionProducts($id: ID!, $first: Int!) {
      collection(id: $id) {
        products(first: $first) {
          edges {
            node {
              id
              title
              featuredImage { url }
              variants(first: 1) {
                edges {
                  node {
                    id
                    price
                    availableForSale
                  }
                }
              }
            }
          }
        }
      }
    }`,
    { variables: { id: collectionId, first: limit } }
  );
  const data = await response.json();
  const edges = ((_c = (_b = (_a2 = data == null ? void 0 : data.data) == null ? void 0 : _a2.collection) == null ? void 0 : _b.products) == null ? void 0 : _c.edges) ?? [];
  return edges.map((e) => {
    var _a3, _b2;
    const product = e.node;
    const variant = (_a3 = product.variants.edges[0]) == null ? void 0 : _a3.node;
    return {
      id: product.id,
      variantId: (variant == null ? void 0 : variant.id) ?? "",
      title: product.title,
      price: Math.round(parseFloat((variant == null ? void 0 : variant.price) ?? "0") * 100),
      image: ((_b2 = product.featuredImage) == null ? void 0 : _b2.url) ?? null,
      available: (variant == null ? void 0 : variant.availableForSale) ?? false,
      collectionId
    };
  });
}
async function loader$4({ request }) {
  const { storefront, session } = await authenticate.public.appProxy(request);
  const url = new URL(request.url);
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
  const products = await getProductsForCollection(
    request,
    bundle.collectionId,
    50
  );
  return json(
    {
      bundle: {
        id: bundle.id,
        title: bundle.title,
        mode: bundle.mode,
        sourceType: bundle.sourceType,
        collectionId: bundle.collectionId,
        minItems: bundle.minItems,
        maxItems: bundle.maxItems,
        allowRepeat: bundle.allowRepeat,
        display: bundle.display,
        tiers: bundle.tiers
      },
      products
    },
    {
      headers: {
        // Allow Shopify storefront to cache for 60s
        "Cache-Control": "public, max-age=60"
      }
    }
  );
}
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
const PLANS$1 = {
  FREE: {
    id: "FREE",
    name: "Free",
    monthlyPrice: 0,
    maxBundles: 1,
    mixMatch: false,
    discountTiers: false,
    analyticsAccess: false
  },
  BASIC: {
    id: "BASIC",
    name: "Basic",
    monthlyPrice: 9.99,
    maxBundles: 10,
    mixMatch: true,
    discountTiers: true,
    analyticsAccess: false
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    monthlyPrice: 24.99,
    maxBundles: Infinity,
    mixMatch: true,
    discountTiers: true,
    analyticsAccess: true
  }
};
async function getActivePlan(request) {
  const { billing } = await authenticate.admin(request);
  const { hasActivePayment, appSubscriptions } = await billing.check({
    plans: [BASIC_PLAN, PRO_PLAN],
    isTest: process.env.NODE_ENV !== "production"
  });
  if (!hasActivePayment) return "FREE";
  const active = appSubscriptions.find((s) => s.status === "ACTIVE");
  if (!active) return "FREE";
  if (active.name === PRO_PLAN) return "PRO";
  if (active.name === BASIC_PLAN) return "BASIC";
  return "FREE";
}
async function requestUpgrade(request, planId, returnUrl) {
  const { billing } = await authenticate.admin(request);
  const planName = planId === "PRO" ? PRO_PLAN : BASIC_PLAN;
  const plan = PLANS$1[planId];
  const { confirmationUrl } = await billing.request({
    plan: planName,
    amount: plan.monthlyPrice,
    currencyCode: "USD",
    interval: "EVERY_30_DAYS",
    isTest: process.env.NODE_ENV !== "production",
    returnUrl
  });
  return confirmationUrl;
}
async function cancelSubscription(request) {
  const { billing } = await authenticate.admin(request);
  const { appSubscriptions } = await billing.check({
    plans: [BASIC_PLAN, PRO_PLAN],
    isTest: process.env.NODE_ENV !== "production"
  });
  const active = appSubscriptions.find((s) => s.status === "ACTIVE");
  if (active) {
    await billing.cancel({
      subscriptionId: active.id,
      isTest: process.env.NODE_ENV !== "production"
    });
  }
}
function canCreateBundle(plan, currentCount) {
  return currentCount < plan.maxBundles;
}
function canUseMixMatch(plan) {
  return plan.mixMatch;
}
function canUseDiscountTiers(plan) {
  return plan.discountTiers;
}
function gateMessage(feature) {
  const map = {
    mixMatch: "Mix & match bundles are available on the Basic plan and above.",
    discountTiers: "Discount tiers are available on the Basic plan and above.",
    analytics: "Analytics are available on the Pro plan.",
    bundleLimit: "You've reached your bundle limit. Upgrade to create more."
  };
  return map[feature] ?? "Upgrade your plan to access this feature.";
}
async function loader$3({ request, params }) {
  const { session } = await authenticate.admin(request);
  const isNew = params.id === "new";
  const [bundle, planId] = await Promise.all([
    isNew ? null : getBundle(params.id, session.shop),
    getActivePlan(request)
  ]);
  return json({
    bundle,
    isNew,
    planId,
    plan: PLANS$1[planId],
    allowMixMatch: canUseMixMatch(PLANS$1[planId]),
    allowTiers: canUseDiscountTiers(PLANS$1[planId]),
    mixMatchGate: canUseMixMatch(PLANS$1[planId]) ? null : gateMessage("mixMatch"),
    tiersGate: canUseDiscountTiers(PLANS$1[planId]) ? null : gateMessage("discountTiers")
  });
}
async function action$3({ request, params }) {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const isNew = params.id === "new";
  const title = form.get("title").trim();
  const mode2 = form.get("mode");
  const collectionId = form.get("collectionId").trim();
  const minItems = parseInt(form.get("minItems"), 10);
  const maxItemsRaw = form.get("maxItems");
  const maxItems = maxItemsRaw ? parseInt(maxItemsRaw, 10) : null;
  const allowRepeat = form.get("allowRepeat") === "true";
  const heading = form.get("heading").trim();
  const subtitle = form.get("subtitle").trim();
  const ctaLabel = form.get("ctaLabel").trim();
  const tiersJson = form.get("tiers");
  const status = form.get("status");
  const errors = {};
  if (!title) errors.title = "Title is required.";
  if (!collectionId) errors.collectionId = "Collection GID is required.";
  if (isNaN(minItems) || minItems < 1) errors.minItems = "Must be at least 1.";
  if (maxItems && maxItems < minItems) errors.maxItems = "Max must be ≥ min.";
  if (Object.keys(errors).length) return json({ errors }, { status: 422 });
  let tiers = [];
  try {
    tiers = JSON.parse(tiersJson || "[]");
  } catch {
    tiers = [];
  }
  const payload = {
    shop: session.shop,
    title,
    mode: mode2,
    sourceType: "collection",
    collectionId,
    minItems,
    maxItems,
    allowRepeat,
    status,
    display: { heading, subtitle, ctaLabel },
    tiers
  };
  if (isNew) {
    const created = await createBundle(payload);
    await syncBundlesMetafield(request, session.shop);
    return redirect(`/app/bundles/${created.id}`);
  } else {
    await updateBundle(params.id, payload);
    await syncBundlesMetafield(request, session.shop);
    return json({ ok: true, errors: {} });
  }
}
function BundleForm() {
  var _a2, _b, _c;
  const { bundle, isNew, planId, plan, allowMixMatch, allowTiers, mixMatchGate, tiersGate } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  useNavigate();
  const saving = navigation.state === "submitting";
  const errors = (actionData == null ? void 0 : actionData.errors) ?? {};
  const [title, setTitle] = useState((bundle == null ? void 0 : bundle.title) ?? "");
  const [mode2, setMode] = useState((bundle == null ? void 0 : bundle.mode) ?? "fixed");
  const [collectionId, setCollectionId] = useState((bundle == null ? void 0 : bundle.collectionId) ?? "");
  const [minItems, setMinItems] = useState(String((bundle == null ? void 0 : bundle.minItems) ?? 1));
  const [maxItems, setMaxItems] = useState(String((bundle == null ? void 0 : bundle.maxItems) ?? ""));
  const [allowRepeat, setAllowRepeat] = useState((bundle == null ? void 0 : bundle.allowRepeat) ?? false);
  const [status, setStatus] = useState((bundle == null ? void 0 : bundle.status) ?? "draft");
  const [heading, setHeading] = useState(((_a2 = bundle == null ? void 0 : bundle.display) == null ? void 0 : _a2.heading) ?? "Build your bundle");
  const [subtitle, setSubtitle] = useState(((_b = bundle == null ? void 0 : bundle.display) == null ? void 0 : _b.subtitle) ?? "");
  const [ctaLabel, setCtaLabel] = useState(((_c = bundle == null ? void 0 : bundle.display) == null ? void 0 : _c.ctaLabel) ?? "Add bundle to cart");
  const [tiers, setTiers] = useState((bundle == null ? void 0 : bundle.tiers) ?? []);
  const [tierMin, setTierMin] = useState("");
  const [tierDisc, setTierDisc] = useState("");
  const [tierLbl, setTierLbl] = useState("");
  function addTier() {
    const min = parseInt(tierMin, 10), disc = parseFloat(tierDisc);
    if (isNaN(min) || isNaN(disc)) return;
    setTiers((prev) => [...prev, { minItems: min, discount: disc, label: tierLbl || `Save ${disc}%` }].sort((a, b) => a.minItems - b.minItems));
    setTierMin("");
    setTierDisc("");
    setTierLbl("");
  }
  const tierRows = tiers.map((t, i) => [
    t.minItems,
    `${t.discount}%`,
    t.label,
    /* @__PURE__ */ jsx(Button, { size: "slim", tone: "critical", onClick: () => setTiers((p) => p.filter((_, j) => j !== i)), children: "Remove" })
  ]);
  return /* @__PURE__ */ jsx(
    Page,
    {
      title: isNew ? "Create bundle" : `Edit: ${bundle == null ? void 0 : bundle.title}`,
      backAction: { content: "Bundles", url: "/app" },
      children: /* @__PURE__ */ jsxs(Form, { method: "post", children: [
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "tiers", value: JSON.stringify(tiers) }),
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "allowRepeat", value: String(allowRepeat) }),
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "sourceType", value: "collection" }),
        /* @__PURE__ */ jsxs(Layout, { children: [
          (actionData == null ? void 0 : actionData.ok) && /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Banner, { title: "Bundle saved", tone: "success" }) }),
          mixMatchGate && mode2 === "mix_match" && /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Banner, { tone: "warning", action: { content: "Upgrade", url: "/app/billing" }, children: /* @__PURE__ */ jsx("p", { children: mixMatchGate }) }) }),
          /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
            /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Bundle settings" }),
            /* @__PURE__ */ jsx(TextField, { label: "Title", name: "title", value: title, onChange: setTitle, autoComplete: "off", error: errors.title, helpText: "Internal name." }),
            /* @__PURE__ */ jsx(
              Select,
              {
                label: "Bundle mode",
                name: "mode",
                options: [
                  { label: "Fixed bundle", value: "fixed" },
                  { label: allowMixMatch ? "Mix & match" : "Mix & match (Basic plan)", value: "mix_match", disabled: !allowMixMatch }
                ],
                value: mode2,
                onChange: (v) => setMode(v)
              }
            ),
            /* @__PURE__ */ jsx(TextField, { label: "Collection GID", name: "collectionId", value: collectionId, onChange: setCollectionId, autoComplete: "off", error: errors.collectionId, placeholder: "gid://shopify/Collection/123456789" }),
            /* @__PURE__ */ jsxs(InlineStack, { gap: "400", children: [
              /* @__PURE__ */ jsx(TextField, { label: "Min items", name: "minItems", type: "number", value: minItems, onChange: setMinItems, autoComplete: "off", error: errors.minItems, min: "1" }),
              /* @__PURE__ */ jsx(TextField, { label: "Max items (optional)", name: "maxItems", type: "number", value: maxItems, onChange: setMaxItems, autoComplete: "off", error: errors.maxItems, min: "1" })
            ] }),
            mode2 === "mix_match" && /* @__PURE__ */ jsx(Checkbox, { label: "Allow duplicate products", checked: allowRepeat, onChange: setAllowRepeat }),
            /* @__PURE__ */ jsx(
              Select,
              {
                label: "Status",
                name: "status",
                options: [{ label: "Draft", value: "draft" }, { label: "Active", value: "active" }],
                value: status,
                onChange: setStatus
              }
            )
          ] }) }) }),
          /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
            /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
              /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Discount tiers" }),
              !allowTiers && /* @__PURE__ */ jsx(Badge, { tone: "warning", children: "Basic plan required" })
            ] }),
            tiersGate ? /* @__PURE__ */ jsx(Banner, { tone: "info", action: { content: "Upgrade to Basic", url: "/app/billing" }, children: /* @__PURE__ */ jsx("p", { children: tiersGate }) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              tiers.length > 0 && /* @__PURE__ */ jsx(DataTable, { columnContentTypes: ["numeric", "text", "text", "text"], headings: ["Min items", "Discount", "Label", ""], rows: tierRows }),
              /* @__PURE__ */ jsx(Divider, {}),
              /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingSm", children: "Add a tier" }),
              /* @__PURE__ */ jsxs(InlineStack, { gap: "300", align: "start", children: [
                /* @__PURE__ */ jsx(TextField, { label: "Min items", type: "number", value: tierMin, onChange: setTierMin, autoComplete: "off", min: "1" }),
                /* @__PURE__ */ jsx(TextField, { label: "Discount %", type: "number", value: tierDisc, onChange: setTierDisc, autoComplete: "off", min: "0", max: "100", suffix: "%" }),
                /* @__PURE__ */ jsx(TextField, { label: "Label (optional)", value: tierLbl, onChange: setTierLbl, autoComplete: "off", placeholder: "Save 10%" }),
                /* @__PURE__ */ jsx(Box, { paddingBlockStart: "600", children: /* @__PURE__ */ jsx(Button, { onClick: addTier, children: "Add tier" }) })
              ] })
            ] })
          ] }) }) }),
          /* @__PURE__ */ jsx(Layout.Section, { variant: "oneThird", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
            /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Storefront display" }),
            /* @__PURE__ */ jsx(TextField, { label: "Heading", name: "heading", value: heading, onChange: setHeading, autoComplete: "off" }),
            /* @__PURE__ */ jsx(TextField, { label: "Subtitle", name: "subtitle", value: subtitle, onChange: setSubtitle, autoComplete: "off", multiline: 2 }),
            /* @__PURE__ */ jsx(TextField, { label: "CTA label", name: "ctaLabel", value: ctaLabel, onChange: setCtaLabel, autoComplete: "off" }),
            /* @__PURE__ */ jsxs(Text, { as: "p", tone: "subdued", variant: "bodySm", children: [
              "Bundle ID: ",
              /* @__PURE__ */ jsx("strong", { children: (bundle == null ? void 0 : bundle.id) ?? "Assigned after creation" })
            ] })
          ] }) }) }),
          /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsxs(InlineStack, { gap: "300", align: "end", children: [
            /* @__PURE__ */ jsx(Button, { url: "/app", children: "Cancel" }),
            /* @__PURE__ */ jsx(Button, { variant: "primary", submit: true, loading: saving, children: isNew ? "Create bundle" : "Save changes" })
          ] }) })
        ] })
      ] })
    }
  );
}
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3,
  default: BundleForm,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
const PLANS = {
  FREE: {
    name: "Free",
    monthlyPrice: 0
  },
  BASIC: {
    name: "Basic",
    monthlyPrice: 9.99
  },
  PRO: {
    name: "Pro",
    monthlyPrice: 19.99
  }
};
async function loader$2({ request }) {
  await authenticate.admin(request);
  const url = new URL(request.url);
  if (url.searchParams.get("charge_id")) return redirect("/app?upgraded=1");
  const planId = await getActivePlan(request);
  return json({ planId, plan: PLANS[planId] });
}
async function action$2({ request }) {
  const form = await request.formData();
  const intent = form.get("intent");
  const origin = new URL(request.url).origin;
  if (intent === "upgrade") {
    const confirmUrl = await requestUpgrade(
      request,
      form.get("plan"),
      `${origin}/app/billing`
    );
    return redirect(confirmUrl);
  }
  if (intent === "cancel") {
    await cancelSubscription(request);
    return redirect("/app/billing");
  }
  return json({ ok: false }, { status: 400 });
}
const FEATURES = {
  FREE: ["1 bundle", "Fixed bundle mode", "Shopify AJAX cart integration"],
  BASIC: ["Up to 10 bundles", "Mix & match mode", "Discount tiers", "Email support", "All Free features"],
  PRO: ["Unlimited bundles", "Analytics dashboard", "Priority support", "All Basic features"]
};
function BillingPage() {
  const { planId } = useLoaderData();
  const submit = useSubmit();
  const nav = useNavigation();
  const loading = nav.state === "submitting";
  return /* @__PURE__ */ jsx(Page, { title: "Plans & billing", backAction: { content: "Bundles", url: "/app" }, children: /* @__PURE__ */ jsxs(Layout, { children: [
    planId !== "FREE" && /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Banner, { tone: "success", title: `You are on the ${PLANS[planId].name} plan`, children: /* @__PURE__ */ jsx("p", { children: "Your subscription renews every 30 days. Cancel anytime." }) }) }),
    ["FREE", "BASIC", "PRO"].map((pid) => {
      const p = PLANS[pid];
      const isCurrent = pid === planId;
      const isDowngrade = pid === "FREE" && planId !== "FREE" || pid === "BASIC" && planId === "PRO";
      return /* @__PURE__ */ jsx(Layout.Section, { variant: "oneThird", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
        /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
          /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingLg", children: p.name }),
          isCurrent && /* @__PURE__ */ jsx(Badge, { tone: "success", children: "Current" })
        ] }),
        /* @__PURE__ */ jsx(Text, { as: "p", variant: "heading2xl", fontWeight: "bold", children: p.monthlyPrice === 0 ? "Free" : `$${p.monthlyPrice}/mo` }),
        /* @__PURE__ */ jsx(Divider, {}),
        /* @__PURE__ */ jsx(List, { children: FEATURES[pid].map((f) => /* @__PURE__ */ jsx(List.Item, { children: f }, f)) }),
        /* @__PURE__ */ jsx(Box, { paddingBlockStart: "200", children: isCurrent ? pid !== "FREE" ? /* @__PURE__ */ jsx(Button, { tone: "critical", onClick: () => submit({ intent: "cancel" }, { method: "post" }), loading, fullWidth: true, children: "Cancel subscription" }) : /* @__PURE__ */ jsx(Button, { disabled: true, fullWidth: true, children: "Current plan" }) : isDowngrade ? /* @__PURE__ */ jsxs(Button, { onClick: () => submit({ intent: "cancel" }, { method: "post" }), loading, fullWidth: true, children: [
          "Downgrade to ",
          p.name
        ] }) : /* @__PURE__ */ jsxs(Button, { variant: "primary", onClick: () => submit({ intent: "upgrade", plan: pid }, { method: "post" }), loading, fullWidth: true, children: [
          "Upgrade to ",
          p.name
        ] }) })
      ] }) }) }, pid);
    })
  ] }) });
}
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  default: BillingPage,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
async function loader$1({ request }) {
  const { session } = await authenticate.admin(request);
  const [bundles, planId] = await Promise.all([
    getBundles(session.shop),
    getActivePlan(request)
  ]);
  return json({
    bundles,
    planId,
    plan: PLANS$1[planId],
    canCreate: canCreateBundle(PLANS$1[planId], bundles.length),
    gateMsg: canCreateBundle(PLANS$1[planId], bundles.length) ? null : gateMessage("bundleLimit")
  });
}
async function action$1({ request }) {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = form.get("intent");
  if (intent === "delete") {
    await deleteBundle(form.get("id"), session.shop);
    await syncBundlesMetafield(request, session.shop);
    return json({ ok: true });
  }
  return json({ ok: false }, { status: 400 });
}
function AppIndex() {
  const { bundles, planId, plan, canCreate, gateMsg } = useLoaderData();
  const navigate = useNavigate();
  const submit = useSubmit();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const planBadge = planId === "PRO" ? /* @__PURE__ */ jsx(Badge, { tone: "success", children: "Pro" }) : planId === "BASIC" ? /* @__PURE__ */ jsx(Badge, { tone: "info", children: "Basic" }) : /* @__PURE__ */ jsx(Badge, { children: "Free" });
  const rows = bundles.map((b) => [
    /* @__PURE__ */ jsx(Text, { as: "span", fontWeight: "semibold", children: b.title }),
    /* @__PURE__ */ jsx(Badge, { tone: b.status === "active" ? "success" : "warning", children: b.status === "active" ? "Active" : "Draft" }),
    b.mode === "mix_match" ? "Mix & match" : "Fixed",
    b.minItems + (b.maxItems ? `–${b.maxItems}` : "+"),
    new Date(b.updatedAt).toLocaleDateString(),
    /* @__PURE__ */ jsxs(InlineStack, { gap: "200", children: [
      /* @__PURE__ */ jsx(Button, { size: "slim", onClick: () => navigate(`/app/bundles/${b.id}`), children: "Edit" }),
      /* @__PURE__ */ jsx(Button, { size: "slim", tone: "critical", onClick: () => setDeleteTarget({ id: b.id, title: b.title }), children: "Delete" })
    ] })
  ]);
  return /* @__PURE__ */ jsxs(
    Page,
    {
      title: "Bundle Builder",
      subtitle: /* @__PURE__ */ jsxs(InlineStack, { gap: "200", align: "center", children: [
        "Plan: ",
        planBadge
      ] }),
      primaryAction: { content: "Create bundle", disabled: !canCreate, onAction: () => navigate("/app/bundles/new") },
      secondaryActions: [{ content: "Upgrade plan", url: "/app/billing", disabled: planId === "PRO" }],
      children: [
        /* @__PURE__ */ jsxs(Layout, { children: [
          gateMsg && /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Banner, { title: "Bundle limit reached", tone: "warning", action: { content: "Upgrade plan", url: "/app/billing" }, children: /* @__PURE__ */ jsx("p", { children: gateMsg }) }) }),
          planId === "FREE" && !gateMsg && /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Banner, { title: "You're on the Free plan", tone: "info", action: { content: "See paid plans", url: "/app/billing" }, onDismiss: () => {
          }, children: /* @__PURE__ */ jsx("p", { children: "Unlock mix & match, discount tiers, and up to 10 bundles on the Basic plan ($9.99/mo)." }) }) }),
          /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { padding: "0", children: bundles.length === 0 ? /* @__PURE__ */ jsx(
            EmptyState,
            {
              heading: "Create your first bundle",
              action: { content: "Create bundle", onAction: () => navigate("/app/bundles/new") },
              image: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png",
              children: /* @__PURE__ */ jsx("p", { children: "Bundle products and offer tiered discounts to increase average order value." })
            }
          ) : /* @__PURE__ */ jsx(
            DataTable,
            {
              columnContentTypes: ["text", "text", "text", "text", "text", "text"],
              headings: ["Title", "Status", "Mode", "Items", "Updated", "Actions"],
              rows
            }
          ) }) }),
          /* @__PURE__ */ jsx(Layout.Section, { variant: "oneThird", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "300", children: [
            /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Your plan" }),
            /* @__PURE__ */ jsx(Divider, {}),
            /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
              /* @__PURE__ */ jsx(Text, { as: "span", tone: "subdued", children: "Plan" }),
              /* @__PURE__ */ jsx(Text, { as: "span", fontWeight: "semibold", children: plan.name })
            ] }),
            /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
              /* @__PURE__ */ jsx(Text, { as: "span", tone: "subdued", children: "Bundles" }),
              /* @__PURE__ */ jsxs(Text, { as: "span", children: [
                bundles.length,
                " / ",
                plan.maxBundles === Infinity ? "∞" : plan.maxBundles
              ] })
            ] }),
            /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
              /* @__PURE__ */ jsx(Text, { as: "span", tone: "subdued", children: "Mix & match" }),
              /* @__PURE__ */ jsx(Text, { as: "span", children: plan.mixMatch ? "✓" : "—" })
            ] }),
            /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
              /* @__PURE__ */ jsx(Text, { as: "span", tone: "subdued", children: "Discount tiers" }),
              /* @__PURE__ */ jsx(Text, { as: "span", children: plan.discountTiers ? "✓" : "—" })
            ] }),
            planId !== "PRO" && /* @__PURE__ */ jsx(Box, { paddingBlockStart: "200", children: /* @__PURE__ */ jsx(Button, { url: "/app/billing", variant: "primary", fullWidth: true, children: "Upgrade" }) })
          ] }) }) })
        ] }),
        /* @__PURE__ */ jsx(
          Modal,
          {
            open: !!deleteTarget,
            onClose: () => setDeleteTarget(null),
            title: "Delete bundle?",
            primaryAction: { content: "Delete", tone: "critical", onAction: () => {
              if (!deleteTarget) return;
              submit({ intent: "delete", id: deleteTarget.id }, { method: "post" });
              setDeleteTarget(null);
            } },
            secondaryActions: [{ content: "Cancel", onAction: () => setDeleteTarget(null) }],
            children: /* @__PURE__ */ jsx(Modal.Section, { children: /* @__PURE__ */ jsx(TextContainer, { children: /* @__PURE__ */ jsxs("p", { children: [
              "Delete ",
              /* @__PURE__ */ jsx("strong", { children: deleteTarget == null ? void 0 : deleteTarget.title }),
              "? This cannot be undone."
            ] }) }) })
          }
        )
      ]
    }
  );
}
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  default: AppIndex,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
async function action({ request }) {
  const { topic, shop, session, admin } = await authenticate.webhook(request);
  console.log(`[Webhook] ${topic} from ${shop}`);
  switch (topic) {
    case "APP_UNINSTALLED": {
      if (session) {
        await prisma.session.deleteMany({ where: { shop } });
        await prisma.shopPlan.deleteMany({ where: { shop } });
      }
      break;
    }
    case "SHOP_REDACT": {
      await Promise.all([
        prisma.bundle.deleteMany({ where: { shop } }),
        prisma.shopPlan.deleteMany({ where: { shop } }),
        prisma.session.deleteMany({ where: { shop } })
      ]);
      console.log(`[GDPR] Shop data erased for ${shop}`);
      break;
    }
    case "CUSTOMERS_REDACT": {
      console.log(`[GDPR] customers/redact received for ${shop} — no customer PII stored`);
      break;
    }
    case "CUSTOMERS_DATA_REQUEST": {
      console.log(`[GDPR] customers/data_request received for ${shop} — no customer PII stored`);
      break;
    }
    default: {
      console.log(`[Webhook] Unhandled topic: ${topic}`);
    }
  }
  return new Response(null, { status: 200 });
}
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action
}, Symbol.toStringTag, { value: "Module" }));
async function loader({ request }) {
  await authenticate.admin(request);
  return null;
}
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-wnxbMw29.js", "imports": ["/assets/components-DD5pm71o.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": true, "module": "/assets/root-wWVO7Hdh.js", "imports": ["/assets/components-DD5pm71o.js", "/assets/context-C1tChvG5.js", "/assets/context-B-rarNfi.js"], "css": [] }, "routes/app-proxy.bundle-products": { "id": "routes/app-proxy.bundle-products", "parentId": "root", "path": "app-proxy/bundle-products", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app-proxy.bundle-products-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/app.bundles.$id": { "id": "routes/app.bundles.$id", "parentId": "root", "path": "app/bundles/:id", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.bundles._id-BvJWH1_d.js", "imports": ["/assets/components-DD5pm71o.js", "/assets/Page-DizyFDBw.js", "/assets/DataTable-Dp5-2dfq.js", "/assets/context-C1tChvG5.js"], "css": [] }, "routes/app.billing": { "id": "routes/app.billing", "parentId": "root", "path": "app/billing", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.billing-D2fWI7sb.js", "imports": ["/assets/components-DD5pm71o.js", "/assets/Page-DizyFDBw.js", "/assets/context-C1tChvG5.js"], "css": [] }, "routes/app._index": { "id": "routes/app._index", "parentId": "root", "path": "app", "index": true, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app._index-BpwVOija.js", "imports": ["/assets/components-DD5pm71o.js", "/assets/Page-DizyFDBw.js", "/assets/DataTable-Dp5-2dfq.js", "/assets/context-C1tChvG5.js", "/assets/context-B-rarNfi.js"], "css": [] }, "routes/webhooks": { "id": "routes/webhooks", "parentId": "root", "path": "webhooks", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/webhooks-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/auth.$": { "id": "routes/auth.$", "parentId": "root", "path": "auth/*", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/auth._-l0sNRNKZ.js", "imports": [], "css": [] } }, "url": "/assets/manifest-1c11d23d.js", "version": "1c11d23d" };
const mode = "production";
const assetsBuildDirectory = "build\\client";
const basename = "/";
const future = { "v3_fetcherPersist": true, "v3_relativeSplatPath": true, "v3_throwAbortReason": true, "v3_routeConfig": false, "v3_singleFetch": false, "v3_lazyRouteDiscovery": false, "unstable_optimizeDeps": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/app-proxy.bundle-products": {
    id: "routes/app-proxy.bundle-products",
    parentId: "root",
    path: "app-proxy/bundle-products",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/app.bundles.$id": {
    id: "routes/app.bundles.$id",
    parentId: "root",
    path: "app/bundles/:id",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/app.billing": {
    id: "routes/app.billing",
    parentId: "root",
    path: "app/billing",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/app._index": {
    id: "routes/app._index",
    parentId: "root",
    path: "app",
    index: true,
    caseSensitive: void 0,
    module: route4
  },
  "routes/webhooks": {
    id: "routes/webhooks",
    parentId: "root",
    path: "webhooks",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/auth.$": {
    id: "routes/auth.$",
    parentId: "root",
    path: "auth/*",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  mode,
  publicPath,
  routes
};
