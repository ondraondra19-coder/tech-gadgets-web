# Graph Report - hackpack-web  (2026-07-18)

## Corpus Check
- 167 files · ~349,046 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1018 nodes · 2446 edges · 68 communities (40 shown, 28 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `63ee8076`
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
- discountsStore.ts
- Product Search Bar
- dependencies
- reviews.ts
- priceOverrides.ts
- page.tsx
- package.json
- Product Export Script
- Product Update Script
- Reviews.tsx
- Terms & Conditions Page
- browserslist
- Instagram Feed Component
- i18n Request/Routing Config
- Next.js Config
- page.tsx
- ESLint Config
- next-intl Dependency
- Stripe.js Dependency
- PostCSS Config
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
- page.tsx

## God Nodes (most connected - your core abstractions)
1. `useT()` - 88 edges
2. `getRedis()` - 60 edges
3. `getCurrentSession()` - 35 edges
4. `formatPrice()` - 34 edges
5. `useLang()` - 30 edges
6. `p()` - 23 edges
7. `useCurrency()` - 21 edges
8. `getPrice()` - 20 edges
9. `esc()` - 19 edges
10. `ProduktClient()` - 17 edges

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

## Communities (68 total, 28 thin omitted)

### Community 0 - "Orders & Checkout Pipeline"
Cohesion: 0.10
Nodes (35): GET(), POST(), requirePermission(), CheckoutItem, POST(), GET(), fail(), NewsletterErrorCode (+27 more)

### Community 1 - "Admin Accounts & Permissions"
Cohesion: 0.05
Nodes (68): AccountsAdminPanelProps, PERMISSION_LABELS, AdminDashboard(), AdminDashboardProps, getInitials(), Tab, CampaignSummary, Context (+60 more)

### Community 2 - "Blog / Magazine CMS"
Cohesion: 0.09
Nodes (33): ContentPreview(), czechDateToInputValue(), EMPTY_FORM, FormState, inputValueToCzechDate(), MagazinAdminList(), checkAccess(), GET() (+25 more)

### Community 3 - "Products, Categories & Stock"
Cohesion: 0.06
Nodes (54): ClaimCard(), ClaimsAdminListProps, RESOLUTION_LABELS, STATUS_LABELS, STATUS_ORDER, statusClasses(), TYPE_LABELS, MessagesAdminListProps (+46 more)

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
Cohesion: 0.09
Nodes (32): DiscountsAdminPanel(), DiscountsAdminPanelProps, isExpired(), DELETE(), GET(), POST(), requirePermission(), geistMono (+24 more)

### Community 8 - "Admin Analytics Dashboard"
Cohesion: 0.13
Nodes (22): BarChart(), CURRENCY_LABELS, formatDateShort(), formatMoney(), RankedTable(), SectionCard(), StatCard(), AnalyticsPanel() (+14 more)

### Community 9 - "Reviews System"
Cohesion: 0.21
Nodes (12): POST(), PriceEntry, GET(), KategoriePage(), getEffectivePrice(), getPriceOverrides(), getProductsWithPriceOverrides(), getUnitAmountFor() (+4 more)

### Community 10 - "Cart Page (Kosik)"
Cohesion: 0.14
Nodes (17): getProductImgs(), KosikPage(), AddedModal(), COLOR_MAP, Gallery(), isLayeredColor(), MediaItem, NotifyModal() (+9 more)

### Community 11 - "Admin Authentication"
Cohesion: 0.08
Nodes (43): ACTIVE_STATUSES, CURRENCY_SYMBOLS, formatDate(), formatMoney(), OrdersAdminList(), OrdersAdminListProps, PAYMENT_METHOD_LABELS, SHIPPING_PROVIDER_LABELS (+35 more)

### Community 12 - "Homepage"
Cohesion: 0.12
Nodes (14): AdminSearch(), AdminSearchProps, CURRENCY_SYMBOLS, formatMoney(), Category, getProductDescription(), MediaItem, ModelColorLayered (+6 more)

### Community 13 - "Category Listing & Featured Products"
Cohesion: 0.24
Nodes (12): POST(), StockEntryInput, fetchFromRedis(), getStock(), getStockMap(), makeKey(), notifyRestocked(), restockItems() (+4 more)

### Community 14 - "Dev Tooling Dependencies"
Cohesion: 0.05
Nodes (39): eslint, eslint-config-next, browserslist, _comment_browserslist, devDependencies, eslint, eslint-config-next, tailwindcss (+31 more)

### Community 15 - "Product Detail Client"
Cohesion: 0.16
Nodes (26): POST(), capturePageview(), clearPostHogStorage(), isAdminRoute(), isAdminSession(), PostHogProvider(), startPostHog(), stopPostHog() (+18 more)

### Community 16 - "Contact Messages"
Cohesion: 0.15
Nodes (28): BESTSELLER_SLUGS, ProductCard(), DiscountWidget(), anyInStock(), KategorieClient(), maxStock(), ProductRow(), buildFuse() (+20 more)

### Community 17 - "Address Lookup API (RUIAN)"
Cohesion: 0.29
Nodes (14): AdresaResult, callRuian(), capitalize(), formatPsc(), GET(), isJunkLokalita(), isMultiPsc(), isSilnaUlice() (+6 more)

### Community 18 - "Static Info Pages & Footer"
Cohesion: 0.48
Nodes (6): formatPrice(), normalizePrice(), priceEquals(), ProductsAdminList(), ProductsAdminListProps, getProductCombinations()

### Community 19 - "Core NPM Dependencies"
Cohesion: 0.13
Nodes (44): BankovniPrevod(), approxConvert(), addressBlock(), bankTransferBlock(), campaignBodyToHtml(), CLAIM_RESOLUTION_LABELS, CLAIM_TYPE_LABELS, claimDetailsTable() (+36 more)

### Community 20 - "discountsStore.ts"
Cohesion: 0.38
Nodes (4): GET(), ProduktPage(), getProductStock(), StockKey

### Community 22 - "Product Search Bar"
Cohesion: 0.07
Nodes (32): KontaktPage(), ONasPage(), ApiOrderItem, CopyButton(), DeliveryAddressBlock(), Dobirka(), KartaStripe(), Snapshot (+24 more)

### Community 23 - "dependencies"
Cohesion: 0.06
Nodes (31): fuse.js, google-auth-library, lucide-react, next, next-intl, dependencies, fuse.js, google-auth-library (+23 more)

### Community 24 - "reviews.ts"
Cohesion: 0.15
Nodes (7): dead, DYNAMIC_NAMESPACES, errors, keys, messages, ROOT, used

### Community 25 - "priceOverrides.ts"
Cohesion: 0.22
Nodes (15): fail(), POST(), StockNotifyErrorCode, HomeSlider(), slideSlugs, sendBackInStockEmail(), getProductBySlug(), addWatcher() (+7 more)

### Community 28 - "page.tsx"
Cohesion: 0.13
Nodes (26): CookieBanner(), BROWSER_HELP, COOKIES_CATEGORIES, COOKIES_CONSENT_INTRO, COOKIES_INTRO, COOKIES_SUBTITLE, COOKIES_TITLE, FOREVER (+18 more)

### Community 30 - "package.json"
Cohesion: 0.11
Nodes (20): metadata, buildDopravyOptions(), buildPlatbyOptions(), MOCK_ZBOXES, ObjednavkaPage(), PacketaPoint, Window, buildBenefits() (+12 more)

### Community 31 - "Product Export Script"
Cohesion: 0.29
Nodes (6): content, require, rows, wb, ws, xlsx

### Community 32 - "Product Update Script"
Cohesion: 0.29
Nodes (6): notFound, productsContent, require, rows, workbook, xlsx

### Community 33 - "Reviews.tsx"
Cohesion: 0.15
Nodes (11): buildCategories(), CategorySection(), FaqCategory, FaqPage(), Home(), buildReturnMethods(), buildSteps(), defaultForm (+3 more)

### Community 34 - "Terms & Conditions Page"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 35 - "browserslist"
Cohesion: 0.29
Nodes (9): CookiesPage(), CategoryProductRows(), Footer(), socialLinks, Header(), HomeLink(), useLang(), categories (+1 more)

### Community 42 - "page.tsx"
Cohesion: 0.13
Nodes (22): calcStats(), formatDate(), RecenzePage(), Review, ReviewCard(), Window, calcAvg(), formatDate() (+14 more)

### Community 80 - "page.tsx"
Cohesion: 0.12
Nodes (23): metadata, metadata, LegalLayout(), Section(), PrivacyPage(), TermsPage(), PRIVACY_BODY, PRIVACY_SUBTITLE (+15 more)

## Knowledge Gaps
- **264 isolated node(s):** `PERMISSION_LABELS`, `AccountsAdminPanelProps`, `AdminDashboardProps`, `AdminSearchProps`, `CURRENCY_SYMBOLS` (+259 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `qrcode` connect `Core NPM Dependencies` to `dependencies`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `Core NPM Dependencies`, `Dev Tooling Dependencies`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `useT()` connect `Product Search Bar` to `Reviews.tsx`, `Blog / Magazine CMS`, `browserslist`, `Address Autocomplete Form`, `Cart Page (Kosik)`, `page.tsx`, `Contact Messages`, `page.tsx`, `Core NPM Dependencies`, `priceOverrides.ts`, `page.tsx`, `package.json`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **What connects `PERMISSION_LABELS`, `AccountsAdminPanelProps`, `AdminDashboardProps` to the rest of the system?**
  _264 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Orders & Checkout Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.10144927536231885 - nodes in this community are weakly interconnected._
- **Should `Admin Accounts & Permissions` be split into smaller, more focused modules?**
  _Cohesion score 0.05030643513789581 - nodes in this community are weakly interconnected._
- **Should `Blog / Magazine CMS` be split into smaller, more focused modules?**
  _Cohesion score 0.0919661733615222 - nodes in this community are weakly interconnected._