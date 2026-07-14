// app/routes/app.billing.tsx
import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page, Layout, Card, Button, Badge, BlockStack, InlineStack,
  Text, Divider, Banner, List, Box,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import {
  getActivePlan, requestUpgrade, cancelSubscription, PLANS, type PlanId,
} from "../lib/billing.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  const url = new URL(request.url);
  if (url.searchParams.get("charge_id")) return redirect("/app?upgraded=1");
  const planId = await getActivePlan(request);
  return json({ planId, plan: PLANS[planId] });
}

export async function action({ request }: ActionFunctionArgs) {
  const form   = await request.formData();
  const intent = form.get("intent") as string;
  const origin = new URL(request.url).origin;
  if (intent === "upgrade") {
    const confirmUrl = await requestUpgrade(
      request, form.get("plan") as Exclude<PlanId, "FREE">, `${origin}/app/billing`
    );
    return redirect(confirmUrl);
  }
  if (intent === "cancel") {
    await cancelSubscription(request);
    return redirect("/app/billing");
  }
  return json({ ok: false }, { status: 400 });
}

const FEATURES: Record<PlanId, string[]> = {
  FREE:  ["1 bundle", "Fixed bundle mode", "Shopify AJAX cart integration"],
  BASIC: ["Up to 10 bundles", "Mix & match mode", "Discount tiers", "Email support", "All Free features"],
  PRO:   ["Unlimited bundles", "Analytics dashboard", "Priority support", "All Basic features"],
};

export default function BillingPage() {
  const { planId } = useLoaderData<typeof loader>();
  const submit     = useSubmit();
  const nav        = useNavigation();
  const loading    = nav.state === "submitting";

  return (
    <Page title="Plans & billing" backAction={{ content: "Bundles", url: "/app" }}>
      <Layout>
        {planId !== "FREE" && (
          <Layout.Section>
            <Banner tone="success" title={`You are on the ${PLANS[planId].name} plan`}>
              <p>Your subscription renews every 30 days. Cancel anytime.</p>
            </Banner>
          </Layout.Section>
        )}
        {(["FREE","BASIC","PRO"] as PlanId[]).map(pid => {
          const p = PLANS[pid];
          const isCurrent  = pid === planId;
          const isDowngrade = (pid === "FREE" && planId !== "FREE") || (pid === "BASIC" && planId === "PRO");
          return (
            <Layout.Section variant="oneThird" key={pid}>
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <Text as="h2" variant="headingLg">{p.name}</Text>
                    {isCurrent && <Badge tone="success">Current</Badge>}
                  </InlineStack>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {p.monthlyPrice === 0 ? "Free" : `$${p.monthlyPrice}/mo`}
                  </Text>
                  <Divider />
                  <List>{FEATURES[pid].map(f => <List.Item key={f}>{f}</List.Item>)}</List>
                  <Box paddingBlockStart="200">
                    {isCurrent ? (
                      pid !== "FREE"
                        ? <Button tone="critical" onClick={() => submit({ intent: "cancel" }, { method: "post" })} loading={loading} fullWidth>Cancel subscription</Button>
                        : <Button disabled fullWidth>Current plan</Button>
                    ) : isDowngrade ? (
                      <Button onClick={() => submit({ intent: "cancel" }, { method: "post" })} loading={loading} fullWidth>Downgrade to {p.name}</Button>
                    ) : (
                      <Button variant="primary" onClick={() => submit({ intent: "upgrade", plan: pid }, { method: "post" })} loading={loading} fullWidth>Upgrade to {p.name}</Button>
                    )}
                  </Box>
                </BlockStack>
              </Card>
            </Layout.Section>
          );
        })}
      </Layout>
    </Page>
  );
}
