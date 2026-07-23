# Graph Report - Slingr  (2026-07-22)

## Corpus Check
- 172 files · ~288,146 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1064 nodes · 2661 edges · 79 communities (46 shown, 33 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b712451a`
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
- adminAuth.ts
- priceOverrides.ts
- Product Search Bar
- dependencies
- reviews.ts
- priceOverrides.ts
- index.ts
- OrdersAdminList.tsx
- page.tsx
- getCurrentSession
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
- priceOverrides.ts
- next-intl Dependency
- productDiscounts.ts
- ProductsAdminList.tsx
- getCurrentSession
- PostCSS Config
- page.tsx
- google-auth-library
- lucide-react
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
- posthog-js
- posthog-node
- resend

## God Nodes (most connected - your core abstractions)
1. `useT()` - 88 edges
2. `getRedis()` - 64 edges
3. `formatPrice()` - 37 edges
4. `getCurrentSession()` - 37 edges
5. `useLang()` - 30 edges
6. `p()` - 24 edges
7. `useCurrency()` - 23 edges
8. `getPrice()` - 21 edges
9. `esc()` - 21 edges
10. `ProduktClient()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `AdminSearch()` --indirect_call--> `p()`  [INFERRED]
  app/admin/AdminSearch.tsx → lib/email.ts
- `ProductsAdminList()` --indirect_call--> `czk()`  [INFERRED]
  app/admin/ProductsAdminList.tsx → content/legal/terms.tsx
- `ProductsAdminList()` --indirect_call--> `p()`  [INFERRED]
  app/admin/ProductsAdminList.tsx → lib/email.ts
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

## Communities (79 total, 33 thin omitted)

### Community 0 - "Orders & Checkout Pipeline"
Cohesion: 0.19
Nodes (15): ReviewsAdminList(), ReviewsAdminListProps, fail(), GET(), POST(), ReviewErrorCode, parseUserAgent(), addReview() (+7 more)

### Community 1 - "Admin Accounts & Permissions"
Cohesion: 0.20
Nodes (20): AdminPage(), DELETE(), GET(), PATCH(), POST(), requireMainAccount(), Account, addAccount() (+12 more)

### Community 2 - "Blog / Magazine CMS"
Cohesion: 0.09
Nodes (34): ContentPreview(), czechDateToInputValue(), EMPTY_FORM, FormState, inputValueToCzechDate(), MagazinAdminList(), checkAccess(), GET() (+26 more)

### Community 3 - "Products, Categories & Stock"
Cohesion: 0.08
Nodes (38): ClaimCard(), ClaimsAdminList(), ClaimsAdminListProps, money(), nextActions(), refundTotals(), STATUS_LABELS, statusClasses() (+30 more)

### Community 4 - "TypeScript Config & Refs"
Cohesion: 0.06
Nodes (30): ./*, dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+22 more)

### Community 5 - "getClientIp"
Cohesion: 0.13
Nodes (22): calcStats(), formatDate(), RecenzePage(), Review, ReviewCard(), Window, calcAvg(), formatDate() (+14 more)

### Community 6 - "Address Autocomplete Form"
Cohesion: 0.13
Nodes (17): AddedModal(), COLOR_MAP, Gallery(), isLayeredColor(), MediaItem, NotifyModal(), ProduktClient(), StockBadge() (+9 more)

### Community 7 - "Root Layout & Consent Tracking"
Cohesion: 0.18
Nodes (11): generateMetadata(), KategoriePage(), BundleItem, bundles, getCategoryBySlug(), getProductsByCategory(), MediaItem, ProductColor (+3 more)

### Community 8 - "Admin Analytics Dashboard"
Cohesion: 0.08
Nodes (42): BarChart(), CURRENCY_LABELS, formatDateShort(), formatMoney(), RankedTable(), SectionCard(), StatCard(), AnalyticsPanel() (+34 more)

### Community 9 - "Reviews System"
Cohesion: 0.08
Nodes (37): GET(), POST(), requirePermission(), KontaktPage(), metadata, metadata, LegalLayout(), Section() (+29 more)

### Community 10 - "Cart Page (Kosik)"
Cohesion: 0.18
Nodes (10): _comment_browserslist, name, private, scripts, build, check:messages, dev, lint (+2 more)

### Community 11 - "Admin Authentication"
Cohesion: 0.08
Nodes (37): ACTIVE_STATUSES, CURRENCY_SYMBOLS, formatDate(), formatMoney(), OrdersAdminList(), OrdersAdminListProps, PAYMENT_METHOD_LABELS, SHIPPING_PROVIDER_LABELS (+29 more)

### Community 12 - "messages.ts"
Cohesion: 0.18
Nodes (13): MessagesAdminListProps, POST(), requireAccess(), DELETE(), GET(), PATCH(), requireAccess(), deleteMessage() (+5 more)

### Community 13 - "Category Listing & Featured Products"
Cohesion: 0.07
Nodes (42): CheckoutItem, POST(), GET(), fail(), MessagesErrorCode, POST(), fail(), NewsletterErrorCode (+34 more)

### Community 14 - "Dev Tooling Dependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+13 more)

### Community 15 - "Product Detail Client"
Cohesion: 0.29
Nodes (9): CartContext, CartCtx, CartItem, CartProvider(), fetchDiscount(), itemKey(), PriceRaw, calcDiscount() (+1 more)

### Community 16 - "AdminDashboard.tsx"
Cohesion: 0.10
Nodes (24): buildCategories(), CategorySection(), FaqCategory, FaqPage(), buildDopravyOptions(), buildPlatbyOptions(), MOCK_ZBOXES, ObjednavkaPage() (+16 more)

### Community 17 - "Address Lookup API (RUIAN)"
Cohesion: 0.29
Nodes (14): AdresaResult, callRuian(), capitalize(), formatPsc(), GET(), isJunkLokalita(), isMultiPsc(), isSilnaUlice() (+6 more)

### Community 18 - "Static Info Pages & Footer"
Cohesion: 0.24
Nodes (16): Home(), expandBundle(), getBundleStock(), expandBundlesForStock(), fetchFromRedis(), getStock(), getStockMap(), isBundleSlug() (+8 more)

### Community 19 - "Core NPM Dependencies"
Cohesion: 0.13
Nodes (52): PATCH(), VALID_PAYMENT_STATUSES, VALID_STATUSES, formatPrice(), addressBlock(), bankTransferBlock(), campaignBodyToHtml(), claimDetailsTable() (+44 more)

### Community 20 - "adminAuth.ts"
Cohesion: 0.25
Nodes (8): browserslist, chrome >= 108, edge >= 108, firefox >= 108, ios_saf >= 15.4, not dead, not op_mini all, safari >= 15.4

### Community 21 - "priceOverrides.ts"
Cohesion: 0.19
Nodes (15): normalizeName(), POST(), verifyAccountPassword(), ADMIN_COOKIE_NAME, ADMIN_HINT_COOKIE_NAME, bufToHex(), checkPassword(), createSessionToken() (+7 more)

### Community 22 - "Product Search Bar"
Cohesion: 0.07
Nodes (33): ONasPage(), ApiOrderItem, BankovniPrevod(), CopyButton(), DeliveryAddressBlock(), Dobirka(), KartaStripe(), Snapshot (+25 more)

### Community 23 - "dependencies"
Cohesion: 0.09
Nodes (23): fuse.js, google-auth-library, next, next-intl, dependencies, fuse.js, google-auth-library, next (+15 more)

### Community 24 - "reviews.ts"
Cohesion: 0.15
Nodes (7): dead, DYNAMIC_NAMESPACES, errors, keys, messages, ROOT, used

### Community 25 - "priceOverrides.ts"
Cohesion: 0.33
Nodes (9): buildFuse(), expandQuery(), getCategoryLabel(), highlightMatch(), normalize(), SEARCH_SYNONYMS, SearchOverlay(), searchProducts() (+1 more)

### Community 26 - "index.ts"
Cohesion: 0.23
Nodes (10): AccountsAdminPanelProps, PERMISSION_LABELS, AdminDashboard(), AdminDashboardProps, getInitials(), Tab, PublicAccount, GRANTABLE_PERMISSIONS (+2 more)

### Community 27 - "OrdersAdminList.tsx"
Cohesion: 0.33
Nodes (9): POST(), PriceEntry, getEffectivePrice(), getPriceOverrides(), getProductsWithPriceOverrides(), getUnitAmountFor(), overrideKey(), setPriceOverridesBulk() (+1 more)

### Community 28 - "page.tsx"
Cohesion: 0.07
Nodes (51): CookiesPage(), geistMono, geistSans, metadata, viewport, CookieBanner(), subscribeConsent(), capturePageview() (+43 more)

### Community 29 - "getCurrentSession"
Cohesion: 0.24
Nodes (8): GET(), generateMetadata(), metaDescription(), ProduktPage(), SITE_URL, products, getProductStock(), StockKey

### Community 30 - "package.json"
Cohesion: 0.11
Nodes (18): AddressBlock, AddressErrors, AdresaResult, cacheAdresa, cacheMesto, defaultForm(), emptyAddress(), formatPhone() (+10 more)

### Community 31 - "Product Export Script"
Cohesion: 0.29
Nodes (6): content, require, rows, wb, ws, xlsx

### Community 32 - "Product Update Script"
Cohesion: 0.29
Nodes (6): notFound, productsContent, require, rows, workbook, xlsx

### Community 33 - "route.ts"
Cohesion: 0.31
Nodes (9): POST(), ServerAnalyticsEventMap, ServerAnalyticsEventName, confirmPendingOrder(), markStockIssue(), captureServerEvent(), createPostHogServerClient(), PostHog (+1 more)

### Community 35 - "browserslist"
Cohesion: 0.11
Nodes (16): Jazyky, Katalog a sklad, Kontrola před nasazením, Slingr, Spuštění, 1. Kde jsou data, 2. Sety (bundly), 3. Environment variables (+8 more)

### Community 37 - "index.ts"
Cohesion: 0.36
Nodes (9): normalizePrice(), percentFromSale(), priceEquals(), ProductsAdminList(), ProductsAdminListProps, saleFromPercent(), getProductBySlug(), getProductCombinations() (+1 more)

### Community 42 - "ReviewsAdminList.tsx"
Cohesion: 0.12
Nodes (32): BESTSELLER_SLUGS, getProductImgs(), KosikPage(), ProductCard(), CategoryProductRows(), DiscountWidget(), Footer(), Header() (+24 more)

### Community 44 - "priceOverrides.ts"
Cohesion: 0.33
Nodes (8): DiscountEntry, POST(), applyDiscountsToProducts(), applyDiscountToPrice(), discountKey(), setProductDiscountsBulk(), toPriceObject(), ProductModel

### Community 46 - "productDiscounts.ts"
Cohesion: 0.27
Nodes (8): GET(), DELETE(), POST(), StockEntryInput, findAccountById(), listOrders(), deleteReview(), getCurrentSession()

### Community 47 - "ProductsAdminList.tsx"
Cohesion: 0.44
Nodes (8): getRedis(), addWatcher(), fieldKey(), getWatchersForFields(), notifyAndRemove(), StockWatcher, watcherId(), watcherKey()

### Community 48 - "getCurrentSession"
Cohesion: 0.40
Nodes (5): AdminSearch(), AdminSearchProps, CURRENCY_SYMBOLS, formatMoney(), Product

## Knowledge Gaps
- **266 isolated node(s):** `PERMISSION_LABELS`, `AccountsAdminPanelProps`, `AdminDashboardProps`, `AdminSearchProps`, `CURRENCY_SYMBOLS` (+261 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `Cart Page (Kosik)`, `posthog-js`, `resend`, `page.tsx`, `google-auth-library`, `lucide-react`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Why does `qrcode` connect `dependencies` to `Core NPM Dependencies`, `Product Search Bar`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Why does `useT()` connect `Product Search Bar` to `Blog / Magazine CMS`, `getClientIp`, `Address Autocomplete Form`, `Reviews System`, `ReviewsAdminList.tsx`, `Category Listing & Featured Products`, `AdminDashboard.tsx`, `priceOverrides.ts`, `page.tsx`, `package.json`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **What connects `PERMISSION_LABELS`, `AccountsAdminPanelProps`, `AdminDashboardProps` to the rest of the system?**
  _266 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Blog / Magazine CMS` be split into smaller, more focused modules?**
  _Cohesion score 0.09098639455782313 - nodes in this community are weakly interconnected._
- **Should `Products, Categories & Stock` be split into smaller, more focused modules?**
  _Cohesion score 0.08350951374207188 - nodes in this community are weakly interconnected._
- **Should `TypeScript Config & Refs` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._