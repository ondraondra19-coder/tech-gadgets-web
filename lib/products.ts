// ─── Typy ───────────────────────────────────────────

export type Variant = {
  label: string;
  value: string;
};

export type ModelColor = {
  label: string;
  value: string;
  img: string;
  hex?: string;
};

export type ModelColorLayered = {
  label: string;
  value: string;
  body: string;
  cap: string;
  hex?: string;
};

export type PriceValue = number | { CZK: number; EUR?: number; USD?: number };

export type ProductModel = {
  id: string;
  label: string;
  price: PriceValue;
  colors: ModelColor[] | ModelColorLayered[];
  layered?: boolean;
  comboExtra?: PriceValue;
};

export type MediaItem =
  | { type: "image"; src: string }
  | { type: "video"; src: string; poster?: string };

export type ProductColor = {
  label: string;
  value: string;
  hex?: string;
  img?: string;
};

export type ProductSize = {
  label: string;
  value: string;
};

export type Product = {
  slug: string;
  name: string;
  name_en?: string;
  name_sk?: string;
  price: PriceValue;
  categories: string[];
  img: string;
  // Popis je povinný česky; překlady jsou volitelné a čtou se přes
  // getProductDescription(). Chybí-li, spadne to zpět na češtinu.
  description: string;
  description_en?: string;
  description_sk?: string;
  inStock: boolean;
  stock: number;
  tags?: string[];
  colors?: ProductColor[];
  sizes?: ProductSize[];
  sizesLabel?: string;
  media?: MediaItem[];
  variants?: {
    type: string;
    options: Variant[];
  }[];
  models?: ProductModel[];
  related?: string[];
};

// ─── Produkty ───────────────────────────────────────

