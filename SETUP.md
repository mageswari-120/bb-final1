# Bundle Builder — Setup Guide

## What's in this package

```
bundle-builder/
├── app/
│   ├── lib/
│   │   ├── billing.server.ts      # Plan definitions + Shopify billing API
│   │   ├── bundles.server.ts      # Bundle CRUD + metafield sync
│   │   ├── db.server.ts           # Prisma client singleton
│   │   └── products.server.ts     # Fetch products from Shopify Admin GraphQL
│   ├── routes/
│   │   ├── app._index.tsx         # Bundle list page
│   │   ├── app.billing.tsx        # Plan comparison + upgrade page
│   │   ├── app.bundles.$id.tsx    # Create / edit bundle form
│   │   ├── app-proxy.bundle-products.tsx  # App proxy endpoint for theme
│   │   ├── auth.$.tsx             # Auth callback
│   │   └── webhooks.tsx           # GDPR + app/uninstalled webhooks
│   ├── root.tsx
│   └── shopify.server.ts          # Shopify app config + billing plans
├── prisma/
│   └── schema.prisma              # Session + Bundle + ShopPlan models
├── sections/
│   └── bundle-builder.liquid      # Theme section (copy to your theme)
├── assets/
│   ├── bundle-builder.css         # Theme section styles (copy to your theme)
│   └── bundle-builder.js          # Theme section JS (copy to your theme)
├── locales/
│   └── en.default.schema.json     # Theme locale strings (merge into your theme)
├── .env.example
├── package.json
├── shopify.app.toml
├── tsconfig.json
└── vite.config.ts
```

---

## Step 1 — Shopify Partner setup

1. Go to https://partners.shopify.com and log in
2. Apps → Create app → **Public app**
3. Set App name: `Bundle Builder`
4. Note down **Client ID** and **Client secret**
5. Under **App setup** → App URL: (your production URL, set later)

---

## Step 2 — Local development setup

```bash
# Clone / extract this project
cd bundle-builder

# Install dependencies
npm install

# Copy env file
cp .env.example .env

# Fill in .env:
#   SHOPIFY_API_KEY=your_client_id
#   SHOPIFY_API_SECRET=your_client_secret
#   DATABASE_URL="file:./prisma/dev.db"
#   NODE_ENV=development

# Generate Prisma client + create DB
npx prisma migrate dev --name init

# Start dev server (uses Shopify CLI tunnel automatically)
npm run dev
```

The CLI will open a tunnel URL like `https://xxxxx.trycloudflare.com`.
Copy that URL and set it as the App URL in your Partner dashboard.

---

## Step 3 — Install on a dev store

1. In Partner dashboard → Apps → your app → **Select store**
2. Choose a development store and install

---

## Step 4 — Configure shopify.app.toml

Replace `YOUR_CLIENT_ID_HERE` and `YOUR_APP_URL_HERE` in `shopify.app.toml`:

```toml
client_id = "abc123..."
application_url = "https://your-app.fly.dev"
```

---

## Step 5 — Install theme section

Copy these 3 files into **every theme** where you want to use bundles:

```
sections/bundle-builder.liquid  →  your-theme/sections/
assets/bundle-builder.css       →  your-theme/assets/
assets/bundle-builder.js        →  your-theme/assets/
```

Merge the locale keys from `locales/en.default.schema.json` into:
```
your-theme/locales/en.default.schema.json
```

---

## Step 6 — Create your first bundle

1. In the app admin, click **Create bundle**
2. Paste a Shopify collection GID (`gid://shopify/Collection/XXXXXXXXX`)
   - Find it: Shopify Admin → Collections → click collection → URL contains the ID
3. Set min/max items and optional discount tiers
4. Set status to **Active** and save
5. Copy the **Bundle ID** shown at the bottom of the form

---

## Step 7 — Add section to a page

1. In Shopify Admin → Online Store → Themes → Customize
2. Navigate to any page (or create a new template)
3. Add section → **Bundle Builder**
4. Paste the **Bundle ID** into the section settings
5. Save — the bundle will render on the storefront

---

## Step 8 — Deploy to production

### Option A: Fly.io (recommended for Remix)

```bash
# Install Fly CLI: https://fly.io/docs/hands-on/install-flyctl/
fly auth login
fly launch          # follow prompts, choose region
fly secrets set SHOPIFY_API_KEY=xxx SHOPIFY_API_SECRET=xxx DATABASE_URL="file:./prisma/prod.db"
fly deploy
```

### Option B: Railway

```bash
# Connect GitHub repo to Railway
# Set env vars in Railway dashboard
# Railway auto-detects Node + runs npm run build && npm run start
```

After deploy:
1. Update `application_url` in `shopify.app.toml` to your production URL
2. Run: `shopify app deploy` to push config to Shopify
3. Update redirect URLs in Partner dashboard

---

## Step 9 — App Store submission checklist

- [ ] App works end-to-end on a dev store
- [ ] All 3 GDPR webhooks responding (app/uninstalled, shop/redact, customers/redact)
- [ ] Privacy policy URL set in Partner dashboard
- [ ] Support email set in Partner dashboard
- [ ] App listing: name, description, screenshots (1280×800px), icon (512×512px)
- [ ] Billing plans tested with test charges
- [ ] App URL is HTTPS and publicly accessible
- [ ] Submit via Partner dashboard → Apps → [your app] → Submit for review

---

## Plans

| Feature | Free | Basic ($9.99/mo) | Pro ($24.99/mo) |
|---|---|---|---|
| Bundles | 1 | 10 | Unlimited |
| Mix & match | ✗ | ✓ | ✓ |
| Discount tiers | ✗ | ✓ | ✓ |
| Analytics | ✗ | ✗ | ✓ |

---

## Architecture notes

- **App proxy**: Theme section JS calls `/apps/bundle-builder/api/bundle-products?bundle_id=X`
  which maps to `app/routes/app-proxy.bundle-products.tsx`
- **Metafield sync**: Every bundle save also writes active bundles to a shop metafield
  (`bundle_builder.bundles`) as a backup/cache for theme liquid access
- **Billing**: Source of truth is Shopify's billing API — `getActivePlan()` is called
  on every admin request, no stale plan state in DB
- **GDPR**: `webhooks.tsx` handles all 4 mandatory topics; Bundle Builder stores
  no customer PII (shop-level data only)
