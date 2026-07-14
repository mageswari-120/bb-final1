// app/routes/app.bundles.$id.tsx
import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useActionData, useNavigation, Form } from "@remix-run/react";
import {
  Page, Layout, Card, Button, TextField, Select, Checkbox,
  Banner, Badge, BlockStack, InlineStack, Text, Divider,
  DataTable, Box,
} from "@shopify/polaris";
import { useState } from "react";
import { authenticate }    from "../shopify.server";
import {
  getBundle, createBundle, updateBundle, syncBundlesMetafield,
  type BundleCreateInput,
} from "../lib/bundles.server";
import {
  getActivePlan, PLANS, canUseMixMatch, canUseDiscountTiers, gateMessage,
} from "../lib/billing.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const isNew = params.id === "new";
  const [bundle, planId] = await Promise.all([
    isNew ? null : getBundle(params.id!, session.shop),
    getActivePlan(request),
  ]);
  return json({
    bundle, isNew, planId, plan: PLANS[planId],
    allowMixMatch:  canUseMixMatch(PLANS[planId]),
    allowTiers:     canUseDiscountTiers(PLANS[planId]),
    mixMatchGate:   canUseMixMatch(PLANS[planId]) ? null : gateMessage("mixMatch"),
    tiersGate:      canUseDiscountTiers(PLANS[planId]) ? null : gateMessage("discountTiers"),
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const form  = await request.formData();
  const isNew = params.id === "new";

  const title        = (form.get("title")        as string).trim();
  const mode         = form.get("mode")          as "fixed" | "mix_match";
  const collectionId = (form.get("collectionId") as string).trim();
  const minItems     = parseInt(form.get("minItems") as string, 10);
  const maxItemsRaw  = form.get("maxItems") as string;
  const maxItems     = maxItemsRaw ? parseInt(maxItemsRaw, 10) : null;
  const allowRepeat  = form.get("allowRepeat") === "true";
  const heading      = (form.get("heading")   as string).trim();
  const subtitle     = (form.get("subtitle")  as string).trim();
  const ctaLabel     = (form.get("ctaLabel")  as string).trim();
  const tiersJson    = form.get("tiers")      as string;
  const status       = form.get("status")     as string;

  const errors: Record<string, string> = {};
  if (!title)        errors.title        = "Title is required.";
  if (!collectionId) errors.collectionId = "Collection GID is required.";
  if (isNaN(minItems) || minItems < 1) errors.minItems = "Must be at least 1.";
  if (maxItems && maxItems < minItems)  errors.maxItems = "Max must be ≥ min.";
  if (Object.keys(errors).length) return json({ errors }, { status: 422 });

  let tiers: any[] = [];
  try { tiers = JSON.parse(tiersJson || "[]"); } catch { tiers = []; }

  const payload: BundleCreateInput = {
    shop: session.shop, title, mode,
    sourceType: "collection", collectionId,
    minItems, maxItems, allowRepeat,
    status: status as "active" | "draft",
    display: { heading, subtitle, ctaLabel },
    tiers,
  };

  if (isNew) {
    const created = await createBundle(payload);
    await syncBundlesMetafield(request, session.shop);
    return redirect(`/app/bundles/${created.id}`);
  } else {
    await updateBundle(params.id!, payload);
    await syncBundlesMetafield(request, session.shop);
    return json({ ok: true, errors: {} });
  }
}

interface TierRow { minItems: number; discount: number; label: string }

export default function BundleForm() {
  const { bundle, isNew, planId, plan, allowMixMatch, allowTiers, mixMatchGate, tiersGate } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate   = useNavigate();
  const saving     = navigation.state === "submitting";
  const errors     = (actionData as any)?.errors ?? {};

  const [title,        setTitle]        = useState(bundle?.title ?? "");
  const [mode,         setMode]         = useState(bundle?.mode  ?? "fixed");
  const [collectionId, setCollectionId] = useState(bundle?.collectionId ?? "");
  const [minItems,     setMinItems]     = useState(String(bundle?.minItems ?? 1));
  const [maxItems,     setMaxItems]     = useState(String(bundle?.maxItems ?? ""));
  const [allowRepeat,  setAllowRepeat]  = useState(bundle?.allowRepeat ?? false);
  const [status,       setStatus]       = useState(bundle?.status ?? "draft");
  const [heading,      setHeading]      = useState(bundle?.display?.heading  ?? "Build your bundle");
  const [subtitle,     setSubtitle]     = useState(bundle?.display?.subtitle ?? "");
  const [ctaLabel,     setCtaLabel]     = useState(bundle?.display?.ctaLabel ?? "Add bundle to cart");
  const [tiers,        setTiers]        = useState<TierRow[]>(bundle?.tiers ?? []);
  const [tierMin,      setTierMin]      = useState("");
  const [tierDisc,     setTierDisc]     = useState("");
  const [tierLbl,      setTierLbl]      = useState("");

  function addTier() {
    const min = parseInt(tierMin, 10), disc = parseFloat(tierDisc);
    if (isNaN(min) || isNaN(disc)) return;
    setTiers(prev => [...prev, { minItems: min, discount: disc, label: tierLbl || `Save ${disc}%` }]
      .sort((a, b) => a.minItems - b.minItems));
    setTierMin(""); setTierDisc(""); setTierLbl("");
  }

  const tierRows = tiers.map((t, i) => [
    t.minItems, `${t.discount}%`, t.label,
    <Button size="slim" tone="critical" onClick={() => setTiers(p => p.filter((_, j) => j !== i))}>Remove</Button>,
  ]);

  return (
    <Page
      title={isNew ? "Create bundle" : `Edit: ${bundle?.title}`}
      backAction={{ content: "Bundles", url: "/app" }}
    >
      <Form method="post">
        <input type="hidden" name="tiers"       value={JSON.stringify(tiers)} />
        <input type="hidden" name="allowRepeat" value={String(allowRepeat)} />
        <input type="hidden" name="sourceType"  value="collection" />
        <Layout>
          {(actionData as any)?.ok && (
            <Layout.Section><Banner title="Bundle saved" tone="success" /></Layout.Section>
          )}
          {mixMatchGate && mode === "mix_match" && (
            <Layout.Section>
              <Banner tone="warning" action={{ content: "Upgrade", url: "/app/billing" }}>
                <p>{mixMatchGate}</p>
              </Banner>
            </Layout.Section>
          )}

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Bundle settings</Text>
                <TextField label="Title" name="title" value={title} onChange={setTitle} autoComplete="off" error={errors.title} helpText="Internal name." />
                <Select label="Bundle mode" name="mode"
                  options={[
                    { label: "Fixed bundle", value: "fixed" },
                    { label: allowMixMatch ? "Mix & match" : "Mix & match (Basic plan)", value: "mix_match", disabled: !allowMixMatch },
                  ]}
                  value={mode} onChange={v => setMode(v as any)}
                />
                <TextField label="Collection GID" name="collectionId" value={collectionId} onChange={setCollectionId} autoComplete="off" error={errors.collectionId} placeholder="gid://shopify/Collection/123456789" />
                <InlineStack gap="400">
                  <TextField label="Min items" name="minItems" type="number" value={minItems} onChange={setMinItems} autoComplete="off" error={errors.minItems} min="1" />
                  <TextField label="Max items (optional)" name="maxItems" type="number" value={maxItems} onChange={setMaxItems} autoComplete="off" error={errors.maxItems} min="1" />
                </InlineStack>
                {mode === "mix_match" && (
                  <Checkbox label="Allow duplicate products" checked={allowRepeat} onChange={setAllowRepeat} />
                )}
                <Select label="Status" name="status"
                  options={[{ label: "Draft", value: "draft" }, { label: "Active", value: "active" }]}
                  value={status} onChange={setStatus}
                />
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">Discount tiers</Text>
                  {!allowTiers && <Badge tone="warning">Basic plan required</Badge>}
                </InlineStack>
                {tiersGate ? (
                  <Banner tone="info" action={{ content: "Upgrade to Basic", url: "/app/billing" }}>
                    <p>{tiersGate}</p>
                  </Banner>
                ) : (
                  <>
                    {tiers.length > 0 && (
                      <DataTable columnContentTypes={["numeric","text","text","text"]} headings={["Min items","Discount","Label",""]} rows={tierRows} />
                    )}
                    <Divider />
                    <Text as="h3" variant="headingSm">Add a tier</Text>
                    <InlineStack gap="300" align="start">
                      <TextField label="Min items" type="number" value={tierMin} onChange={setTierMin} autoComplete="off" min="1" />
                      <TextField label="Discount %" type="number" value={tierDisc} onChange={setTierDisc} autoComplete="off" min="0" max="100" suffix="%" />
                      <TextField label="Label (optional)" value={tierLbl} onChange={setTierLbl} autoComplete="off" placeholder="Save 10%" />
                      <Box paddingBlockStart="600"><Button onClick={addTier}>Add tier</Button></Box>
                    </InlineStack>
                  </>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Storefront display</Text>
                <TextField label="Heading"    name="heading"  value={heading}   onChange={setHeading}  autoComplete="off" />
                <TextField label="Subtitle"   name="subtitle" value={subtitle}  onChange={setSubtitle} autoComplete="off" multiline={2} />
                <TextField label="CTA label"  name="ctaLabel" value={ctaLabel}  onChange={setCtaLabel} autoComplete="off" />
                <Text as="p" tone="subdued" variant="bodySm">
                  Bundle ID: <strong>{bundle?.id ?? "Assigned after creation"}</strong>
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <InlineStack gap="300" align="end">
              <Button url="/app">Cancel</Button>
              <Button variant="primary" submit loading={saving}>{isNew ? "Create bundle" : "Save changes"}</Button>
            </InlineStack>
          </Layout.Section>
        </Layout>
      </Form>
    </Page>
  );
}
