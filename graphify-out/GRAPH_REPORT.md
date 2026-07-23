# Graph Report - Slingr  (2026-07-23)

## Corpus Check
- 174 files · ~283,941 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1049 nodes · 2634 edges · 67 communities (39 shown, 28 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e1fb4c09`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Orders & Checkout Pipeline
- Admin Accounts & Permissions
- Blog / Magazine CMS
- Products, Categories & Stock
- TypeScript Config & Refs
- getClientIp
- Address Autocomplete Form
- Root Layout & Consent Tracking
- Admin Analytics Dashboard
- Reviews System
- Cart Page (Kosik)
- Admin Authentication
- messages.ts
- Category Listing & Featured Products
- Dev Tooling Dependencies
- Product Detail Client
- AdminDashboard.tsx
- Address Lookup API (RUIAN)
- Static Info Pages & Footer
- Core NPM Dependencies
- Product Search Bar
- dependencies
- reviews.ts
- priceOverrides.ts
- index.ts
- page.tsx
- package.json
- Product Export Script
- Product Update Script
- route.ts
- Terms & Conditions Page
- browserslist
- index.ts
- i18n Request/Routing Config
- Next.js Config
- ReviewsAdminList.tsx
- ESLint Config
- next-intl Dependency
- ProductsAdminList.tsx
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
2. `getRedis()` - 67 edges
3. `getCurrentSession()` - 39 edges
4. `formatPrice()` - 37 edges
5. `useLang()` - 30 edges
6. `useCurrency()` - 23 edges
7. `p()` - 23 edges
8. `getPrice()` - 21 edges
9. `esc()` - 21 edges
10. `getProductsForDisplay()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `AdminSearch()` --indirect_call--> `p()`  [INFERRED]
  app/admin/AdminSearch.tsx → lib/email.ts
- `ProductsAdminList()` --indirect_call--> `czk()`  [INFERRED]
  app/admin/ProductsAdminList.tsx → content/legal/terms.tsx
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

## Communities (67 total, 28 thin omitted)

### Community 0 - "Orders & Checkout Pipeline"
Cohesion: 0.47
Nodes (4): ReviewsAdminList(), ReviewsAdminListProps, parseUserAgent(), Review

### Community 1 - "Admin Accounts & Permissions"
Cohesion: 0.22
Nodes (18): DELETE(), GET(), PATCH(), POST(), requireMainAccount(), Account, addAccount(), deleteAccount() (+10 more)

### Community 2 - "Blog / Magazine CMS"
Cohesion: 0.07
Nodes (43): AdminSearch(), AdminSearchProps, CURRENCY_SYMBOLS, formatMoney(), ContentPreview(), czechDateToInputValue(), EMPTY_FORM, FormState (+35 more)

### Community 3 - "Products, Categories & Stock"
Cohesion: 0.13
Nodes (24): ClaimCard(), ClaimsAdminList(), ClaimsAdminListProps, money(), nextActions(), refundTotals(), STATUS_LABELS, statusClasses() (+16 more)

### Community 4 - "TypeScript Config & Refs"
Cohesion: 0.06
Nodes (30): ./*, dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+22 more)

### Community 5 - "getClientIp"
Cohesion: 0.13
Nodes (22): calcStats(), formatDate(), RecenzePage(), Review, ReviewCard(), Window, calcAvg(), formatDate() (+14 more)

### Community 6 - "Address Autocomplete Form"
Cohesion: 0.09
Nodes (24): generateMetadata(), metaDescription(), SITE_URL, CategoryProductRows(), anyInStock(), KategorieClient(), maxStock(), TILE_STYLE (+16 more)

### Community 7 - "Root Layout & Consent Tracking"
Cohesion: 0.22
Nodes (5): buildSteps(), defaultForm, FormState, ReklamaceAVraceniPage(), returnDeadline()

### Community 8 - "Admin Analytics Dashboard"
Cohesion: 0.12
Nodes (23): Tab, BarChart(), CURRENCY_LABELS, formatDateShort(), formatMoney(), RankedTable(), SectionCard(), StatCard() (+15 more)

### Community 9 - "Reviews System"
Cohesion: 0.12
Nodes (23): metadata, metadata, LegalLayout(), Section(), PrivacyPage(), TermsPage(), PRIVACY_BODY, PRIVACY_SUBTITLE (+15 more)

### Community 10 - "Cart Page (Kosik)"
Cohesion: 0.20
Nodes (14): normalizeName(), POST(), ADMIN_COOKIE_NAME, ADMIN_HINT_COOKIE_NAME, bufToHex(), checkPassword(), createSessionToken(), getKey() (+6 more)

### Community 11 - "Admin Authentication"
Cohesion: 0.08
Nodes (40): ACTIVE_STATUSES, CURRENCY_SYMBOLS, formatDate(), formatMoney(), OrdersAdminList(), OrdersAdminListProps, PAYMENT_METHOD_LABELS, SHIPPING_PROVIDER_LABELS (+32 more)

### Community 12 - "messages.ts"
Cohesion: 0.16
Nodes (15): MessagesAdminListProps, POST(), requireAccess(), DELETE(), GET(), PATCH(), requireAccess(), sendMessageReplyEmail() (+7 more)

### Community 13 - "Category Listing & Featured Products"
Cohesion: 0.06
Nodes (64): DiscountsAdminPanel(), DiscountsAdminPanelProps, isExpired(), DELETE(), GET(), POST(), requirePermission(), CheckoutItem (+56 more)

### Community 14 - "Dev Tooling Dependencies"
Cohesion: 0.05
Nodes (39): eslint, eslint-config-next, browserslist, _comment_browserslist, devDependencies, eslint, eslint-config-next, tailwindcss (+31 more)

### Community 15 - "Product Detail Client"
Cohesion: 0.25
Nodes (9): AccountsAdminPanelProps, PERMISSION_LABELS, AdminDashboard(), AdminDashboardProps, getInitials(), PublicAccount, GRANTABLE_PERMISSIONS, Permission (+1 more)

### Community 16 - "AdminDashboard.tsx"
Cohesion: 0.26
Nodes (10): AdminPage(), GET(), POST(), StockEntryInput, findAccountById(), getAllAccounts(), listOrders(), getProductDiscounts() (+2 more)

### Community 17 - "Address Lookup API (RUIAN)"
Cohesion: 0.29
Nodes (14): AdresaResult, callRuian(), capitalize(), formatPsc(), GET(), isJunkLokalita(), isMultiPsc(), isSilnaUlice() (+6 more)

### Community 18 - "Static Info Pages & Footer"
Cohesion: 0.06
Nodes (62): ProductOrderPanel(), normalizePrice(), percentFromSale(), priceEquals(), ProductsAdminList(), ProductsAdminListProps, saleFromPercent(), POST() (+54 more)

### Community 19 - "Core NPM Dependencies"
Cohesion: 0.11
Nodes (55): ClaimsErrorCode, fail(), isFilled(), isValidAccount(), isValidOrderFormat(), isValidPhone(), POST(), checkAndSetClaimCooldown() (+47 more)

### Community 22 - "Product Search Bar"
Cohesion: 0.07
Nodes (32): ONasPage(), ApiOrderItem, BankovniPrevod(), CopyButton(), DeliveryAddressBlock(), Dobirka(), KartaStripe(), Snapshot (+24 more)

### Community 23 - "dependencies"
Cohesion: 0.06
Nodes (33): fuse.js, google-auth-library, lucide-react, next, next-intl, dependencies, fuse.js, google-auth-library (+25 more)

### Community 24 - "reviews.ts"
Cohesion: 0.15
Nodes (7): dead, DYNAMIC_NAMESPACES, errors, keys, messages, ROOT, used

### Community 25 - "priceOverrides.ts"
Cohesion: 0.32
Nodes (7): buildFuse(), expandQuery(), highlightMatch(), normalize(), SEARCH_SYNONYMS, searchProducts(), SearchResult

### Community 28 - "page.tsx"
Cohesion: 0.08
Nodes (36): CookiesPage(), geistMono, geistSans, metadata, viewport, CookieBanner(), subscribeConsent(), WelcomeDiscountPopup() (+28 more)

### Community 30 - "package.json"
Cohesion: 0.11
Nodes (17): AddressBlock, AddressErrors, AdresaResult, cacheAdresa, cacheMesto, defaultForm(), emptyAddress(), formatPhone() (+9 more)

### Community 31 - "Product Export Script"
Cohesion: 0.29
Nodes (6): content, require, rows, wb, ws, xlsx

### Community 32 - "Product Update Script"
Cohesion: 0.29
Nodes (6): notFound, productsContent, require, rows, workbook, xlsx

### Community 33 - "route.ts"
Cohesion: 0.17
Nodes (24): POST(), capturePageview(), clearPostHogStorage(), isAdminRoute(), isAdminSession(), PostHogProvider(), startPostHog(), stopPostHog() (+16 more)

### Community 35 - "browserslist"
Cohesion: 0.11
Nodes (16): Jazyky, Katalog a sklad, Kontrola před nasazením, Slingr, Spuštění, 1. Kde jsou data, 2. Sety (bundly), 3. Environment variables (+8 more)

### Community 37 - "index.ts"
Cohesion: 0.29
Nodes (11): GET(), POST(), requirePermission(), CampaignContext, campaignFrom(), CampaignSummary, getCampaignContext(), resolveSegmentId() (+3 more)

### Community 42 - "ReviewsAdminList.tsx"
Cohesion: 0.16
Nodes (30): InformacePage(), BESTSELLER_SLUGS, KosikPage(), ProductCard(), ObjednavkaPage(), DiscountWidget(), Header(), ProductPrice() (+22 more)

### Community 47 - "ProductsAdminList.tsx"
Cohesion: 0.23
Nodes (13): DELETE(), fail(), GET(), POST(), ReviewErrorCode, sendReviewThankYouEmail(), addReview(), checkAndSetCooldown() (+5 more)

### Community 79 - "page.tsx"
Cohesion: 0.10
Nodes (22): buildCategories(), CategorySection(), FaqCategory, FaqPage(), buildDopravyOptions(), buildPlatbyOptions(), MOCK_ZBOXES, PacketaPoint (+14 more)

## Knowledge Gaps
- **261 isolated node(s):** `PERMISSION_LABELS`, `AccountsAdminPanelProps`, `AdminDashboardProps`, `AdminSearchProps`, `CURRENCY_SYMBOLS` (+256 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `qrcode` connect `dependencies` to `Core NPM Dependencies`, `Product Search Bar`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `useT()` connect `Product Search Bar` to `Blog / Magazine CMS`, `getClientIp`, `Address Autocomplete Form`, `Root Layout & Consent Tracking`, `Reviews System`, `ReviewsAdminList.tsx`, `Category Listing & Featured Products`, `page.tsx`, `priceOverrides.ts`, `page.tsx`, `package.json`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `Dev Tooling Dependencies`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **What connects `PERMISSION_LABELS`, `AccountsAdminPanelProps`, `AdminDashboardProps` to the rest of the system?**
  _261 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Blog / Magazine CMS` be split into smaller, more focused modules?**
  _Cohesion score 0.0671602326811211 - nodes in this community are weakly interconnected._
- **Should `Products, Categories & Stock` be split into smaller, more focused modules?**
  _Cohesion score 0.12962962962962962 - nodes in this community are weakly interconnected._
- **Should `TypeScript Config & Refs` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._