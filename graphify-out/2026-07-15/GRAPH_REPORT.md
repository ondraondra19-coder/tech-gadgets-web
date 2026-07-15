# Graph Report - hackpack-web  (2026-07-14)

## Corpus Check
- 133 files · ~311,448 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 795 nodes · 1629 edges · 78 communities (40 shown, 38 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fb871a52`
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
- Cart State & Discounts
- Order Form (Objednavka)
- Product Search Bar
- dependencies
- Privacy Policy, Header & Logo
- priceOverrides.ts
- package.json
- ProductsAdminList.tsx
- Reviews.tsx
- AdminSearch.tsx
- google-auth-library
- Product Export Script
- Product Update Script
- react
- Terms & Conditions Page
- Manual Translations Hook
- Instagram Feed Component
- i18n Request/Routing Config
- Next.js Config
- ESLint Config
- react-dom
- next-intl Dependency
- @stripe/stripe-js
- Stripe.js Dependency
- xlsx
- PostCSS Config
- page.tsx
- page.tsx
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
1. `getRedis()` - 48 edges
2. `getCurrentSession()` - 31 edges
3. `formatPrice()` - 27 edges
4. `useCurrency()` - 21 edges
5. `getPrice()` - 20 edges
6. `getProductsWithPriceOverrides()` - 17 edges
7. `compilerOptions` - 16 edges
8. `p()` - 15 edges
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

## Communities (78 total, 38 thin omitted)

### Community 0 - "Orders & Checkout Pipeline"
Cohesion: 0.08
Nodes (43): ACTIVE_STATUSES, CURRENCY_SYMBOLS, formatDate(), formatMoney(), OrdersAdminList(), OrdersAdminListProps, PAYMENT_METHOD_LABELS, SHIPPING_PROVIDER_LABELS (+35 more)

### Community 1 - "Admin Accounts & Permissions"
Cohesion: 0.07
Nodes (52): AccountsAdminPanelProps, PERMISSION_LABELS, AdminDashboard(), AdminDashboardProps, getInitials(), Tab, AdminPage(), DELETE() (+44 more)

### Community 2 - "Blog / Magazine CMS"
Cohesion: 0.11
Nodes (32): ContentPreview(), czechDateToInputValue(), EMPTY_FORM, FormState, inputValueToCzechDate(), MagazinAdminList(), checkAccess(), GET() (+24 more)

### Community 3 - "Products, Categories & Stock"
Cohesion: 0.10
Nodes (31): POST(), PriceEntry, getClientIp(), POST(), getClientIp(), POST(), GET(), benefits (+23 more)

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
Cohesion: 0.12
Nodes (25): BarChart(), CURRENCY_LABELS, formatDateShort(), formatMoney(), RankedTable(), SectionCard(), StatCard(), AnalyticsPanel() (+17 more)

### Community 9 - "Reviews System"
Cohesion: 0.15
Nodes (17): MessagesAdminListProps, POST(), requireAccess(), DELETE(), GET(), PATCH(), requireAccess(), getClientIp() (+9 more)

### Community 10 - "Cart Page (Kosik)"
Cohesion: 0.43
Nodes (5): CURRENCIES, Currency, CurrencyCode, CurrencyContext, CurrencyContextType

### Community 11 - "Admin Authentication"
Cohesion: 0.16
Nodes (16): dopravyOptions, ObjednavkaPage(), PacketaPoint, platbyOptions, Window, DiscountWidget(), CartContext, CartCtx (+8 more)

### Community 12 - "Homepage"
Cohesion: 0.13
Nodes (12): Home(), CategoryGrid(), HomeSlider(), slides, slidesData, calcAvg(), formatDate(), Review (+4 more)

### Community 13 - "Category Listing & Featured Products"
Cohesion: 0.25
Nodes (7): anyInStock(), Category, KategorieClient(), maxStock(), sortOptions, StockPill(), StoredReview

### Community 14 - "Dev Tooling Dependencies"
Cohesion: 0.11
Nodes (19): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+11 more)

### Community 15 - "Product Detail Client"
Cohesion: 0.14
Nodes (8): COLOR_MAP, isLayeredColor(), MediaItem, ProduktClient(), ModelColor, ModelColorLayered, StockData, useStockPolling()

### Community 16 - "Contact Messages"
Cohesion: 0.07
Nodes (32): AdminSearch(), AdminSearchProps, CURRENCY_SYMBOLS, formatMoney(), formatPrice(), normalizePrice(), priceEquals(), ProductsAdminList() (+24 more)

### Community 17 - "Address Lookup API (RUIAN)"
Cohesion: 0.29
Nodes (14): AdresaResult, callRuian(), capitalize(), formatPsc(), GET(), isJunkLokalita(), isMultiPsc(), isSilnaUlice() (+6 more)

### Community 18 - "Static Info Pages & Footer"
Cohesion: 0.12
Nodes (4): categories, footerNav, socialLinks, trustItems

### Community 19 - "Core NPM Dependencies"
Cohesion: 0.12
Nodes (10): BankovniPrevod(), Snapshot, SnapshotInfo, SnapshotItem, buildSpdString(), COMBINING_MARKS, QrPlatbaInput, stripDiacritics() (+2 more)

### Community 20 - "Cart State & Discounts"
Cohesion: 0.22
Nodes (25): addressBlock(), bankTransferBlock(), currencyOf(), getResendClient(), h1(), itemsTable(), layout(), orderNumber() (+17 more)

### Community 21 - "Order Form (Objednavka)"
Cohesion: 0.22
Nodes (13): BESTSELLER_SLUGS, COLOR_LABELS, getProductImgs(), KosikPage(), ProductCard(), translateValue(), SuccessContent(), FEATURED_SLUGS (+5 more)

### Community 22 - "Product Search Bar"
Cohesion: 0.26
Nodes (13): buildFuse(), CATEGORY_LABELS, ConfidentCard(), expandQuery(), getCategoryLabel(), highlightMatch(), isConfidentResult(), normalize() (+5 more)

### Community 23 - "dependencies"
Cohesion: 0.12
Nodes (17): fuse.js, lucide-react, next, next-intl, dependencies, fuse.js, lucide-react, next (+9 more)

### Community 24 - "Privacy Policy, Header & Logo"
Cohesion: 0.23
Nodes (11): Header(), languages, navRight, readLangFromCookie(), switchGoogleTranslate(), InfoGrid(), Logo(), useLang() (+3 more)

### Community 25 - "priceOverrides.ts"
Cohesion: 0.18
Nodes (19): DELETE(), GET(), POST(), requirePermission(), GET(), getClientIp(), APPROX_RATES, calcDiscount() (+11 more)

### Community 26 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 27 - "ProductsAdminList.tsx"
Cohesion: 0.21
Nodes (13): ReviewsAdminList(), ReviewsAdminListProps, GET(), POST(), parseUserAgent(), addReview(), checkAndSetCooldown(), getAllReviews() (+5 more)

### Community 28 - "Reviews.tsx"
Cohesion: 0.22
Nodes (4): defaultForm, FormState, returnMethods, steps

### Community 29 - "AdminSearch.tsx"
Cohesion: 0.38
Nodes (6): calcStats(), formatDate(), RecenzePage(), Review, ReviewCard(), Window

### Community 31 - "Product Export Script"
Cohesion: 0.29
Nodes (6): content, require, rows, wb, ws, xlsx

### Community 32 - "Product Update Script"
Cohesion: 0.29
Nodes (6): notFound, productsContent, require, rows, workbook, xlsx

### Community 34 - "Terms & Conditions Page"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 44 - "react-dom"
Cohesion: 0.50
Nodes (4): LangContext, LangProvider(), Locale, readLocale()

## Knowledge Gaps
- **228 isolated node(s):** `PERMISSION_LABELS`, `AccountsAdminPanelProps`, `AdminDashboardProps`, `AdminSearchProps`, `CURRENCY_SYMBOLS` (+223 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **38 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `qrcode` connect `Core NPM Dependencies` to `dependencies`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `react`, `resend`, `stripe`, `@stripe/stripe-js`, `Core NPM Dependencies`, `posthog-node`, `package.json`, `google-auth-library`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **What connects `PERMISSION_LABELS`, `AccountsAdminPanelProps`, `AdminDashboardProps` to the rest of the system?**
  _228 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Orders & Checkout Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.07542087542087542 - nodes in this community are weakly interconnected._
- **Should `Admin Accounts & Permissions` be split into smaller, more focused modules?**
  _Cohesion score 0.0684811237928007 - nodes in this community are weakly interconnected._
- **Should `Blog / Magazine CMS` be split into smaller, more focused modules?**
  _Cohesion score 0.10685249709639953 - nodes in this community are weakly interconnected._
- **Should `Products, Categories & Stock` be split into smaller, more focused modules?**
  _Cohesion score 0.10104529616724739 - nodes in this community are weakly interconnected._