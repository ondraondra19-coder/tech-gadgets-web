# Graph Report - hackpack-web  (2026-07-15)

## Corpus Check
- 134 files · ~313,021 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 807 nodes · 1683 edges · 73 communities (38 shown, 35 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `903fd2ce`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Orders & Checkout Pipeline
- Admin Accounts & Permissions
- Blog / Magazine CMS
- Products, Categories & Stock
- TypeScript Config & Refs
- Docs: READMEs & Stock Setup Guide
- Address Autocomplete Form
- Root Layout & Consent Tracking
- Admin Analytics Dashboard
- Reviews System
- Cart Page (Kosik)
- Admin Authentication
- Homepage
- Category Listing & Featured Products
- Dev Tooling Dependencies
- Product Detail Client
- Contact Messages
- Address Lookup API (RUIAN)
- Static Info Pages & Footer
- Core NPM Dependencies
- index.ts
- Order Form (Objednavka)
- Product Search Bar
- dependencies
- Privacy Policy, Header & Logo
- priceOverrides.ts
- package.json
- KategorieClient.tsx
- currency.ts
- Product Export Script
- Product Update Script
- react
- Terms & Conditions Page
- Manual Translations Hook
- Instagram Feed Component
- i18n Request/Routing Config
- Next.js Config
- ESLint Config
- next-intl Dependency
- @stripe/stripe-js
- Stripe.js Dependency
- PostCSS Config
- DiscountWidget.tsx
- posthog-node
- app/page.tsx (entry page)
- create-next-app (bootstrap tool)
- Geist (Vercel font family)
- next/font (font optimization)
- Next.js (framework)
- app/api/stock/route.ts (client refresh endpoint)
- app/produkt/[slug]/page.tsx (server component)
- CACHE_TTL (3-minute cache mechanism)
- components/ProduktClient.tsx (client component)
- .env.local environment configuration
- google-auth-library (npm package)
- GOOGLE_SHEET_ID (env var)
- Google Sheet "Sklad" (stock data source)
- Google Sheets API
- GOOGLE_SHEETS_API_KEY (env var)
- lib/stock.ts (fetch + cache logic)
- products.ts (product slug/color/size source of truth)
- Service Account auth (private sheet alternative)
- StockBadge (UI component)
- Vercel (company/creator of Next.js)
- Vercel Platform (deployment target)
- resend
- stripe

## God Nodes (most connected - your core abstractions)
1. `getRedis()` - 49 edges
2. `getCurrentSession()` - 31 edges
3. `formatPrice()` - 28 edges
4. `useCurrency()` - 21 edges
5. `getPrice()` - 20 edges
6. `getProductsWithPriceOverrides()` - 17 edges
7. `p()` - 16 edges
8. `compilerOptions` - 16 edges
9. `getAllPosts()` - 14 edges
10. `useCart()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `AdminSearch()` --indirect_call--> `p()`  [INFERRED]
  app/admin/AdminSearch.tsx → lib/email.ts
- `ProductsAdminList()` --indirect_call--> `p()`  [INFERRED]
  app/admin/ProductsAdminList.tsx → lib/email.ts
- `isTypickaUlice()` --indirect_call--> `p()`  [INFERRED]
  app/api/adresa/route.ts → lib/email.ts
- `POST()` --indirect_call--> `p()`  [INFERRED]
  app/api/checkout/route.ts → lib/email.ts
- `POST()` --indirect_call--> `p()`  [INFERRED]
  app/api/orders/route.ts → lib/email.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Product stock lookup pipeline (customer request to StockBadge render)** — readme_stock_app_produkt_slug_page_tsx, readme_stock_getproductstock, readme_stock_google_sheets_api, readme_stock_components_produktclient_tsx, readme_stock_lookupstock, readme_stock_stockbadge [EXTRACTED 1.00]
- **Alternative Google Sheets authentication strategies** — readme_stock_google_sheets_api, readme_stock_service_account, readme_stock_google_auth_library [INFERRED 0.85]
- **Environment variables required for stock integration** — readme_stock_env_local, readme_stock_google_sheet_id, readme_stock_google_sheets_api_key [EXTRACTED 1.00]

## Communities (73 total, 35 thin omitted)

### Community 0 - "Orders & Checkout Pipeline"
Cohesion: 0.15
Nodes (15): ACTIVE_STATUSES, CURRENCY_SYMBOLS, formatDate(), formatMoney(), OrdersAdminList(), OrdersAdminListProps, PAYMENT_METHOD_LABELS, SHIPPING_PROVIDER_LABELS (+7 more)

### Community 1 - "Admin Accounts & Permissions"
Cohesion: 0.07
Nodes (49): AccountsAdminPanelProps, PERMISSION_LABELS, AdminDashboard(), AdminDashboardProps, getInitials(), AdminPage(), DELETE(), GET() (+41 more)

### Community 2 - "Blog / Magazine CMS"
Cohesion: 0.10
Nodes (32): ContentPreview(), czechDateToInputValue(), EMPTY_FORM, FormState, inputValueToCzechDate(), MagazinAdminList(), checkAccess(), GET() (+24 more)

### Community 3 - "Products, Categories & Stock"
Cohesion: 0.07
Nodes (54): POST(), StockEntryInput, getClientIp(), POST(), GET(), GET(), getClientIp(), getClientIp() (+46 more)

### Community 4 - "TypeScript Config & Refs"
Cohesion: 0.06
Nodes (30): ./*, dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+22 more)

### Community 5 - "Docs: READMEs & Stock Setup Guide"
Cohesion: 0.17
Nodes (11): 1. Vytvoř Google Sheet, 2. Google Sheets API klíč (pro veřejný sheet), 3. (Alternativa) Service Account pro soukromý sheet, 4. Environment variables, 5. Soubory do projektu, 6. Jak to funguje, 7. Jak editovat skladovost, 8. Přidání nového produktu / kombinace (+3 more)

### Community 6 - "Address Autocomplete Form"
Cohesion: 0.11
Nodes (18): AddressBlock, AddressErrors, AdresaResult, cacheAdresa, cacheMesto, defaultForm(), emptyAddress(), formatPhone() (+10 more)

### Community 7 - "Root Layout & Consent Tracking"
Cohesion: 0.19
Nodes (16): geistMono, geistSans, metadata, viewport, CookieBanner(), getConsent(), hasAnalyticsConsent(), capturePageview() (+8 more)

### Community 8 - "Admin Analytics Dashboard"
Cohesion: 0.11
Nodes (27): Tab, BarChart(), CURRENCY_LABELS, formatDateShort(), formatMoney(), RankedTable(), SectionCard(), StatCard() (+19 more)

### Community 9 - "Reviews System"
Cohesion: 0.14
Nodes (18): MessagesAdminListProps, POST(), requireAccess(), DELETE(), GET(), PATCH(), requireAccess(), getClientIp() (+10 more)

### Community 10 - "Cart Page (Kosik)"
Cohesion: 0.20
Nodes (14): ReviewsAdminList(), ReviewsAdminListProps, GET(), POST(), sendReviewThankYouEmail(), parseUserAgent(), addReview(), checkAndSetCooldown() (+6 more)

### Community 11 - "Admin Authentication"
Cohesion: 0.32
Nodes (7): CartContext, CartCtx, CartItem, CartProvider(), fetchDiscount(), itemKey(), PriceRaw

### Community 12 - "Homepage"
Cohesion: 0.13
Nodes (8): Snapshot, SnapshotInfo, SnapshotItem, ClientAnalyticsEventMap, ClientAnalyticsEventName, identifyUser(), ServerAnalyticsEventMap, ServerAnalyticsEventName

### Community 14 - "Dev Tooling Dependencies"
Cohesion: 0.11
Nodes (19): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+11 more)

### Community 15 - "Product Detail Client"
Cohesion: 0.06
Nodes (32): AdminSearch(), AdminSearchProps, CURRENCY_SYMBOLS, formatMoney(), formatPrice(), normalizePrice(), priceEquals(), ProductsAdminList() (+24 more)

### Community 16 - "Contact Messages"
Cohesion: 0.14
Nodes (8): COLOR_MAP, isLayeredColor(), MediaItem, ProduktClient(), ModelColor, ModelColorLayered, StockData, useStockPolling()

### Community 17 - "Address Lookup API (RUIAN)"
Cohesion: 0.29
Nodes (14): AdresaResult, callRuian(), capitalize(), formatPsc(), GET(), isJunkLokalita(), isMultiPsc(), isSilnaUlice() (+6 more)

### Community 18 - "Static Info Pages & Footer"
Cohesion: 0.05
Nodes (18): categories, calcStats(), formatDate(), RecenzePage(), Review, ReviewCard(), Window, team (+10 more)

### Community 19 - "Core NPM Dependencies"
Cohesion: 0.13
Nodes (39): PATCH(), VALID_PAYMENT_STATUSES, VALID_STATUSES, BankovniPrevod(), addressBlock(), bankTransferBlock(), currencyOf(), getResendClient() (+31 more)

### Community 20 - "index.ts"
Cohesion: 0.27
Nodes (10): POST(), Order, setOrderShipment(), ShippingProviderId, getShippingProvider(), PROVIDERS, ShipmentResult, ShippingProvider (+2 more)

### Community 21 - "Order Form (Objednavka)"
Cohesion: 0.15
Nodes (21): BESTSELLER_SLUGS, COLOR_LABELS, getProductImgs(), KosikPage(), ProductCard(), translateValue(), dopravyOptions, ObjednavkaPage() (+13 more)

### Community 22 - "Product Search Bar"
Cohesion: 0.15
Nodes (21): InfoGrid(), buildFuse(), CATEGORY_LABELS, ConfidentCard(), expandQuery(), getCategoryLabel(), highlightMatch(), isConfidentResult() (+13 more)

### Community 23 - "dependencies"
Cohesion: 0.12
Nodes (17): fuse.js, lucide-react, next, next-intl, dependencies, fuse.js, lucide-react, next (+9 more)

### Community 24 - "Privacy Policy, Header & Logo"
Cohesion: 0.31
Nodes (7): Header(), languages, navRight, readLangFromCookie(), switchGoogleTranslate(), Logo(), products

### Community 25 - "priceOverrides.ts"
Cohesion: 0.25
Nodes (5): benefits, metadata, paymentMethods, shippingMethods, DOBIRKA_FEE

### Community 26 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 27 - "KategorieClient.tsx"
Cohesion: 0.24
Nodes (8): anyInStock(), Category, KategorieClient(), maxStock(), sortOptions, StockPill(), StoredReview, trackEvent()

### Community 28 - "currency.ts"
Cohesion: 0.43
Nodes (5): CURRENCIES, Currency, CurrencyCode, CurrencyContext, CurrencyContextType

### Community 31 - "Product Export Script"
Cohesion: 0.29
Nodes (6): content, require, rows, wb, ws, xlsx

### Community 32 - "Product Update Script"
Cohesion: 0.29
Nodes (6): notFound, productsContent, require, rows, workbook, xlsx

### Community 34 - "Terms & Conditions Page"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 51 - "DiscountWidget.tsx"
Cohesion: 0.19
Nodes (19): DELETE(), GET(), POST(), requirePermission(), APPROX_RATES, calcDiscount(), Discount, DiscountCartItem (+11 more)

## Knowledge Gaps
- **230 isolated node(s):** `PERMISSION_LABELS`, `AccountsAdminPanelProps`, `AdminDashboardProps`, `AdminSearchProps`, `CURRENCY_SYMBOLS` (+225 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **35 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `qrcode` connect `Core NPM Dependencies` to `dependencies`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `react`, `resend`, `Category Listing & Featured Products`, `stripe`, `@stripe/stripe-js`, `Core NPM Dependencies`, `posthog-node`, `package.json`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `bankTransferBlock()` connect `Core NPM Dependencies` to `Order Form (Objednavka)`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **What connects `PERMISSION_LABELS`, `AccountsAdminPanelProps`, `AdminDashboardProps` to the rest of the system?**
  _230 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Accounts & Permissions` be split into smaller, more focused modules?**
  _Cohesion score 0.0744047619047619 - nodes in this community are weakly interconnected._
- **Should `Blog / Magazine CMS` be split into smaller, more focused modules?**
  _Cohesion score 0.10365853658536585 - nodes in this community are weakly interconnected._
- **Should `Products, Categories & Stock` be split into smaller, more focused modules?**
  _Cohesion score 0.06621004566210045 - nodes in this community are weakly interconnected._