export const products: Product[] = [
  {
    slug: "pouzdro-apple-pencil",
    name: "Silikonové pouzdro na Apple Pencil",
    name_en: "Silicone Case for Apple Pencil",
    name_sk: "Silikónové puzdro na Apple Pencil",
    price: { CZK: 129, EUR: 5.39, USD: 6.29 },
    categories: ["pouzdra-obaly", "ipad-pencil"],
    img: "/images/products/pencil/pro-black.jpg",
    description: "Ochranné silikonové pouzdro pro Apple Pencil 2. generace a Apple Pencil Pro. Tento ergonomický obal z jemného silikonu zajišťuje lepší úchop, zabraňuje únavě ruky při kreslení a chrání stylus před poškrábáním i pády. Tenký design zachovává plnou podporu magnetického nabíjení a dvojitého klepnutí. Ideální doplněk pro každodenní psaní a tvorbu na iPadu.",
    description_en: "Protective silicone case for the Apple Pencil 2nd generation and Apple Pencil Pro. This ergonomic silicone sleeve gives you a better grip, reduces hand fatigue while drawing and protects the stylus from scratches and drops. The slim design keeps magnetic charging and double-tap fully working. An ideal companion for everyday writing and creating on your iPad.",
    description_sk: "Ochranné silikónové puzdro pre Apple Pencil 2. generácie a Apple Pencil Pro. Tento ergonomický obal z jemného silikónu zaisťuje lepší úchop, zabraňuje únave ruky pri kreslení a chráni stylus pred poškriabaním aj pádmi. Tenký dizajn zachováva plnú podporu magnetického nabíjania a dvojitého ťuknutia. Ideálny doplnok pre každodenné písanie a tvorbu na iPade.",
    inStock: true,
    stock: 0,
    tags: ["pencil", "pouzdro", "obal", "kryt", "silikon", "úchop", "ochrana", "apple", "ipad", "stylus", "příslušenství", "hrot", "násada", "držiak", "grip", "tenké", "lehké", "měkké", "barevné", "nástavec", "pro", "mini", "air", "nabíjení", "magnetické", "anti-slip", "příslušenstvo"],
    related: ["hroty-apple-pencil", "magneticka-folie-ipad", "krytka-webkamera", "pouzdro-airpods"],
    models: [
      {
        id: "pro",
        label: "Apple Pencil Pro",
        price: { CZK: 129, EUR: 5.39, USD: 6.29 },
        colors: [
          { label: "Black", value: "black", img: "/images/products/pencil/pro-black.jpg", hex: "#000000" },
          { label: "Pink", value: "pink", img: "/images/products/pencil/pro-pink.jpg", hex: "#fecaca" },
          { label: "White", value: "white", img: "/images/products/pencil/pro-white.jpg", hex: "#ffffff" },
          { label: "Green", value: "green", img: "/images/products/pencil/pro-green.jpg", hex: "#aae8c7" },
          { label: "Dark Blue", value: "darkblue", img: "/images/products/pencil/pro-darkblue.jpg", hex: "#132739" },
          { label: "Grey", value: "grey", img: "/images/products/pencil/pro-grey.jpg", hex: "#a4a09d" },
          { label: "Army Green", value: "armygreen", img: "/images/products/pencil/pro-armygreen.jpg", hex: "#454f10" },
        ] as ModelColor[],
      },
      {
        id: "usbc",
        label: "Apple Pencil USB-C",
        price: { CZK: 129, EUR: 5.39, USD: 6.29 },
        layered: true,
        comboExtra: { CZK: 20, EUR: 0.79, USD: 0.89 },
        colors: [
          { label: "Black", value: "black", body: "/images/products/pencil/usb-body-black.png", cap: "/images/products/pencil/usb-cap-black.png", hex: "#000000" },
          { label: "Grey", value: "grey", body: "/images/products/pencil/usb-body-grey.png", cap: "/images/products/pencil/usb-cap-grey.png", hex: "#a4a09d" },
          { label: "Pink", value: "pink", body: "/images/products/pencil/usb-body-pink.png", cap: "/images/products/pencil/usb-cap-pink.png", hex: "#f0b8b4" },
          { label: "Purple", value: "purple", body: "/images/products/pencil/usb-body-purple.png", cap: "/images/products/pencil/usb-cap-purple.png", hex: "#eacfec" },
        ] as ModelColorLayered[],
      },
    ],
  },
  {
    slug: "pouzdro-airpods",
    name: "Silikonové pouzdro na AirPods",
    name_en: "Silicone Case for AirPods",
    name_sk: "Silikónové puzdro na AirPods",
    price: { CZK: 149, EUR: 6.19, USD: 7.29 },
    categories: ["pouzdra-obaly"],
    img: "/images/products/airpods/black-airpods-case.jpg",
    description: "Zajistěte svým sluchátkům maximální ochranu s tímto prémiovým silikonovým pouzdrem. Tento odolný kryt na AirPods je navržen tak, aby tlumil nárazy při pádu, zabraňoval nevzhledným škrábancům a chránil před prachem i nečistotami. Vysoce kvalitní a flexibilní silikon zajišťuje příjemný úchop a dlouhou životnost, zatímco přesné výřezy umožňují snadný přístup k nabíjecímu portu bez nutnosti pouzdro sundávat. Ideální doplněk pro každodenní používání, který kombinuje minimalistický design s praktickou funkčností pro modely AirPods 1, 2, 3, 4 i verze Pro.",
    description_en: "Give your earbuds maximum protection with this premium silicone case. This durable AirPods cover is designed to absorb impacts from drops, prevent unsightly scratches and keep out dust and dirt. High-quality flexible silicone gives a comfortable grip and long life, while precise cutouts leave the charging port easy to reach without taking the case off. An ideal everyday companion that combines minimalist design with practical function — fits AirPods 1, 2, 3, 4 and the Pro models.",
    description_sk: "Zaistite svojim slúchadlám maximálnu ochranu s týmto prémiovým silikónovým puzdrom. Tento odolný kryt na AirPods je navrhnutý tak, aby tlmil nárazy pri páde, zabraňoval nevzhľadným škrabancom a chránil pred prachom aj nečistotami. Vysokokvalitný a flexibilný silikón zaisťuje príjemný úchop a dlhú životnosť, zatiaľ čo presné výrezy umožňujú jednoduchý prístup k nabíjaciemu portu bez nutnosti puzdro skladať. Ideálny doplnok pre každodenné používanie, ktorý kombinuje minimalistický dizajn s praktickou funkčnosťou pre modely AirPods 1, 2, 3, 4 aj verzie Pro.",
    inStock: true,
    stock: 0,
    tags: ["airpods", "pouzdro", "kryt", "obal", "silikon", "ochrana", "sluchátka", "apple", "pro", "hudba", "příslušenství", "nabíjení", "bezdrátová", "odolné", "barevné", "nárazuvzdorné", "tenké", "špunty", "1", "2", "3", "4", "generace"],
    related: ["koncovky-airpods", "airpods-brush", "cistič-displeje", "cistici-hmota"],
    colors: [
      { label: "Černá", value: "black", hex: "#373737", img: "/images/products/airpods/black.jpg" },
      { label: "Šedá", value: "grey", hex: "#6d7d7c", img: "/images/products/airpods/grey.jpg" },
      { label: "Modrá", value: "blue", hex: "#54556c", img: "/images/products/airpods/darkblue.jpg" },
      { label: "Fialová", value: "purple", hex: "#dacdf1", img: "/images/products/airpods/purple.jpg" },
      { label: "Růžová", value: "pink", hex: "#ffbdba", img: "/images/products/airpods/pink.jpg" },
      { label: "Béžová", value: "beige", hex: "#f1e0cf", img: "/images/products/airpods/beige.jpg" },
      { label: "Bílá", value: "white", hex: "#f3f3f3", img: "/images/products/airpods/white.jpg" },
    ],
    sizesLabel: "Model AirPods",
    sizes: [
      { label: "AirPods 1/2", value: "airpods-1-2" },
      { label: "AirPods 3", value: "airpods-3" },
      { label: "AirPods 4", value: "airpods-4" },
      { label: "AirPods Pro 2", value: "airpods-pro-2" },
      { label: "AirPods Pro 3", value: "airpods-pro-3" },
    ],
    media: [
      { type: "image", src: "/images/products/airpods/airpods-case-angle.jpg" },
      { type: "image", src: "/images/products/airpods/airpods-case-open.jpg" },
      { type: "image", src: "/images/products/airpods/airpods-case-charging.jpg" },
      { type: "video", src: "/images/products/test3.mp4" },
    ],
  },
  {
    slug: "magneticka-paperlike-folie-ipad",
    name: "Magnetická Paperlike fólie na iPad",
    name_en: "Magnetic Paperlike Screen Protector for iPad",
    name_sk: "Magnetická Paperlike fólia na iPad",
    price: { CZK: 299, EUR: 12.39, USD: 14.49 },
    categories: ["ipad-pencil"],
    img: "/images/products/paperfeel/main.png",
    description: "Proměňte svůj iPad v přirozený pracovní nástroj pro psaní i kreslení s magnetickou Paperlike fólií. Speciálně upravený matný povrch věrně simuluje odpor papíru, takže psaní s Apple Pencil působí přesněji, stabilněji a mnohem přirozeněji než na klasickém hladkém skle. Ideální volba pro studenty, grafiky i každého, kdo si dělá poznámky digitálně.\n\nDíky magnetickému uchycení je instalace otázkou pár sekund – bez lepení, bez bublin a bez stresu. Fólii jednoduše nasadíte, kdykoliv ji potřebujete, a stejně snadno ji sundáte. To oceníte zejména při sledování videí nebo práci, kde chcete maximální ostrost displeje.\n\nAntireflexní úprava výrazně snižuje odlesky a zlepšuje čitelnost na světle, zatímco speciální textura omezuje ulpívání otisků prstů. Fólie zároveň chrání displej před jemnými škrábanci a každodenním opotřebením, aniž by negativně ovlivnila citlivost dotyku nebo přesnost Apple Pencil.\n\nPerfektní doplněk pro každého, kdo chce z iPadu dostat maximum – ať už při studiu, práci nebo kreativní tvorbě.",
    description_en: "Turn your iPad into a natural tool for writing and drawing with the magnetic Paperlike screen protector. The specially treated matte surface faithfully mimics the resistance of paper, so writing with the Apple Pencil feels more precise, more stable and far more natural than on plain smooth glass. An ideal choice for students, designers and anyone who takes notes digitally.\n\nThanks to the magnetic attachment, fitting it takes seconds — no adhesive, no bubbles, no stress. Put it on whenever you need it and take it off just as easily. That matters most when you're watching videos or working and want the display at full sharpness.\n\nThe anti-glare treatment noticeably cuts reflections and improves readability in bright light, while the texture keeps fingerprints at bay. The protector also shields your display from fine scratches and everyday wear without affecting touch sensitivity or Apple Pencil accuracy.\n\nThe perfect addition for anyone who wants to get the most out of their iPad — studying, working or creating.",
    description_sk: "Premeňte svoj iPad na prirodzený pracovný nástroj na písanie aj kreslenie s magnetickou Paperlike fóliou. Špeciálne upravený matný povrch verne simuluje odpor papiera, takže písanie s Apple Pencil pôsobí presnejšie, stabilnejšie a oveľa prirodzenejšie než na klasickom hladkom skle. Ideálna voľba pre študentov, grafikov aj každého, kto si robí poznámky digitálne.\n\nVďaka magnetickému uchyteniu je inštalácia otázkou pár sekúnd – bez lepenia, bez bubliniek a bez stresu. Fóliu jednoducho nasadíte, kedykoľvek ju potrebujete, a rovnako ľahko ju zložíte. To oceníte najmä pri sledovaní videí alebo práci, kde chcete maximálnu ostrosť displeja.\n\nAntireflexná úprava výrazne znižuje odlesky a zlepšuje čitateľnosť na svetle, zatiaľ čo špeciálna textúra obmedzuje ulpievanie odtlačkov prstov. Fólia zároveň chráni displej pred jemnými škrabancami a každodenným opotrebovaním bez toho, aby negatívne ovplyvnila citlivosť dotyku alebo presnosť Apple Pencil.\n\nPerfektný doplnok pre každého, kto chce z iPadu dostať maximum – či už pri štúdiu, práci alebo kreatívnej tvorbe.",
    inStock: true,
    stock: 0,
    tags: [
      "ipad",
      "apple",
      "apple pencil",
      "tablet",
      "dotykovy displej",
      "folie",
      "fólie na ipad",
      "ochrana displeje",
      "ochranná fólie",
      "screen protector",
      "paperlike",
      "paper feel",
      "psaní",
      "psaní na ipad",
      "digitální poznámky",
      "poznámky",
      "kreslení",
      "kreslení na ipad",
      "grafika",
      "design",
      "student",
      "škola",
      "práce",
      "kancelář",
      "magnetická",
      "magnetické uchycení",
      "bez lepidla",
      "bez bublin",
      "snadná instalace",
      "opakovaně použitelná",
      "antireflexní",
      "matná",
      "proti odleskům",
      "proti otiskům",
      "ochrana proti škrábancům",
      "citlivost dotyku",
      "přesnost",
      "příslušenství ipad"
    ],
    related: ["pouzdro-apple-pencil", "hroty-apple-pencil", "krytka-webkamera", "cistic-displeje"],
    sizesLabel: "Kompatibilní modely iPadů",
    sizes: [
      { label: "iPad Pro 12.9\"", value: "ipad-12-9" }
    ],
    media: [
      { type: "image", src: "/images/products/paperfeel/detail1.png" },
      { type: "image", src: "/images/products/paperfeel/detail2.png" },
      { type: "image", src: "/images/products/paperfeel/detail3.png" }
    ]
  },
  {
    slug: "organizator-kabelu-stolni",
    name: "Organizér na kabely",
    name_en: "Cable Organizer",
    name_sk: "Organizér na káble",
    price: { CZK: 179, EUR: 7.49, USD: 8.69 },
    categories: ["prislusenstvi"],
    img: "/images/products/organizer-black.jpg",
    description: "Praktický stolní organizér kabelů, který pomáhá udržet pořádek v nabíjecích kabelech, USB kabelech a drobné elektronice. Díky promyšlené konstrukci zabraňuje zamotávání kabelů a jejich padání ze stolu, takže máte vše vždy přehledně na jednom místě.\n\nOrganizér je ideální pro pracovní stůl, domácí kancelář i herní setup. Umožňuje snadné vedení kabelů a jejich rychlé použití bez neustálého rozmotávání. Díky kompaktnímu designu nezabírá téměř žádné místo, ale výrazně zlepšuje pořádek a organizaci pracovního prostoru.\n\nOdolné zpracování zajišťuje dlouhou životnost a stabilitu při každodenním používání. Skvělý doplněk pro každého, kdo chce mít kabely pod kontrolou a udržet čistý pracovní prostor.",
    description_en: "A practical desk cable organiser that keeps your charging cables, USB cables and small electronics in order. Its thought-through design stops cables tangling and sliding off the desk, so everything stays neatly in one place.\n\nThe organiser suits a work desk, home office or gaming setup alike. It routes cables cleanly and lets you grab them without untangling anything first. The compact design takes up almost no space while making a real difference to how tidy your workspace stays.\n\nSturdy construction means it lasts and stays put in daily use. A great addition for anyone who wants their cables under control and their desk clear.",
    description_sk: "Praktický stolový organizér káblov, ktorý pomáha udržať poriadok v nabíjacích kábloch, USB kábloch a drobnej elektronike. Vďaka premyslenej konštrukcii zabraňuje zamotávaniu káblov a ich padaniu zo stola, takže máte všetko vždy prehľadne na jednom mieste.\n\nOrganizér je ideálny na pracovný stôl, domácu kanceláriu aj herný setup. Umožňuje jednoduché vedenie káblov a ich rýchle použitie bez neustáleho rozmotávania. Vďaka kompaktnému dizajnu nezaberá takmer žiadne miesto, ale výrazne zlepšuje poriadok a organizáciu pracovného priestoru.\n\nOdolné spracovanie zaisťuje dlhú životnosť a stabilitu pri každodennom používaní. Skvelý doplnok pre každého, kto chce mať káble pod kontrolou a udržať čistý pracovný priestor.",
    inStock: true,
    stock: 0,
    tags: [
      "kabely",
      "kabel",
      "organizér",
      "drzak kabelu",
      "cable organizer",
      "cable holder",
      "stolni organizér",
      "desktop organizer",
      "pořádek",
      "pracovni stul",
      "kancelář",
      "home office",
      "gaming setup",
      "usb kabel",
      "nabíjecí kabel",
      "elektronika",
      "příslušenství",
      "minimalistický",
      "proti zamotání"
    ],
    related: ["prachovky-usb-c", "krytka-webkamera", "cistici-hmota", "cistic-displeje"],
    sizesLabel: "Počet přihrádek",
    sizes: [
      { label: "3 přihrádky", value: "3" },
      { label: "5 přihrádek", value: "5" },
      { label: "7 přihrádek", value: "7" }
    ],
    media: [
      { type: "image", src: "/images/products/organizer-detail1.jpg" },
      { type: "image", src: "/images/products/organizer-detail2.jpg" },
      { type: "image", src: "/images/products/organizer-detail3.jpg" }
    ]
  },
  {
    slug: "nahradni-hroty-apple-pencil",
    name: "Náhradní hroty na Apple Pencil",
    name_en: "Replacement Tips for Apple Pencil",
    name_sk: "Náhradné hroty na Apple Pencil",
    price: { CZK: 129, EUR: 5.39, USD: 6.29 },
    categories: ["ipad-pencil"],
    img: "/images/products/tip/white.jpg",
    description: "Náhradní hrot pro Apple Pencil kompatibilní se všemi generacemi (1., 2., USB-C i Pro). Zajišťuje stejnou přesnost a citlivost jako originální špička, takže psaní i kreslení zůstává plynulé a přirozené bez zpoždění.\n\nHrot je vyroben z odolného materiálu, který je šetrný k displeji i ochranným fóliím a zároveň nabízí dlouhou životnost i při každodenním intenzivním používání. Díky jednoduchému systému výměny lze starý hrot snadno odšroubovat a nový během několika sekund nasadit.\n\nIdeální řešení pro každého, kdo chce udržet Apple Pencil v perfektním stavu a zajistit si přesný a pohodlný zážitek z psaní i kreslení.",
    description_en: "A replacement tip for the Apple Pencil, compatible with every generation (1st, 2nd, USB-C and Pro). It delivers the same precision and sensitivity as the original tip, so writing and drawing stay smooth and natural with no lag.\n\nThe tip is made from a durable material that's gentle on displays and screen protectors while lasting well even under heavy daily use. The simple replacement system means you can unscrew the old tip and fit the new one in seconds.\n\nAn ideal solution for anyone who wants to keep their Apple Pencil in perfect shape and writing and drawing feeling precise and comfortable.",
    description_sk: "Náhradný hrot pre Apple Pencil kompatibilný so všetkými generáciami (1., 2., USB-C aj Pro). Zaisťuje rovnakú presnosť a citlivosť ako originálna špička, takže písanie aj kreslenie zostáva plynulé a prirodzené bez oneskorenia.\n\nHrot je vyrobený z odolného materiálu, ktorý je šetrný k displeju aj ochranným fóliám a zároveň ponúka dlhú životnosť aj pri každodennom intenzívnom používaní. Vďaka jednoduchému systému výmeny možno starý hrot ľahko odskrutkovať a nový počas niekoľkých sekúnd nasadiť.\n\nIdeálne riešenie pre každého, kto chce udržať Apple Pencil v perfektnom stave a zaistiť si presný a pohodlný zážitok z písania aj kreslenia.",
    inStock: true,
    stock: 9,
    tags: [
      "apple pencil",
      "ipad",
      "hrot",
      "hroty",
      "náhradní hrot",
      "replacement tip",
      "stylus",
      "pero",
      "psaní",
      "kreslení",
      "digitální kreslení",
      "digitální psaní",
      "příslušenství ipad",
      "apple",
      "špička",
      "násada",
      "výměnný hrot",
      "citlivost",
      "přesnost",
      "design",
      "student",
      "grafika",
      "bez prodlevy"
    ],
    related: ["pouzdro-apple-pencil", "magneticka-paperlike-folie-ipad", "cistici-hmota", "cistic-displeje"],
    colors: [
      { label: "Bílá", value: "white", img: "/images/products/tip/white.jpg", hex: "#f1f1f1" },
      { label: "Růžová", value: "pink", img: "/images/products/tip/pink.jpg", hex: "#ffb9ca" },
      { label: "Světle modrá", value: "light-blue", img: "/images/products/tip/lightblue.jpg", hex: "#cef1ff" },
      { label: "Fialová", value: "purple", img: "/images/products/tip/purple.jpg", hex: "#cdc3ff" }
    ]
  },
  {
    slug: "silikonovy-reminek-apple-watch",
    name: "Silikonový řemínek na Apple Watch",
    name_en: "Silicone Band for Apple Watch",
    name_sk: "Silikónový remienok na Apple Watch",
    price: { CZK: 159, EUR: 6.69, USD: 7.79 },
    categories: ["apple-watch"],
    img: "/images/products/watch/darkblue.jpg",
    description: "Sportovní silikonový řemínek pro Apple Watch vyrobený z kvalitního a odolného fluoroelastomeru. Materiál je příjemný na dotek, lehký, prodyšný a plně voděodolný, takže je vhodný pro sport, každodenní nošení i náročnější aktivity.\n\nŘemínek je navržen tak, aby pevně a bezpečně držel na zápěstí, a díky praktickému kolíčkovému zapínání se snadno nasazuje i sundává. Konstrukce zajišťuje stabilitu při pohybu, takže se hodí i pro běh, fitness nebo venkovní aktivity.\n\nKompatibilní se všemi verzemi Apple Watch včetně SE a Ultra. Ideální volba pro uživatele, kteří chtějí jednoduchý, odolný a pohodlný řemínek pro každodenní používání.",
    description_en: "A sport silicone strap for the Apple Watch, made from quality, hard-wearing fluoroelastomer. The material feels good against the skin, is light, breathable and fully waterproof, so it suits sport, everyday wear and more demanding activities alike.\n\nThe strap is designed to sit firmly and securely on your wrist, and the practical pin buckle makes it easy to put on and take off. The construction keeps it stable as you move, so it works for running, the gym or outdoor activities.\n\nCompatible with every Apple Watch version including SE and Ultra. An ideal choice for anyone who wants a simple, durable and comfortable strap for everyday use.",
    description_sk: "Športový silikónový remienok pre Apple Watch vyrobený z kvalitného a odolného fluoroelastoméru. Materiál je príjemný na dotyk, ľahký, priedušný a plne vodeodolný, takže je vhodný na šport, každodenné nosenie aj náročnejšie aktivity.\n\nRemienok je navrhnutý tak, aby pevne a bezpečne držal na zápästí, a vďaka praktickému kolíkovému zapínaniu sa ľahko nasadzuje aj skladá. Konštrukcia zaisťuje stabilitu pri pohybe, takže sa hodí aj na beh, fitnes alebo vonkajšie aktivity.\n\nKompatibilný so všetkými verziami Apple Watch vrátane SE a Ultra. Ideálna voľba pre používateľov, ktorí chcú jednoduchý, odolný a pohodlný remienok na každodenné používanie.",
    inStock: true,
    stock: 0,
    tags: [
      "apple watch",
      "remínek",
      "reminek",
      "silikonový řemínek",
      "silicone band",
      "watch band",
      "náramek",
      "hodinky",
      "apple",
      "sportovní",
      "fitness",
      "běh",
      "trénink",
      "voděodolný",
      "odolný",
      "prodyšný",
      "lehký",
      "náhradní řemínek",
      "příslušenství apple watch",
      "ultra",
      "se",
      "38mm",
      "40mm",
      "41mm",
      "42mm",
      "44mm",
      "45mm",
      "49mm"
    ],
    related: ["magsafe-penezenka", "pouzdro-airtag-pasek", "pouzdro-airtag-klicenka", "cistič-displeje"],
    colors: [
      { label: "Tmavě modrá", value: "darkblue", hex: "#152146", img: "/images/products/watch/darkblue.jpg" },
      { label: "Tmavě zelená", value: "darkgreen", hex: "#354c49", img: "/images/products/watch/darkgreen.jpg" },
      { label: "Modrá", value: "blue", hex: "#545e71", img: "/images/products/watch/blue.jpg" },
      { label: "Béžová", value: "beige", hex: "#c09b83", img: "/images/products/watch/beige.jpg" },
      { label: "Šedá", value: "grey", hex: "#aeb5ae", img: "/images/products/watch/grey.jpg" },
      { label: "Fialová", value: "purple", hex: "#c8aec0", img: "/images/products/watch/purple.jpg" },
      { label: "Růžová", value: "pink", hex: "#debbb5", img: "/images/products/watch/pink.jpg" },
      { label: "Bílá", value: "white", hex: "#d4cfc5", img: "/images/products/watch/white.jpg" }
    ],
    sizesLabel: "Velikost",
    sizes: [
      { label: "38/40/41 mm", value: "small" },
      { label: "42/44/45/49 mm", value: "large" }
    ]
  },
  {
    slug: "pouzdro-airtag-pasek",
    name: "Silikonové pouzdro na AirTag (pásek)",
    name_en: "Silicone AirTag Case (strap)",
    name_sk: "Silikónové puzdro na AirTag (pásik)",
    price: { CZK: 0, EUR: 0, USD: 0 },
    categories: ["pouzdra-obaly"],
    img: "/images/products/airtag-holder.png",
    description: "Silikonové pouzdro s páskem pro AirTag. Lze připnout na batoh, kočárek nebo kolo.",
    description_en: "A silicone case with a strap for the AirTag. Clips onto a backpack, pram or bike.",
    description_sk: "Silikónové puzdro s pásikom pre AirTag. Možno pripnúť na batoh, kočík alebo bicykel.",
    inStock: true,
    stock: 0,
    tags: ["airtag", "pásek", "lokátor", "pouzdro", "klíče", "batoh"],
    related: ["pouzdro-airtag-klicenka", "silikonovy-reminak", "organizer-kabely", "magsafe-penezenka"],
    colors: [
      { label: "Černá", value: "black" },
      { label: "Bílá", value: "white" },
      { label: "Modrá", value: "blue" },
    ]
  },
  {
    slug: "pouzdro-airtag-klicenka-silikon",
    name: "Silikonové pouzdro na AirTag (klíčenka)",
    name_en: "Silicone AirTag Case (Keychain)",
    name_sk: "Silikónové puzdro na AirTag (kľúčenka)",
    price: { CZK: 149, EUR: 6.19, USD: 7.29 },
    categories: ["pouzdra-obaly"],
    img: "/images/products/airtag/black.jpg",
    description: "Praktické silikonové pouzdro s kovovým kroužkem pro Apple AirTag, které umožňuje bezpečné připevnění lokátoru ke klíčům, batohu nebo jiné osobní výbavě. Díky pevné konstrukci drží AirTag spolehlivě na místě a zároveň ho chrání před poškrábáním, nárazy a běžným opotřebením.\n\nPružný silikonový materiál tlumí otřesy a zajišťuje dlouhou životnost i při každodenním používání. Otevřený design zachovává plnou funkčnost signálu a zvukové signalizace AirTagu, takže sledování polohy zůstává přesné a spolehlivé.\n\nIdeální doplněk pro každého, kdo chce mít své klíče, zavazadla nebo osobní věci pod kontrolou a zároveň je chránit jednoduchým a odolným řešením.",
    description_en: "A practical silicone case with a metal ring for the Apple AirTag, letting you attach the tracker securely to your keys, backpack or other personal kit. Its firm construction holds the AirTag reliably in place while protecting it from scratches, knocks and everyday wear.\n\nThe flexible silicone absorbs shocks and lasts well in daily use. The open design keeps the AirTag's signal and sound alerts fully working, so tracking stays accurate and reliable.\n\nAn ideal addition for anyone who wants to keep track of their keys, luggage or personal belongings while protecting them with something simple and durable.",
    description_sk: "Praktické silikónové puzdro s kovovým krúžkom pre Apple AirTag, ktoré umožňuje bezpečné pripevnenie lokátora ku kľúčom, batohu alebo inej osobnej výbave. Vďaka pevnej konštrukcii drží AirTag spoľahlivo na mieste a zároveň ho chráni pred poškriabaním, nárazmi a bežným opotrebovaním.\n\nPružný silikónový materiál tlmí otrasy a zaisťuje dlhú životnosť aj pri každodennom používaní. Otvorený dizajn zachováva plnú funkčnosť signálu a zvukovej signalizácie AirTagu, takže sledovanie polohy zostáva presné a spoľahlivé.\n\nIdeálny doplnok pre každého, kto chce mať svoje kľúče, batožinu alebo osobné veci pod kontrolou a zároveň ich chrániť jednoduchým a odolným riešením.",
    inStock: true,
    stock: 0,
    tags: [
      "airtag",
      "apple airtag",
      "lokátor",
      "tracker",
      "sledování",
      "hledání klíčů",
      "klíčenka",
      "keychain",
      "přívěsek",
      "pouzdro",
      "obal",
      "silikon",
      "silikonové pouzdro",
      "ochrana",
      "karabina",
      "kovový kroužek",
      "klíče",
      "batoh",
      "taška",
      "zavazadlo",
      "příslušenství apple"
    ],
    related: ["pouzdro-airtag-pasek", "silikonovy-reminek-apple-watch", "organizer-kabely", "magsafe-penezenka"],
    colors: [
      { label: "Černá", value: "black" },
      { label: "Bílá", value: "white" }
    ]
  },
  {
    slug: "cistici-pero-airpods-3v1",
    name: "Čisticí pero pro AirPods (3v1)",
    name_en: "AirPods Cleaning Pen (3-in-1)",
    name_sk: "Čistiace pero pre AirPods (3v1)",
    price: { CZK: 99, EUR: 4.19, USD: 4.89 },
    categories: ["cisteni"],
    img: "/images/products/other/brush.png",
    description: "Multifunkční čisticí pero 3v1 určené pro údržbu AirPods a dalších drobných elektronických zařízení. Nástroj kombinuje kovový hrot pro přesné odstranění nečistot z úzkých a těžko přístupných míst, jemný kartáček pro čištění mřížek reproduktorů a měkkou houbičku pro vyčištění vnitřku nabíjecího pouzdra.\n\nPravidelné čištění pomáhá udržet optimální kvalitu zvuku, zabraňuje hromadění nečistot a prodlužuje životnost sluchátek i jejich pouzdra. Díky kompaktnímu provedení je pero ideální pro každodenní použití i cestování.\n\nJednoduchý, ale účinný nástroj pro každého, kdo chce mít svá sluchátka v čistotě a plné funkčnosti.",
    description_en: "A 3-in-1 multifunction cleaning pen for looking after AirPods and other small electronics. The tool combines a metal tip for lifting dirt precisely out of narrow, hard-to-reach spots, a soft brush for cleaning speaker grilles and a soft sponge for cleaning inside the charging case.\n\nRegular cleaning helps keep sound quality where it should be, stops dirt building up and extends the life of both your earbuds and their case. Its compact form makes it ideal for everyday use and travel.\n\nA simple but effective tool for anyone who wants their earbuds clean and fully working.",
    description_sk: "Multifunkčné čistiace pero 3v1 určené na údržbu AirPods a ďalších drobných elektronických zariadení. Nástroj kombinuje kovový hrot na presné odstránenie nečistôt z úzkych a ťažko prístupných miest, jemnú kefku na čistenie mriežok reproduktorov a mäkkú hubku na vyčistenie vnútra nabíjacieho puzdra.\n\nPravidelné čistenie pomáha udržať optimálnu kvalitu zvuku, zabraňuje hromadeniu nečistôt a predlžuje životnosť slúchadiel aj ich puzdra. Vďaka kompaktnému prevedeniu je pero ideálne na každodenné použitie aj cestovanie.\n\nJednoduchý, ale účinný nástroj pre každého, kto chce mať svoje slúchadlá v čistote a plnej funkčnosti.",
    inStock: true,
    stock: 0,
    tags: [
      "čištění",
      "cleaning pen",
      "airpods",
      "sluchátka",
      "apple airpods",
      "kartáček",
      "čisticí pero",
      "3v1",
      "údržba",
      "hygiena",
      "prach",
      "nečistoty",
      "reproduktory",
      "nabíjecí pouzdro",
      "cleaning tool",
      "péče o sluchátka",
      "příslušenství",
      "servis",
      "detailní čištění"
    ],
    related: ["pouzdro-airpods", "koncovky-airpods", "cistici-hmota", "cistic-displeje"],
    colors: [
      { label: "Bílá", value: "bila", hex: "#f1f1f1", img: "/images/products/other/brush.png" }
    ]
  },
  {
    slug: "krytka-webkamery-ultra-thin",
    name: "Krytka na webkameru",
    name_en: "Webcam Cover",
    name_sk: "Krytka na webkameru",
    price: { CZK: 0, EUR: 0, USD: 0 },
    categories: ["prislusenstvi"],
    img: "/images/products/webcam-cover.jpg",
    description: "Ultratenká posuvná krytka pro webkameru notebooku nebo tabletu. Díky tloušťce pouhých 0,8 mm nenarušuje zavírání zařízení a je téměř neviditelná při běžném používání.\n\nJednoduše se přilepí na rám kamery a umožňuje okamžité zakrytí či odkrytí objektivu podle potřeby. Praktické řešení pro ochranu soukromí při práci, studiu nebo videohovorech.\n\nMinimalistický design zajišťuje, že krytka neruší vzhled zařízení a zároveň poskytuje spolehlivou fyzickou ochranu před nechtěným přístupem ke kameře.",
    description_en: "An ultra-thin sliding cover for a laptop or tablet webcam. At just 0.8 mm thick it doesn't stop your device closing and is almost invisible in normal use.\n\nIt sticks on around the camera frame and lets you cover or uncover the lens instantly, whenever you want. A practical way to protect your privacy while working, studying or on video calls.\n\nThe minimalist design means the cover doesn't spoil the look of your device while giving you reliable physical protection against unwanted camera access.",
    description_sk: "Ultratenká posuvná krytka pre webkameru notebooku alebo tabletu. Vďaka hrúbke iba 0,8 mm nenarúša zatváranie zariadenia a je takmer neviditeľná pri bežnom používaní.\n\nJednoducho sa prilepí na rám kamery a umožňuje okamžité zakrytie či odkrytie objektívu podľa potreby. Praktické riešenie na ochranu súkromia pri práci, štúdiu alebo videohovoroch.\n\nMinimalistický dizajn zaisťuje, že krytka neruší vzhľad zariadenia a zároveň poskytuje spoľahlivú fyzickú ochranu pred nechceným prístupom ku kamere.",
    inStock: true,
    stock: 0,
    tags: [
      "webkamera",
      "webcam cover",
      "krytka",
      "kamera",
      "soukromí",
      "privacy",
      "macbook",
      "ipad",
      "notebook",
      "bezpečnost",
      "ochrana soukromí",
      "posuvná krytka",
      "ultratenká",
      "0.8mm",
      "kamera kryt",
      "blokace kamery",
      "příslušenství",
      "lepicí krytka"
    ],
    related: ["prachovky-usb-c", "organizer-kabely", "cistic-displeje", "cistici-hmota"],
    colors: [
      { label: "Černá", value: "black", hex: "#000000", img: "/images/products/webcam-cover-black.jpg" }
    ]
  },
  {
    slug: "magsafe-penezenka",
    name: "MagSafe peněženka",
    name_en: "MagSafe Wallet",
    name_sk: "MagSafe peňaženka",
    price: { CZK: 249, EUR: 10.29, USD: 12.09 },
    categories: ["pouzdra-obaly"],
    img: "/images/products/magsafe-penezenka-black.jpg",
    description: "Magnetická peněženka kompatibilní s MagSafe pro iPhone. Umožňuje bezpečné přichycení na zadní stranu telefonu pomocí silných magnetů a pojme až 3 platební karty nebo doklady.\n\nVyrobena z kvalitní PU kůže, která kombinuje elegantní vzhled s odolností při každodenním používání. Konstrukce zajišťuje pevné uchycení na telefonu, takže peněženka drží i při běžném pohybu.\n\nPraktické řešení pro ty, kteří chtějí mít karty vždy po ruce bez nutnosti nosit klasickou peněženku. Minimalistický design doplňuje moderní vzhled iPhonu a zachovává pohodlné používání.",
    description_en: "A magnetic MagSafe-compatible wallet for the iPhone. Strong magnets attach it securely to the back of your phone and it holds up to 3 payment cards or IDs.\n\nMade from quality PU leather that combines a smart look with everyday durability. The construction keeps it firmly attached to the phone, so the wallet stays put as you move around.\n\nA practical answer for anyone who wants their cards to hand without carrying a full wallet. The minimalist design complements the iPhone's look and keeps it comfortable to use.",
    description_sk: "Magnetická peňaženka kompatibilná s MagSafe pre iPhone. Umožňuje bezpečné prichytenie na zadnú stranu telefónu pomocou silných magnetov a pojme až 3 platobné karty alebo doklady.\n\nVyrobená z kvalitnej PU kože, ktorá kombinuje elegantný vzhľad s odolnosťou pri každodennom používaní. Konštrukcia zaisťuje pevné uchytenie na telefóne, takže peňaženka drží aj pri bežnom pohybe.\n\nPraktické riešenie pre tých, ktorí chcú mať karty vždy poruke bez nutnosti nosiť klasickú peňaženku. Minimalistický dizajn dopĺňa moderný vzhľad iPhonu a zachováva pohodlné používanie.",
    inStock: true,
    stock: 0,
    tags: [
      "magsafe",
      "magnetická peněženka",
      "wallet",
      "iphone",
      "apple",
      "karty",
      "platební karta",
      "card holder",
      "leather",
      "pu kůže",
      "kožená peněženka",
      "telefon",
      "iphone příslušenství",
      "magnet",
      "zadní strana telefonu",
      "minimalistická peněženka",
      "travel wallet",
      "3 karty"
    ],
    related: ["silikonovy-reminek-apple-watch", "pouzdro-airtag-klicenka", "pouzdro-airtag-pasek", "cistic-displeje"],
    colors: [
      { label: "Černá", value: "black", hex: "#000000", img: "/images/products/magsafe-penezenka-black.jpg" }
    ]
  },
  {
    slug: "prachovka-usb-c",
    name: "Prachovka do USB-C",
    name_en: "USB-C Dust Plug",
    name_sk: "Prachovka do USB-C",
    price: { CZK: 19, EUR: 0.89, USD: 0.99 },
    categories: ["prislusenstvi"],
    img: "/images/products/krytka-konektoru.jpg",
    description: "Silikonová prachovka určená pro ochranu USB-C portu před prachem, nečistotami a drobnými částicemi. Jednoduše se zasune do konektoru, kde pevně drží a zabraňuje jeho zanášení.\n\nVhodná pro notebooky, telefony a další zařízení s USB-C portem, zejména při dlouhodobém nepoužívání nabíjecího konektoru. Pomáhá udržet port čistý a prodlužuje jeho životnost.",
    description_en: "A silicone dust plug to protect a USB-C port from dust, dirt and small particles. It simply pushes into the connector, where it holds firmly and keeps the port from clogging up.\n\nSuits laptops, phones and other devices with a USB-C port, especially when the charging connector goes unused for long stretches. It helps keep the port clean and extends its life.",
    description_sk: "Silikónová prachovka určená na ochranu USB-C portu pred prachom, nečistotami a drobnými časticami. Jednoducho sa zasunie do konektora, kde pevne drží a zabraňuje jeho zanášaniu.\n\nVhodná pre notebooky, telefóny a ďalšie zariadenia s USB-C portom, najmä pri dlhodobom nepoužívaní nabíjacieho konektora. Pomáha udržať port čistý a predlžuje jeho životnosť.",
    inStock: true,
    stock: 0,
    tags: [
      "usb-c",
      "usbc",
      "usb c",
      "prachovka",
      "dust plug",
      "konektor",
      "port",
      "ochrana portu",
      "ochrana konektoru",
      "prach",
      "nečistoty",
      "notebook",
      "telefon",
      "tablet",
      "apple",
      "android",
      "příslušenství",
      "silikon",
      "krytka"
    ],
    related: ["krytka-webkamera", "organizer-kabely", "cistici-hmota", "cistic-displeje"],
    colors: [
      { label: "Černá", value: "black", hex: "#000000", img: "/images/products/krytka-konektoru.jpg" }
    ]
  },
  {
    slug: "cistici-hmota",
    name: "Čistící hmota",
    name_en: "Cleaning Putty",
    name_sk: "Čistiaca hmota",
    price: { CZK: 49, EUR: 2.09, USD: 2.39 },
    categories: ["cisteni"],
    img: "/images/products/sliz.jpg",
    description: "Speciální čistící hmota pro klávesnice, porty a těžko dostupná místa. Opakovaně použitelná.",
    description_en: "A special cleaning putty for keyboards, ports and hard-to-reach places. Reusable.",
    description_sk: "Špeciálna čistiaca hmota na klávesnice, porty a ťažko dostupné miesta. Opakovane použiteľná.",
    inStock: true,
    stock: 0,
    tags: ["čištění", "hmota", "klávesnice", "port", "mezery", "čistič"],
    related: ["cistič-displeje", "airpods-brush", "prachovky-usb-c", "krytka-webkamera"],
    colors: [
      { label: "Modrá", value: "blue", hex: "#add8e6", img: "/images/products/sliz.jpg" },
    ]
  },
  {
    slug: "cistic-displeje",
    name: "Čistič displeje",
    name_en: "Screen Cleaner",
    name_sk: "Čistič displeja",
    price: { CZK: 49, EUR: 2.09, USD: 2.39 },
    categories: ["cisteni"],
    img: "/images/products/sprej.jpg",
    description: "Sprej + mikrovlákno pro dokonale čistý displej bez šmouh. Bez alkoholu, bezpečný pro OLED.",
    description_en: "Spray and microfibre for a perfectly clean, streak-free display. Alcohol-free, safe for OLED.",
    description_sk: "Sprej + mikrovlákno pre dokonale čistý displej bez šmúh. Bez alkoholu, bezpečný pre OLED.",
    inStock: true,
    stock: 0,
    tags: ["čistič", "displej", "obrazovka", "sprej", "mikrovlákno", "lesk"],
    related: ["cistici-hmota", "airpods-brush", "krytka-webkamera", "prachovky-usb-c"],
    colors: [
      { label: "Šedá", value: "gray", hex: "#f1f1f1", img: "/images/products/sprej.jpg" },
    ]
  },
  {
    slug: "koncovky-airpods",
    name: "Koncovky do uší AirPods",
    name_en: "AirPods Ear Tips",
    name_sk: "Koncovky do uší AirPods",
    price: { CZK: 0, EUR: 0, USD: 0 },
    categories: ["prislusenstvi"],
    img: "/images/products/spunty.jpg",
    description: "Náhradní silikonové koncovky pro AirPods Pro. Sada S/M/L. Originální Apple příslušenství.",
    description_en: "Replacement silicone ear tips for AirPods Pro. S/M/L set. Genuine Apple accessory.",
    description_sk: "Náhradné silikónové koncovky pre AirPods Pro. Sada S/M/L. Originálne Apple príslušenstvo.",
    inStock: true,
    stock: 0,
    tags: ["koncovky", "airpods pro", "špunty", "náhradní", "ucho", "silikonové"],
    related: ["pouzdro-airpods", "airpods-brush", "cistici-hmota", "cistic-displeje"],
    sizesLabel: "Velikost koncovek",
    sizes: [
      { label: "S", value: "small" },
      { label: "M", value: "medium" },
      { label: "L", value: "large" },
    ],
  },
];

