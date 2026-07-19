# Graph Report - Slingr  (2026-07-19)

## Corpus Check
- 170 files · ~130,513 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1033 nodes · 2490 edges · 72 communities (43 shown, 29 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `491bf616`
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
- index.ts
- Product Search Bar
- dependencies
- reviews.ts
- priceOverrides.ts
- getCurrentSession
- page.tsx
- Skladovost přes Google Sheets — návod k nastavení
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
- README.md
- next-intl Dependency
- graphify
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
2. `getRedis()` - 63 edges
3. `getCurrentSession()` - 37 edges
4. `formatPrice()` - 32 edges
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
- `AdminPage()` --indirect_call--> `toPublicAccount()`  [INFERRED]
  app/admin/page.tsx → lib/accounts.ts
- `isTypickaUlice()` --indirect_call--> `p()`  [INFERRED]
  app/api/adresa/route.ts → lib/email.ts
- `POST()` --indirect_call--> `p()`  [INFERRED]
  app/api/checkout/route.ts → lib/email.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Product stock lookup pipeline (customer request to StockBadge render)** — readme_stock_app_produkt_slug_page_tsx, readme_stock_getproductstock, readme_stock_google_sheets_api, readme_stock_components_produktclient_tsx, readme_stock_lookupstock, readme_stock_stockbadge [EXTRACTED 1.00]
- **Alternative Google Sheets authentication strategies** — readme_stock_google_sheets_api, readme_stock_service_account, readme_stock_google_auth_library [INFERRED 0.85]
- **Environment variables required for stock integration** — readme_stock_env_local, readme_stock_google_sheet_id, readme_stock_google_sheets_api_key [EXTRACTED 1.00]

## Communities (72 total, 29 thin omitted)

### Community 0 - "Orders & Checkout Pipeline"
Cohesion: 0.22
Nodes (14): GET(), fail(), NewsletterErrorCode, POST(), fail(), POST(), StockNotifyErrorCode, getClientIp() (+6 more)

### Community 1 - "Admin Accounts & Permissions"
Cohesion: 0.21
Nodes (20): DELETE(), GET(), PATCH(), POST(), requireMainAccount(), Account, addAccount(), deleteAccount() (+12 more)

### Community 2 - "Blog / Magazine CMS"
Cohesion: 0.10
Nodes (32): AdminSearch(), AdminSearchProps, CURRENCY_SYMBOLS, formatMoney(), ContentPreview(), czechDateToInputValue(), EMPTY_FORM, FormState (+24 more)

### Community 3 - "Products, Categories & Stock"
Cohesion: 0.10
Nodes (32): ClaimCard(), ClaimsAdminListProps, RESOLUTION_LABELS, STATUS_LABELS, STATUS_ORDER, statusClasses(), TYPE_LABELS, DELETE() (+24 more)

### Community 4 - "TypeScript Config & Refs"
Cohesion: 0.06
Nodes (30): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+22 more)

### Community 5 - "Docs: READMEs & Stock Setup Guide"
Cohesion: 0.19
Nodes (18): POST(), requireAccess(), DELETE(), GET(), PATCH(), requireAccess(), fail(), MessagesErrorCode (+10 more)

### Community 6 - "Address Autocomplete Form"
Cohesion: 0.11
Nodes (18): AddressBlock, AddressErrors, AdresaResult, cacheAdresa, cacheMesto, defaultForm(), emptyAddress(), formatPhone() (+10 more)

### Community 7 - "Root Layout & Consent Tracking"
Cohesion: 0.13
Nodes (17): geistMono, geistSans, metadata, viewport, CartContext, CartCtx, CartItem, CartProvider() (+9 more)

### Community 8 - "Admin Analytics Dashboard"
Cohesion: 0.06
Nodes (50): Tab, BarChart(), CURRENCY_LABELS, formatDateShort(), formatMoney(), RankedTable(), SectionCard(), StatCard() (+42 more)

