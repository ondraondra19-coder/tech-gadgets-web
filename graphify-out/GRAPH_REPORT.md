# Graph Report - hackpack-web  (2026-07-16)

## Corpus Check
- 139 files · ~316,614 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 840 nodes · 1798 edges · 63 communities (34 shown, 29 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5311baf2`
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
- Order Form (Objednavka)
- Product Search Bar
- dependencies
- priceOverrides.ts
- KategorieClient.tsx
- products.ts
- Product Export Script
- Product Update Script
- Terms & Conditions Page
- Manual Translations Hook
- Instagram Feed Component
- i18n Request/Routing Config
- Next.js Config
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

## God Nodes (most connected - your core abstractions)
1. `getRedis()` - 49 edges
2. `getCurrentSession()` - 31 edges
3. `formatPrice()` - 30 edges
4. `useCurrency()` - 21 edges
5. `getPrice()` - 20 edges
6. `getProductsWithPriceOverrides()` - 17 edges
7. `p()` - 16 edges
8. `compilerOptions` - 16 edges
9. `getAllPosts()` - 14 edges
10. `POST()` - 13 edges

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

## Communities (63 total, 29 thin omitted)

### Community 0 - "Orders & Checkout Pipeline"
Cohesion: 0.07
Nodes (50): DELETE(), GET(), POST(), requirePermission(), POST(), GET(), GET(), POST() (+42 more)

### Community 1 - "Admin Accounts & Permissions"
Cohesion: 0.06
Nodes (62): AccountsAdminPanelProps, PERMISSION_LABELS, AdminDashboard(), AdminDashboardProps, getInitials(), AdminPage(), ReviewsAdminList(), ReviewsAdminListProps (+54 more)

### Community 2 - "Blog / Magazine CMS"
Cohesion: 0.09
Nodes (37): AdminSearch(), AdminSearchProps, CURRENCY_SYMBOLS, formatMoney(), ContentPreview(), czechDateToInputValue(), EMPTY_FORM, FormState (+29 more)

### Community 3 - "Products, Categories & Stock"
Cohesion: 0.26
Nodes (13): buildFuse(), CATEGORY_LABELS, ConfidentCard(), expandQuery(), getCategoryLabel(), highlightMatch(), isConfidentResult(), normalize() (+5 more)

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
Cohesion: 0.21
Nodes (16): CookiesPage(), StorageEntry, storageList, CookieBanner(), acceptAll(), clearConsent(), ConsentPreferences, getConsentPreferences() (+8 more)

### Community 8 - "Admin Analytics Dashboard"
Cohesion: 0.08
Nodes (34): Tab, BarChart(), CURRENCY_LABELS, formatDateShort(), formatMoney(), RankedTable(), SectionCard(), StatCard() (+26 more)

### Community 9 - "Reviews System"
Cohesion: 0.06
Nodes (37): POST(), PriceEntry, POST(), StockEntryInput, GET(), GET(), KategoriePage(), Home() (+29 more)

### Community 10 - "Cart Page (Kosik)"
Cohesion: 0.14
Nodes (17): MessagesAdminListProps, POST(), requireAccess(), DELETE(), GET(), PATCH(), requireAccess(), POST() (+9 more)

### Community 11 - "Admin Authentication"
Cohesion: 0.15
Nodes (15): ACTIVE_STATUSES, CURRENCY_SYMBOLS, formatDate(), formatMoney(), OrdersAdminList(), OrdersAdminListProps, PAYMENT_METHOD_LABELS, SHIPPING_PROVIDER_LABELS (+7 more)

### Community 12 - "Homepage"
Cohesion: 0.27
Nodes (10): POST(), Order, setOrderShipment(), ShippingProviderId, getShippingProvider(), PROVIDERS, ShipmentResult, ShippingProvider (+2 more)

### Community 13 - "Category Listing & Featured Products"
Cohesion: 0.22
Nodes (5): geistMono, geistSans, metadata, viewport, CurrencyProvider()

### Community 14 - "Dev Tooling Dependencies"
Cohesion: 0.07
Nodes (29): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+21 more)

### Community 15 - "Product Detail Client"
Cohesion: 0.13
Nodes (19): Snapshot, SnapshotInfo, SnapshotItem, SuccessContent(), capturePageview(), clearPostHogStorage(), isAdminRoute(), isAdminSession() (+11 more)

### Community 16 - "Contact Messages"
Cohesion: 0.16
Nodes (7): COLOR_MAP, isLayeredColor(), MediaItem, ProduktClient(), trackEvent(), StockData, useStockPolling()

### Community 17 - "Address Lookup API (RUIAN)"
Cohesion: 0.29
Nodes (14): AdresaResult, callRuian(), capitalize(), formatPsc(), GET(), isJunkLokalita(), isMultiPsc(), isSilnaUlice() (+6 more)

### Community 18 - "Static Info Pages & Footer"
Cohesion: 0.05
Nodes (18): categories, calcStats(), formatDate(), RecenzePage(), Review, ReviewCard(), Window, team (+10 more)

### Community 19 - "Core NPM Dependencies"
Cohesion: 0.11
Nodes (50): PATCH(), VALID_PAYMENT_STATUSES, VALID_STATUSES, ProductCard(), BankovniPrevod(), formatPrice(), approxConvert(), addressBlock() (+42 more)

### Community 21 - "Order Form (Objednavka)"
Cohesion: 0.15
Nodes (17): BESTSELLER_SLUGS, COLOR_LABELS, getProductImgs(), KosikPage(), translateValue(), DiscountWidget(), CartContext, CartCtx (+9 more)

### Community 22 - "Product Search Bar"
Cohesion: 0.16
Nodes (19): GoogleTranslate(), Header(), languages, navRight, readLangFromCookie(), switchGoogleTranslate(), InfoGrid(), Logo() (+11 more)

### Community 23 - "dependencies"
Cohesion: 0.06
Nodes (31): fuse.js, google-auth-library, lucide-react, next, next-intl, dependencies, fuse.js, google-auth-library (+23 more)

### Community 25 - "priceOverrides.ts"
Cohesion: 0.17
Nodes (10): dopravyOptions, MOCK_ZBOXES, PacketaPoint, platbyOptions, Window, CURRENCIES, Currency, CurrencyCode (+2 more)

### Community 27 - "KategorieClient.tsx"
Cohesion: 0.18
Nodes (14): ObjednavkaPage(), FEATURED_SLUGS, FeaturedProducts(), getVisibleCount(), anyInStock(), Category, KategorieClient(), maxStock() (+6 more)

### Community 28 - "products.ts"
Cohesion: 0.18
Nodes (8): MediaItem, ModelColor, ModelColorLayered, ProductColor, ProductCombination, ProductModel, ProductSize, Variant

### Community 31 - "Product Export Script"
Cohesion: 0.29
Nodes (6): content, require, rows, wb, ws, xlsx

### Community 32 - "Product Update Script"
Cohesion: 0.29
Nodes (6): notFound, productsContent, require, rows, workbook, xlsx

### Community 34 - "Terms & Conditions Page"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **237 isolated node(s):** `PERMISSION_LABELS`, `AccountsAdminPanelProps`, `AdminDashboardProps`, `AdminSearchProps`, `CURRENCY_SYMBOLS` (+232 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `Core NPM Dependencies`, `Dev Tooling Dependencies`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `qrcode` connect `Core NPM Dependencies` to `dependencies`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **What connects `PERMISSION_LABELS`, `AccountsAdminPanelProps`, `AdminDashboardProps` to the rest of the system?**
  _237 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Orders & Checkout Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.06573426573426573 - nodes in this community are weakly interconnected._
- **Should `Admin Accounts & Permissions` be split into smaller, more focused modules?**
  _Cohesion score 0.05771604938271605 - nodes in this community are weakly interconnected._
- **Should `Blog / Magazine CMS` be split into smaller, more focused modules?**
  _Cohesion score 0.08865248226950355 - nodes in this community are weakly interconnected._
- **Should `TypeScript Config & Refs` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._