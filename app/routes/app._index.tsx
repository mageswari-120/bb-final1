// app/routes/app._index.tsx
import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
import {
  Page, Layout, Card, Button, Banner, Badge, DataTable,
  EmptyState, Text, InlineStack, BlockStack, Box, Divider, Modal, TextContainer,
} from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { getBundles, deleteBundle, syncBundlesMetafield } from "../lib/bundles.server";
import { getActivePlan, PLANS, canCreateBundle, gateMessage } from "../lib/billing.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const [bundles, planId] = await Promise.all([
    getBundles(session.shop),
    getActivePlan(request),
  ]);
  return json({
    bundles,
    planId,
    plan:      PLANS[planId],
    canCreate: canCreateBundle(PLANS[planId], bundles.length),
    gateMsg:   canCreateBundle(PLANS[planId], bundles.length) ? null : gateMessage("bundleLimit"),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const form        = await request.formData();
  const intent      = form.get("intent") as string;
  if (intent === "delete") {
    await deleteBundle(form.get("id") as string, session.shop);
    await syncBundlesMetafield(request, session.shop);
    return json({ ok: true });
  }
  return json({ ok: false }, { status: 400 });
}

export default function AppIndex() {
  const { bundles, planId, plan, canCreate, gateMsg } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit   = useSubmit();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const planBadge =
    planId === "PRO"   ? <Badge tone="success">Pro</Badge> :
    planId === "BASIC" ? <Badge tone="info">Basic</Badge>  :
                         <Badge>Free</Badge>;

  const rows = bundles.map(b => [
    <Text as="span" fontWeight="semibold">{b.title}</Text>,
    <Badge tone={b.status === "active" ? "success" : "warning"}>
      {b.status === "active" ? "Active" : "Draft"}
    </Badge>,
    b.mode === "mix_match" ? "Mix & match" : "Fixed",
    b.minItems + (b.maxItems ? `–${b.maxItems}` : "+"),
    new Date(b.updatedAt).toLocaleDateString(),
    <InlineStack gap="200">
      <Button size="slim" onClick={() => navigate(`/app/bundles/${b.id}`)}>Edit</Button>
      <Button size="slim" tone="critical" onClick={() => setDeleteTarget({ id: b.id, title: b.title })}>Delete</Button>
    </InlineStack>,
  ]);

  return (
    <Page
      title="Bundle Builder"
      subtitle={<InlineStack gap="200" align="center">Plan: {planBadge}</InlineStack>}
      primaryAction={{ content: "Create bundle", disabled: !canCreate, onAction: () => navigate("/app/bundles/new") }}
      secondaryActions={[{ content: "Upgrade plan", url: "/app/billing", disabled: planId === "PRO" }]}
    >
      <Layout>
        {gateMsg && (
          <Layout.Section>
            <Banner title="Bundle limit reached" tone="warning" action={{ content: "Upgrade plan", url: "/app/billing" }}>
              <p>{gateMsg}</p>
            </Banner>
          </Layout.Section>
        )}
        {planId === "FREE" && !gateMsg && (
          <Layout.Section>
            <Banner title="You're on the Free plan" tone="info" action={{ content: "See paid plans", url: "/app/billing" }} onDismiss={() => {}}>
              <p>Unlock mix & match, discount tiers, and up to 10 bundles on the Basic plan ($9.99/mo).</p>
            </Banner>
          </Layout.Section>
        )}
        <Layout.Section>
          <Card padding="0">
            {bundles.length === 0 ? (
              <EmptyState
                heading="Create your first bundle"
                action={{ content: "Create bundle", onAction: () => navigate("/app/bundles/new") }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Bundle products and offer tiered discounts to increase average order value.</p>
              </EmptyState>
            ) : (
              <DataTable
                columnContentTypes={["text","text","text","text","text","text"]}
                headings={["Title","Status","Mode","Items","Updated","Actions"]}
                rows={rows}
              />
            )}
          </Card>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">Your plan</Text>
              <Divider />
              <InlineStack align="space-between">
                <Text as="span" tone="subdued">Plan</Text>
                <Text as="span" fontWeight="semibold">{plan.name}</Text>
              </InlineStack>
              <InlineStack align="space-between">
                <Text as="span" tone="subdued">Bundles</Text>
                <Text as="span">{bundles.length} / {plan.maxBundles === Infinity ? "∞" : plan.maxBundles}</Text>
              </InlineStack>
              <InlineStack align="space-between">
                <Text as="span" tone="subdued">Mix & match</Text>
                <Text as="span">{plan.mixMatch ? "✓" : "—"}</Text>
              </InlineStack>
              <InlineStack align="space-between">
                <Text as="span" tone="subdued">Discount tiers</Text>
                <Text as="span">{plan.discountTiers ? "✓" : "—"}</Text>
              </InlineStack>
              {planId !== "PRO" && (
                <Box paddingBlockStart="200">
                  <Button url="/app/billing" variant="primary" fullWidth>Upgrade</Button>
                </Box>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete bundle?"
        primaryAction={{ content: "Delete", tone: "critical", onAction: () => {
          if (!deleteTarget) return;
          submit({ intent: "delete", id: deleteTarget.id }, { method: "post" });
          setDeleteTarget(null);
        }}}
        secondaryActions={[{ content: "Cancel", onAction: () => setDeleteTarget(null) }]}
      >
        <Modal.Section>
          <TextContainer>
            <p>Delete <strong>{deleteTarget?.title}</strong>? This cannot be undone.</p>
          </TextContainer>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