// ─── Helpers ────────────────────────────────────────

export type Category = {
  slug: string;
  name: string;
  name_en?: string;
  name_sk?: string;
};

export const categories: Category[] = [
  { slug: "pouzdra-obaly",  name: "Pouzdra & Obaly",     name_en: "Cases & Covers",     name_sk: "Puzdrá & Obaly" },
  { slug: "ipad-pencil",    name: "iPad & Apple Pencil", name_en: "iPad & Apple Pencil", name_sk: "iPad & Apple Pencil" },
  { slug: "apple-watch",    name: "Apple Watch",         name_en: "Apple Watch",        name_sk: "Apple Watch" },
  { slug: "prislusenstvi",  name: "Příslušenství",       name_en: "Accessories",        name_sk: "Príslušenstvo" },
  { slug: "cisteni",        name: "Čištění",             name_en: "Cleaning",           name_sk: "Čistenie" },
];

export function getProductsByCategory(slug: string): Product[] {
  return products.filter((p) => p.categories.includes(slug));
}

export function getCategoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}

// Vyjmenuje všechny prodejné varianty produktu (barva/velikost/model,
// včetně vrstvených barev tělo+hlavička) — používá se pro editaci skladu
// v adminu (ProductsAdminList) i pro přehled nízkého skladu na dashboardu.
// Stock klíč pro danou kombinaci je `${product.slug}|${c.color ?? "-"}|${c.size ?? "-"}`
// (stejný formát jako lib/stock.ts:makeKey).
export type ProductCombination = {
  color?: string;
  size?: string;
};