### Community 9 - "Reviews System"
Cohesion: 0.23
Nodes (14): CheckoutItem, POST(), OrderReqItem, POST(), GET(), resolveDiscountForOrder(), isBankTransferEnabled(), getDobirkaFee() (+6 more)

### Community 10 - "Cart Page (Kosik)"
Cohesion: 0.13
Nodes (26): BESTSELLER_SLUGS, getProductImgs(), KosikPage(), ProductCard(), DiscountWidget(), Header(), ProductRow(), AddedModal() (+18 more)

### Community 11 - "Admin Authentication"
Cohesion: 0.15
Nodes (15): ACTIVE_STATUSES, CURRENCY_SYMBOLS, formatDate(), formatMoney(), OrdersAdminList(), OrdersAdminListProps, PAYMENT_METHOD_LABELS, SHIPPING_PROVIDER_LABELS (+7 more)

### Community 12 - "Homepage"
Cohesion: 0.09
Nodes (27): KategoriePage(), SITE_URL, sitemap(), STATIC_PAGES, CategoryProductRows(), HomeSlider(), slideSlugs, anyInStock() (+19 more)

### Community 13 - "Category Listing & Featured Products"
Cohesion: 0.07
Nodes (54): AdminPage(), POST(), PriceEntry, DiscountEntry, POST(), fail(), GET(), POST() (+46 more)

### Community 14 - "Dev Tooling Dependencies"
Cohesion: 0.05
Nodes (39): browserslist, _comment_browserslist, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+31 more)

### Community 15 - "Product Detail Client"
Cohesion: 0.24
Nodes (18): capturePageview(), clearPostHogStorage(), isAdminRoute(), isAdminSession(), PostHogProvider(), startPostHog(), stopPostHog(), syncTrackingState() (+10 more)

### Community 16 - "Contact Messages"
Cohesion: 0.30
Nodes (11): buildFuse(), ConfidentCard(), expandQuery(), getCategoryLabel(), highlightMatch(), isConfidentResult(), normalize(), SEARCH_SYNONYMS (+3 more)

### Community 17 - "Address Lookup API (RUIAN)"
Cohesion: 0.29
Nodes (14): AdresaResult, callRuian(), capitalize(), formatPsc(), GET(), isJunkLokalita(), isMultiPsc(), isSilnaUlice() (+6 more)

### Community 18 - "Static Info Pages & Footer"
Cohesion: 0.12
Nodes (14): AccountsAdminPanelProps, PERMISSION_LABELS, AdminDashboard(), AdminDashboardProps, getInitials(), CampaignSummary, Context, ReviewsAdminList() (+6 more)

### Community 19 - "Core NPM Dependencies"
Cohesion: 0.11
Nodes (54): PATCH(), VALID_PAYMENT_STATUSES, VALID_STATUSES, formatPrice(), approxConvert(), addressBlock(), bankTransferBlock(), campaignBodyToHtml() (+46 more)

### Community 20 - "discountsStore.ts"
Cohesion: 0.20
Nodes (14): normalizeName(), POST(), ADMIN_COOKIE_NAME, ADMIN_HINT_COOKIE_NAME, bufToHex(), checkPassword(), createSessionToken(), getKey() (+6 more)

### Community 21 - "index.ts"
Cohesion: 0.27
Nodes (10): POST(), Order, setOrderShipment(), ShippingProviderId, getShippingProvider(), PROVIDERS, ShipmentResult, ShippingProvider (+2 more)

### Community 22 - "Product Search Bar"
Cohesion: 0.06
Nodes (39): KontaktPage(), ONasPage(), ApiOrderItem, BankovniPrevod(), CopyButton(), DeliveryAddressBlock(), Dobirka(), KartaStripe() (+31 more)

### Community 23 - "dependencies"
Cohesion: 0.06
Nodes (33): dependencies, fuse.js, google-auth-library, lucide-react, next, next-intl, pdfkit, posthog-js (+25 more)

