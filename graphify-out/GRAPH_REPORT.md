# Graph Report - Slingr  (2026-07-19)

## Corpus Check
- 170 files · ~131,316 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1038 nodes · 2505 edges · 73 communities (45 shown, 28 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6d8d2f1f`
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
- getProductBySlug
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
4. `formatPrice()` - 34 edges
5. `useLang()` - 30 edges
6. `useCurrency()` - 23 edges
7. `p()` - 23 edges
8. `getPrice()` - 22 edges
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

## Communities (73 total, 28 thin omitted)

### Community 0 - "Orders & Checkout Pipeline"
Cohesion: 0.15
Nodes (12): ApiOrderItem, BankovniPrevod(), CopyButton(), DeliveryAddressBlock(), Dobirka(), KartaStripe(), Snapshot, SnapshotInfo (+4 more)

### Community 1 - "Admin Accounts & Permissions"
Cohesion: 0.07
Nodes (49): AccountsAdminPanelProps, PERMISSION_LABELS, AdminPage(), DELETE(), GET(), PATCH(), POST(), requireMainAccount() (+41 more)

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
Cohesion: 0.13
Nodes (21): MessagesAdminListProps, POST(), requireAccess(), DELETE(), GET(), PATCH(), requireAccess(), fail() (+13 more)

### Community 6 - "Address Autocomplete Form"
Cohesion: 0.11
Nodes (18): AddressBlock, AddressErrors, AdresaResult, cacheAdresa, cacheMesto, defaultForm(), emptyAddress(), formatPhone() (+10 more)

### Community 7 - "Root Layout & Consent Tracking"
Cohesion: 0.13
Nodes (21): geistMono, geistSans, metadata, viewport, DiscountWidget(), CartContext, CartCtx, CartItem (+13 more)

### Community 8 - "Admin Analytics Dashboard"
Cohesion: 0.05
Nodes (55): AdminDashboard(), AdminDashboardProps, getInitials(), Tab, BarChart(), CURRENCY_LABELS, formatDateShort(), formatMoney() (+47 more)

### Community 9 - "Reviews System"
Cohesion: 0.17
Nodes (12): calcStats(), formatDate(), RecenzePage(), Review, ReviewCard(), Window, calcAvg(), formatDate() (+4 more)

### Community 10 - "Cart Page (Kosik)"
Cohesion: 0.12
Nodes (19): BESTSELLER_SLUGS, getProductImgs(), KosikPage(), ProductCard(), AddedModal(), COLOR_MAP, Gallery(), isLayeredColor() (+11 more)

### Community 11 - "Admin Authentication"
Cohesion: 0.08
Nodes (44): ACTIVE_STATUSES, CURRENCY_SYMBOLS, formatDate(), formatMoney(), OrdersAdminList(), OrdersAdminListProps, PAYMENT_METHOD_LABELS, SHIPPING_PROVIDER_LABELS (+36 more)

### Community 12 - "Homepage"
Cohesion: 0.13
Nodes (12): SITE_URL, sitemap(), STATIC_PAGES, categories, Category, MediaItem, ModelColor, ProductColor (+4 more)

### Community 13 - "Category Listing & Featured Products"
Cohesion: 0.05
Nodes (70): POST(), PriceEntry, POST(), StockEntryInput, CheckoutItem, POST(), GET(), fail() (+62 more)

### Community 14 - "Dev Tooling Dependencies"
Cohesion: 0.05
Nodes (39): browserslist, _comment_browserslist, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+31 more)

### Community 15 - "Product Detail Client"
Cohesion: 0.16
Nodes (26): POST(), capturePageview(), clearPostHogStorage(), isAdminRoute(), isAdminSession(), PostHogProvider(), startPostHog(), stopPostHog() (+18 more)

### Community 16 - "Contact Messages"
Cohesion: 0.29
Nodes (12): buildFuse(), ConfidentCard(), expandQuery(), getCategoryLabel(), highlightMatch(), isConfidentResult(), normalize(), SEARCH_SYNONYMS (+4 more)

### Community 17 - "Address Lookup API (RUIAN)"
Cohesion: 0.29
Nodes (14): AdresaResult, callRuian(), capitalize(), formatPsc(), GET(), isJunkLokalita(), isMultiPsc(), isSilnaUlice() (+6 more)

### Community 18 - "Static Info Pages & Footer"
Cohesion: 0.18
Nodes (16): ReviewsAdminList(), ReviewsAdminListProps, fail(), GET(), POST(), ReviewErrorCode, sendReviewThankYouEmail(), parseUserAgent() (+8 more)

### Community 19 - "Core NPM Dependencies"
Cohesion: 0.15
Nodes (42): formatPrice(), approxConvert(), addressBlock(), bankTransferBlock(), campaignBodyToHtml(), CLAIM_RESOLUTION_LABELS, CLAIM_TYPE_LABELS, claimDetailsTable() (+34 more)

### Community 20 - "discountsStore.ts"
Cohesion: 0.35
Nodes (10): LangContext, LangProvider(), clearLegacyGoogtransCookie(), isLocale(), Locale, LOCALE_LABELS, LOCALES, readLegacyGoogtransLocale() (+2 more)

### Community 21 - "index.ts"
Cohesion: 0.29
Nodes (8): CategoryProductRows(), Footer(), Header(), ProductRow(), ProductRowT, TILE_STYLE, useLang(), getCategoryName()

### Community 22 - "Product Search Bar"
Cohesion: 0.09
Nodes (24): KontaktPage(), ONasPage(), BlogList(), ListPost, BlogPreview(), BlogPreviewList(), PreviewPost, CategoryGrid() (+16 more)

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
Cohesion: 0.35
Nodes (8): anyInStock(), KategorieClient(), maxStock(), TILE_STYLE, ProductPrice(), ProductCard(), getPrice(), useCurrency()

### Community 28 - "page.tsx"
Cohesion: 0.12
Nodes (27): CookiesPage(), CookieBanner(), BROWSER_HELP, COOKIES_CATEGORIES, COOKIES_CONSENT_INTRO, COOKIES_INTRO, COOKIES_SUBTITLE, COOKIES_TITLE (+19 more)

### Community 29 - "Skladovost přes Google Sheets — návod k nastavení"
Cohesion: 0.17
Nodes (11): 1. Vytvoř Google Sheet, 2. Google Sheets API klíč (pro veřejný sheet), 3. (Alternativa) Service Account pro soukromý sheet, 4. Environment variables, 5. Soubory do projektu, 6. Jak to funguje, 7. Jak editovat skladovost, 8. Přidání nového produktu / kombinace (+3 more)

### Community 30 - "package.json"
Cohesion: 0.17
Nodes (14): buildDopravyOptions(), buildPlatbyOptions(), MOCK_ZBOXES, ObjednavkaPage(), PacketaPoint, Window, COUNTRIES, PAYMENT_CANONICAL_NAMES (+6 more)

### Community 31 - "Product Export Script"
Cohesion: 0.29
Nodes (6): content, require, rows, wb, ws, xlsx

### Community 32 - "Product Update Script"
Cohesion: 0.29
Nodes (6): notFound, productsContent, require, rows, workbook, xlsx

### Community 33 - "Reviews.tsx"
Cohesion: 0.24
Nodes (6): Home(), buildReturnMethods(), buildSteps(), defaultForm, FormState, ReklamaceAVraceniPage()

### Community 34 - "Terms & Conditions Page"
Cohesion: 0.33
Nodes (3): metadata, socialLinks, HomeLink()

### Community 35 - "browserslist"
Cohesion: 0.38
Nodes (5): buildCategories(), CategorySection(), FaqCategory, FaqPage(), T

### Community 42 - "page.tsx"
Cohesion: 0.43
Nodes (5): buildBenefits(), buildPaymentMethods(), buildShippingMethods(), DopravaClient(), DOBIRKA_FEE

### Community 44 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 47 - "getProductBySlug"
Cohesion: 0.67
Nodes (3): HomeSlider(), slideSlugs, getProductBySlug()

### Community 80 - "page.tsx"
Cohesion: 0.12
Nodes (23): metadata, metadata, LegalLayout(), Section(), PrivacyPage(), TermsPage(), PRIVACY_BODY, PRIVACY_SUBTITLE (+15 more)

## Knowledge Gaps
- **267 isolated node(s):** `PERMISSION_LABELS`, `AccountsAdminPanelProps`, `AdminDashboardProps`, `AdminSearchProps`, `CURRENCY_SYMBOLS` (+262 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `Dev Tooling Dependencies`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `qrcode` connect `dependencies` to `Orders & Checkout Pipeline`, `Core NPM Dependencies`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `useT()` connect `Product Search Bar` to `Orders & Checkout Pipeline`, `Reviews.tsx`, `Terms & Conditions Page`, `browserslist`, `Address Autocomplete Form`, `Root Layout & Consent Tracking`, `Reviews System`, `Cart Page (Kosik)`, `page.tsx`, `getProductBySlug`, `page.tsx`, `Contact Messages`, `discountsStore.ts`, `index.ts`, `getCurrentSession`, `page.tsx`, `package.json`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **What connects `PERMISSION_LABELS`, `AccountsAdminPanelProps`, `AdminDashboardProps` to the rest of the system?**
  _267 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Accounts & Permissions` be split into smaller, more focused modules?**
  _Cohesion score 0.07242063492063493 - nodes in this community are weakly interconnected._
- **Should `Blog / Magazine CMS` be split into smaller, more focused modules?**
  _Cohesion score 0.10384615384615385 - nodes in this community are weakly interconnected._
- **Should `Products, Categories & Stock` be split into smaller, more focused modules?**
  _Cohesion score 0.1006006006006006 - nodes in this community are weakly interconnected._