export function getProductCombinations(product: Product): ProductCombination[] {
  const combos: ProductCombination[] = [];

  if (product.models && product.models.length > 0) {
    product.models.forEach((model) => {
      if (model.colors && model.colors.length > 0) {
        model.colors.forEach((color) => {
          if (model.layered) {
            combos.push({ color: `${color.value}__body`, size: model.id });
            combos.push({ color: `${color.value}__cap`, size: model.id });
          } else {
            combos.push({ color: color.value, size: model.id });
          }
        });
      } else {
        combos.push({ size: model.id });
      }
    });
  } else {
    const hasColors = product.colors && product.colors.length > 0;
    const hasSizes = product.sizes && product.sizes.length > 0;

    if (hasColors && hasSizes) {
      product.colors!.forEach((color) => {
        product.sizes!.forEach((size) => {
          combos.push({ color: color.value, size: size.value });
        });
      });
    } else if (hasColors) {
      product.colors!.forEach((color) => {
        combos.push({ color: color.value });
      });
    } else if (hasSizes) {
      product.sizes!.forEach((size) => {
        combos.push({ size: size.value });
      });
    } else {
      combos.push({});
    }
  }

  return combos;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  if (product.related && product.related.length > 0) {
    const related = product.related
      .map(slug => products.find(p => p.slug === slug))
      .filter(Boolean) as Product[];
    if (related.length > 0) return related.slice(0, limit);
  }
  return products
    .filter((p) => p.slug !== product.slug && p.categories.some((c) => product.categories.includes(c)))
    .slice(0, limit);
}

// ─── Helper pro získání názvu produktu podle jazyka ──
// ─── Lokalizace katalogu ────────────────────────────
// Všechny tři funkce padají zpět na češtinu, když překlad chybí — radši
// česky než prázdno. Nový produkt tak jde přidat bez překladů a doplnit je
// později, aniž by se web rozbil.

export function getProductName(product: Product, locale: string): string {
  if (locale === "en" && product.name_en) return product.name_en;
  if (locale === "sk" && product.name_sk) return product.name_sk;
  return product.name;
}

export function getProductDescription(product: Product, locale: string): string {
  if (locale === "en" && product.description_en) return product.description_en;
  if (locale === "sk" && product.description_sk) return product.description_sk;
  return product.description;
}

export function getCategoryName(category: Category, locale: string): string {
  if (locale === "en" && category.name_en) return category.name_en;
  if (locale === "sk" && category.name_sk) return category.name_sk;
  return category.name;
}