### Community 24 - "reviews.ts"
Cohesion: 0.15
Nodes (7): dead, DYNAMIC_NAMESPACES, errors, keys, messages, ROOT, used

### Community 25 - "priceOverrides.ts"
Cohesion: 0.29
Nodes (11): GET(), POST(), requirePermission(), CampaignContext, campaignFrom(), CampaignSummary, getCampaignContext(), resolveSegmentId() (+3 more)

### Community 27 - "getCurrentSession"
Cohesion: 0.30
Nodes (8): GET(), DELETE(), POST(), StockEntryInput, findAccountById(), listOrders(), deleteReview(), getCurrentSession()

### Community 28 - "page.tsx"
Cohesion: 0.12
Nodes (27): CookiesPage(), CookieBanner(), BROWSER_HELP, COOKIES_CATEGORIES, COOKIES_CONSENT_INTRO, COOKIES_INTRO, COOKIES_SUBTITLE, COOKIES_TITLE (+19 more)

### Community 29 - "Skladovost přes Google Sheets — návod k nastavení"
Cohesion: 0.17
Nodes (11): 1. Vytvoř Google Sheet, 2. Google Sheets API klíč (pro veřejný sheet), 3. (Alternativa) Service Account pro soukromý sheet, 4. Environment variables, 5. Soubory do projektu, 6. Jak to funguje, 7. Jak editovat skladovost, 8. Přidání nového produktu / kombinace (+3 more)

### Community 30 - "package.json"
Cohesion: 0.09
Nodes (25): metadata, buildCategories(), CategorySection(), FaqCategory, FaqPage(), buildDopravyOptions(), buildPlatbyOptions(), MOCK_ZBOXES (+17 more)

### Community 31 - "Product Export Script"
Cohesion: 0.29
Nodes (6): content, require, rows, wb, ws, xlsx

### Community 32 - "Product Update Script"
Cohesion: 0.29
Nodes (6): notFound, productsContent, require, rows, workbook, xlsx

### Community 33 - "Reviews.tsx"
Cohesion: 0.28
Nodes (5): buildReturnMethods(), buildSteps(), defaultForm, FormState, ReklamaceAVraceniPage()

### Community 34 - "Terms & Conditions Page"
Cohesion: 0.25
Nodes (9): GET(), AddressBlock, createOrderDirect(), generateId(), getPendingOrder(), initialPaymentStatus(), OrderItem, PaymentStatus (+1 more)

### Community 35 - "browserslist"
Cohesion: 0.46
Nodes (7): POST(), sendOrderConfirmationEmail(), confirmPendingOrder(), markStockIssue(), captureServerEvent(), createPostHogServerClient(), deductStockForItems()

### Community 44 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 80 - "page.tsx"
Cohesion: 0.07
Nodes (45): calcStats(), formatDate(), RecenzePage(), Review, ReviewCard(), Window, metadata, metadata (+37 more)

## Knowledge Gaps
- **264 isolated node(s):** `PERMISSION_LABELS`, `AccountsAdminPanelProps`, `AdminDashboardProps`, `AdminSearchProps`, `CURRENCY_SYMBOLS` (+259 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `qrcode` connect `dependencies` to `Core NPM Dependencies`, `Product Search Bar`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `Dev Tooling Dependencies`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `useT()` connect `Product Search Bar` to `Reviews.tsx`, `Address Autocomplete Form`, `Cart Page (Kosik)`, `Homepage`, `page.tsx`, `Contact Messages`, `page.tsx`, `package.json`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **What connects `PERMISSION_LABELS`, `AccountsAdminPanelProps`, `AdminDashboardProps` to the rest of the system?**
  _264 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Blog / Magazine CMS` be split into smaller, more focused modules?**
  _Cohesion score 0.1024390243902439 - nodes in this community are weakly interconnected._
- **Should `Products, Categories & Stock` be split into smaller, more focused modules?**
  _Cohesion score 0.1006006006006006 - nodes in this community are weakly interconnected._
- **Should `TypeScript Config & Refs` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._