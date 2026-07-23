# Graph Report - Slingr  (2026-07-23)

## Corpus Check
- 171 files · ~283,083 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1040 nodes · 2602 edges · 85 communities (53 shown, 32 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7175a636`
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
- page.tsx
- WelcomeDiscountPopup.tsx
- BlogList.tsx
- next
- react-dom
- @stripe/stripe-js

## God Nodes (most connected - your core abstractions)
1. `useT()` - 88 edges
2. `getRedis()` - 64 edges
3. `formatPrice()` - 37 edges
4. `getCurrentSession()` - 37 edges
5. `useLang()` - 30 edges
6. `useCurrency()` - 23 edges
7. `p()` - 23 edges
8. `getPrice()` - 21 edges
9. `esc()` - 21 edges
10. `getClientIp()` - 17 edges

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

## Communities (85 total, 32 thin omitted)

### Community 0 - "Orders & Checkout Pipeline"
Cohesion: 0.19
Nodes (14): ReviewsAdminList(), ReviewsAdminListProps, fail(), GET(), POST(), ReviewErrorCode, parseUserAgent(), addReview() (+6 more)

### Community 1 - "Admin Accounts & Permissions"
Cohesion: 0.23
Nodes (18): DELETE(), GET(), PATCH(), POST(), requireMainAccount(), Account, addAccount(), deleteAccount() (+10 more)

### Community 2 - "Blog / Magazine CMS"
Cohesion: 0.10
Nodes (34): AdminSearch(), AdminSearchProps, CURRENCY_SYMBOLS, formatMoney(), ContentPreview(), czechDateToInputValue(), EMPTY_FORM, FormState (+26 more)

### Community 3 - "Products, Categories & Stock"
Cohesion: 0.20
Nodes (15): DELETE(), GET(), PATCH(), requireAccess(), addClaim(), Claim, CLAIM_STATUSES, ClaimOrderSummary (+7 more)

### Community 4 - "TypeScript Config & Refs"
Cohesion: 0.06
Nodes (30): ./*, dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+22 more)

### Community 5 - "getClientIp"
Cohesion: 0.38
Nodes (6): calcStats(), formatDate(), RecenzePage(), Review, ReviewCard(), Window

### Community 6 - "Address Autocomplete Form"
Cohesion: 0.15
Nodes (17): CategoryProductRows(), Footer(), ProductRow(), ProductRowT, TILE_STYLE, MediaItem, ProduktClient(), TILE_STYLE (+9 more)

### Community 7 - "Root Layout & Consent Tracking"
Cohesion: 0.14
Nodes (10): buildCategories(), CategorySection(), FaqCategory, FaqPage(), buildSteps(), defaultForm, FormState, ReklamaceAVraceniPage() (+2 more)

### Community 8 - "Admin Analytics Dashboard"
Cohesion: 0.14
Nodes (21): BarChart(), CURRENCY_LABELS, formatDateShort(), formatMoney(), RankedTable(), SectionCard(), StatCard(), AnalyticsPanel() (+13 more)

### Community 9 - "Reviews System"
Cohesion: 0.08
Nodes (39): metadata, metadata, LegalLayout(), Section(), PrivacyPage(), TermsPage(), calcAvg(), formatDate() (+31 more)

### Community 10 - "Cart Page (Kosik)"
Cohesion: 0.18
Nodes (10): _comment_browserslist, name, private, scripts, build, check:messages, dev, lint (+2 more)

### Community 11 - "Admin Authentication"
Cohesion: 0.19
Nodes (19): POST(), GET(), AddressBlock, createOrderDirect(), createPendingOrder(), generateId(), getOrder(), getOrderByNumber() (+11 more)

### Community 12 - "messages.ts"
Cohesion: 0.13
Nodes (21): MessagesAdminListProps, POST(), requireAccess(), DELETE(), GET(), PATCH(), requireAccess(), fail() (+13 more)

### Community 13 - "Category Listing & Featured Products"
Cohesion: 0.07
Nodes (51): DiscountsAdminPanel(), DiscountsAdminPanelProps, isExpired(), DELETE(), GET(), POST(), requirePermission(), CheckoutItem (+43 more)

### Community 14 - "Dev Tooling Dependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+13 more)

### Community 15 - "Product Detail Client"
Cohesion: 0.32
Nodes (7): CartContext, CartCtx, CartItem, CartProvider(), fetchDiscount(), PriceRaw, calcDiscount()

### Community 16 - "AdminDashboard.tsx"
Cohesion: 0.10
Nodes (20): ApiOrderItem, CopyButton(), DeliveryAddressBlock(), Dobirka(), KartaStripe(), Snapshot, SnapshotInfo, SnapshotItem (+12 more)

### Community 17 - "Address Lookup API (RUIAN)"
Cohesion: 0.29
Nodes (14): AdresaResult, callRuian(), capitalize(), formatPsc(), GET(), isJunkLokalita(), isMultiPsc(), isSilnaUlice() (+6 more)

### Community 18 - "Static Info Pages & Footer"
Cohesion: 0.08
Nodes (42): normalizePrice(), percentFromSale(), priceEquals(), ProductsAdminList(), ProductsAdminListProps, saleFromPercent(), POST(), StockEntryInput (+34 more)

### Community 19 - "Core NPM Dependencies"
Cohesion: 0.14
Nodes (46): PATCH(), VALID_PAYMENT_STATUSES, VALID_STATUSES, BankovniPrevod(), addressBlock(), bankTransferBlock(), campaignBodyToHtml(), claimDetailsTable() (+38 more)

### Community 20 - "adminAuth.ts"
Cohesion: 0.25
Nodes (8): browserslist, chrome >= 108, edge >= 108, firefox >= 108, ios_saf >= 15.4, not dead, not op_mini all, safari >= 15.4

### Community 21 - "priceOverrides.ts"
Cohesion: 0.19
Nodes (15): normalizeName(), POST(), verifyAccountPassword(), ADMIN_COOKIE_NAME, ADMIN_HINT_COOKIE_NAME, bufToHex(), checkPassword(), createSessionToken() (+7 more)

### Community 22 - "Product Search Bar"
Cohesion: 0.10
Nodes (24): ONasPage(), BlogPreviewList(), PreviewPost, CategoryGrid(), ChatWidget(), CheckoutStepper(), Newsletter(), HowItWorks() (+16 more)

### Community 23 - "dependencies"
Cohesion: 0.09
Nodes (23): fuse.js, google-auth-library, next-intl, dependencies, fuse.js, google-auth-library, next-intl, pdfkit (+15 more)

### Community 24 - "reviews.ts"
Cohesion: 0.15
Nodes (7): dead, DYNAMIC_NAMESPACES, errors, keys, messages, ROOT, used

### Community 25 - "priceOverrides.ts"
Cohesion: 0.33
Nodes (9): buildFuse(), expandQuery(), getCategoryLabel(), highlightMatch(), normalize(), SEARCH_SYNONYMS, SearchOverlay(), searchProducts() (+1 more)

### Community 26 - "index.ts"
Cohesion: 0.16
Nodes (12): AccountsAdminPanelProps, PERMISSION_LABELS, AdminDashboard(), AdminDashboardProps, getInitials(), Tab, CampaignSummary, Context (+4 more)

### Community 27 - "OrdersAdminList.tsx"
Cohesion: 0.25
Nodes (12): AdminPage(), POST(), PriceEntry, getEffectivePrice(), getPriceOverrides(), getProductsWithPriceOverrides(), getUnitAmountFor(), overrideKey() (+4 more)

### Community 28 - "page.tsx"
Cohesion: 0.07
Nodes (47): CookiesPage(), geistMono, geistSans, metadata, viewport, CookieBanner(), subscribeConsent(), capturePageview() (+39 more)

### Community 29 - "getCurrentSession"
Cohesion: 0.16
Nodes (14): ACTIVE_STATUSES, CURRENCY_SYMBOLS, formatDate(), formatMoney(), OrdersAdminList(), OrdersAdminListProps, PAYMENT_METHOD_LABELS, SHIPPING_PROVIDER_LABELS (+6 more)

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
Cohesion: 0.39
Nodes (8): POST(), sendOrderConfirmationEmail(), confirmPendingOrder(), markStockIssue(), captureServerEvent(), createPostHogServerClient(), PostHog, deductStockForItems()

### Community 35 - "browserslist"
Cohesion: 0.11
Nodes (16): Jazyky, Katalog a sklad, Kontrola před nasazením, Slingr, Spuštění, 1. Kde jsou data, 2. Sety (bundly), 3. Environment variables (+8 more)

### Community 37 - "index.ts"
Cohesion: 0.29
Nodes (11): GET(), POST(), requirePermission(), CampaignContext, campaignFrom(), CampaignSummary, getCampaignContext(), resolveSegmentId() (+3 more)

### Community 42 - "ReviewsAdminList.tsx"
Cohesion: 0.28
Nodes (14): InformacePage(), BESTSELLER_SLUGS, KosikPage(), ProductCard(), DiscountWidget(), Header(), ProductCard(), useCart() (+6 more)

### Community 44 - "priceOverrides.ts"
Cohesion: 0.39
Nodes (7): DiscountEntry, POST(), applyDiscountsToProducts(), applyDiscountToPrice(), discountKey(), setProductDiscountsBulk(), toPriceObject()

### Community 46 - "productDiscounts.ts"
Cohesion: 0.39
Nodes (6): GET(), DELETE(), findAccountById(), listOrders(), deleteReview(), getCurrentSession()

### Community 47 - "ProductsAdminList.tsx"
Cohesion: 0.27
Nodes (10): CURRENCIES, Currency, CurrencyCode, CurrencyContext, CurrencyContextType, currencyOf(), FONT_PATH, generatePaymentReceiptPdf() (+2 more)

### Community 48 - "getCurrentSession"
Cohesion: 0.24
Nodes (10): ClaimCard(), ClaimsAdminList(), ClaimsAdminListProps, money(), nextActions(), refundTotals(), STATUS_LABELS, statusClasses() (+2 more)

### Community 50 - "page.tsx"
Cohesion: 0.30
Nodes (11): ClaimsErrorCode, fail(), isFilled(), isValidAccount(), isValidOrderFormat(), isValidPhone(), POST(), checkAndSetClaimCooldown() (+3 more)

### Community 51 - "google-auth-library"
Cohesion: 0.36
Nodes (7): Order, ShippingProviderId, PROVIDERS, ShipmentResult, ShippingProvider, ShippingProviderNotConfiguredError, zasilkovnaProvider

### Community 76 - "posthog-js"
Cohesion: 0.27
Nodes (6): metadata, buildBenefits(), buildPaymentMethods(), buildShippingMethods(), DopravaClient(), DOBIRKA_FEE

### Community 77 - "posthog-node"
Cohesion: 0.33
Nodes (7): anyInStock(), KategorieClient(), maxStock(), TILE_STYLE, ProductPrice(), trackEvent(), getPrice()

### Community 78 - "resend"
Cohesion: 0.33
Nodes (5): KontaktPage(), socialLinks, HomeLink(), TODO: nahraď skutečnou adresou (tohle je zástupná)., UDAJE

### Community 79 - "page.tsx"
Cohesion: 0.32
Nodes (6): buildDopravyOptions(), buildPlatbyOptions(), MOCK_ZBOXES, ObjednavkaPage(), PacketaPoint, Window

### Community 80 - "WelcomeDiscountPopup.tsx"
Cohesion: 0.48
Nodes (5): WelcomeDiscountPopup(), readWelcomeDiscountState(), WelcomeDiscountState, WelcomeDiscountStatus, writeWelcomeDiscountState()

## Knowledge Gaps
- **261 isolated node(s):** `PERMISSION_LABELS`, `AccountsAdminPanelProps`, `AdminDashboardProps`, `AdminSearchProps`, `CURRENCY_SYMBOLS` (+256 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **32 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `qrcode` connect `Core NPM Dependencies` to `dependencies`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `Cart Page (Kosik)`, `next`, `react-dom`, `Core NPM Dependencies`, `lucide-react`, `@stripe/stripe-js`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `useT()` connect `Product Search Bar` to `getClientIp`, `Address Autocomplete Form`, `Root Layout & Consent Tracking`, `Reviews System`, `ReviewsAdminList.tsx`, `posthog-js`, `posthog-node`, `resend`, `page.tsx`, `AdminDashboard.tsx`, `BlogList.tsx`, `WelcomeDiscountPopup.tsx`, `Core NPM Dependencies`, `priceOverrides.ts`, `page.tsx`, `package.json`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **What connects `PERMISSION_LABELS`, `AccountsAdminPanelProps`, `AdminDashboardProps` to the rest of the system?**
  _261 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Blog / Magazine CMS` be split into smaller, more focused modules?**
  _Cohesion score 0.09898989898989899 - nodes in this community are weakly interconnected._
- **Should `TypeScript Config & Refs` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `Address Autocomplete Form` be split into smaller, more focused modules?**
  _Cohesion score 0.14666666666666667 - nodes in this community are weakly interconnected._