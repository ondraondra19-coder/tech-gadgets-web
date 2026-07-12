"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import posthog from "posthog-js";
import Image from "next/image";
import {
    CheckCircle2, ShoppingBag, Mail, Clock, Banknote, Package,
    ArrowRight, MapPin, Truck, ShieldCheck, Phone, Building2, Copy, Check, Tag,
} from "lucide-react";
import { useCurrency } from "@/lib/CurrencyContext";
import { formatPrice, getPrice } from "@/lib/currency";

const SNAPSHOT_KEY = "hackpack-order-snapshot";

type SnapshotItem = {
    slug: string;
    name: string;
    priceCZK: number;
    priceRaw: number | Partial<Record<"CZK" | "EUR" | "USD", number>>;
    img: string;
    variants?: Record<string, string>;
    quantity: number;
};

type SnapshotInfo = {
    jmeno?: string; email?: string; telefon?: string; firma?: string;
    nakupNaFirmu?: boolean; jineDorucenoAdresa?: boolean;
    adresa?: {
        mesto?: string; uliceCp?: string; psc?: string; zeme?: string;
    };
    dorAdresa?: {
        mesto?: string; uliceCp?: string; psc?: string; zeme?: string;
    };
};

type Snapshot = {
    items: SnapshotItem[];
    info: SnapshotInfo;
    orderData: {
        doprava?: string;
        dopravaName?: string;
        dopravaPrices?: { CZK: number; EUR?: number; USD?: number };
        platba?: string;
        isDobirka?: boolean;
        zbox?: { id: string; name: string; nameStreet: string; city: string; zip: string } | null;
        discountCode?: string | null;
        discountLabel?: string | null;
    } | null;
    savedAt: number;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
    return <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-subtle mb-3">{children}</p>;
}

function StatusPill({ label, active = false }: { label: string; active?: boolean }) {
    return (
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-tight ${
            active ? "bg-primary/10 border-primary/20 text-primary" : "bg-surface border-border text-text-muted"
        }`}>
            <span className={`w-2 h-2 rounded-full ${active ? "bg-primary animate-pulse" : "bg-border"}`} />
            {label}
        </div>
    );
}

function CopyButton({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button onClick={() => { navigator.clipboard.writeText(value).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="p-1.5 rounded-lg hover:bg-border/50 transition-colors text-text-subtle hover:text-text-base" title="Kopírovat">
            {copied ? <Check size={13} className="text-primary" /> : <Copy size={13} />}
        </button>
    );
}

function BankovniPrevod({ totalStr, vsymbol }: { totalStr: string; vsymbol: string }) {
    return (
        <div>
            <div className="mb-8">
                <SectionLabel>Platební instrukce</SectionLabel>
                <h2 className="text-2xl font-extrabold text-text-base tracking-tight mb-2">Dokončete platbu převodem</h2>
                <p className="text-text-muted text-sm leading-relaxed max-w-lg">Objednávku jsme zaevidovali. Prosíme o zaslání platby na níže uvedený účet — expedujeme ihned po připsání částky.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-surface rounded-2xl border border-border p-6 space-y-5">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-1.5">Číslo účtu</p>
                        <div className="flex items-center justify-between bg-white border border-border rounded-xl px-4 py-3">
                            <span className="font-mono font-black text-text-base text-lg tracking-wide">123456789 / 0800</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-text-subtle uppercase">Česká spořitelna</span>
                                <CopyButton value="123456789/0800" />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-1.5">Variabilní symbol</p>
                            <div className="flex items-center justify-between bg-white border border-border rounded-xl px-4 py-3">
                                <span className="font-mono font-black text-text-base">{vsymbol}</span>
                                <CopyButton value={vsymbol} />
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-1.5">Částka</p>
                            <div className="bg-white border border-primary/20 rounded-xl px-4 py-3 font-mono font-black text-primary text-lg">{totalStr}</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-black text-white">!</div>
                        <p className="text-xs text-amber-900 leading-relaxed">Nezapomeňte uvést <strong>variabilní symbol</strong>. Bez něj nemůžeme platbu automaticky spárovat s vaší objednávkou.</p>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-surface rounded-2xl border border-border p-6 flex flex-col items-center justify-center gap-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle">Rychlá platba QR kódem</p>
                    <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
                        <div className="w-40 h-40 bg-surface rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-2">
                            <div className="w-10 h-10 border-2 border-dashed border-text-subtle/30 rounded-full flex items-center justify-center">
                                <span className="text-primary font-extrabold text-[10px]">QR</span>
                            </div>
                            <span className="text-[10px] font-bold text-text-subtle uppercase tracking-tight text-center">Naskenujte<br />mobilní aplikací</span>
                        </div>
                    </div>
                    <p className="text-xs text-text-muted text-center leading-relaxed">Kompatibilní s většinou českých bankovních aplikací</p>
                </div>
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { icon: Banknote, label: "Odešlete platbu", desc: "Na výše uvedený účet s variabilním symbolem." },
                    { icon: Clock, label: "Platba se připsala", desc: "Obvykle do několika hodin, max. 1 pracovní den." },
                    { icon: Truck, label: "Expedujeme", desc: "Zásilku odešleme do 24 h od přijetí platby." },
                ].map((item) => (
                    <div key={item.label} className="flex items-start gap-4 bg-surface rounded-2xl border border-border p-4">
                        <div className="shrink-0 w-9 h-9 rounded-xl bg-white border border-border flex items-center justify-center">
                            <item.icon size={16} className="text-text-muted" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-text-base mb-0.5">{item.label}</p>
                            <p className="text-xs text-text-muted leading-snug">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Dobirka({ totalStr }: { totalStr: string }) {
    return (
        <div>
            <div className="mb-8">
                <SectionLabel>Způsob úhrady</SectionLabel>
                <h2 className="text-2xl font-extrabold text-text-base tracking-tight mb-2">Platba při doručení</h2>
                <p className="text-text-muted text-sm leading-relaxed max-w-lg">Nemusíte dělat nic — zásilku právě balíme. Zaplatíte až kurýrovi při předání.</p>
            </div>
            <div className="bg-surface rounded-2xl border border-border p-6 lg:p-8 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { step: "1", icon: Package, title: "Balíme", desc: "Sklad expeduje vaši objednávku do 24 hodin.", active: true },
                        { step: "2", icon: Truck, title: "Kurýr dorazí", desc: "Den před doručením dostanete SMS s časovým oknem.", active: false },
                        { step: "3", icon: Banknote, title: "Zaplatíte", desc: "Hotovost nebo karta — kurýři akceptují oboje.", active: false },
                    ].map((s) => (
                        <div key={s.step} className="flex items-start gap-4">
                            <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm ${s.active ? "bg-primary text-dark shadow-lg shadow-primary/20" : "bg-white border border-border text-text-subtle"}`}>{s.step}</div>
                            <div>
                                <p className="text-sm font-bold text-text-base mb-0.5">{s.title}</p>
                                <p className="text-xs text-text-muted leading-snug">{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-1 text-center sm:text-left">Celková částka k zaplacení</p>
                        <p className="text-3xl font-black text-text-base text-center sm:text-left">{totalStr}<span className="text-sm font-normal text-text-muted ml-2">vč. poplatku za dobírku</span></p>
                    </div>
                    <StatusPill label="Připraveno k expedici" active />
                </div>
            </div>
            <div className="flex items-center gap-3 bg-surface rounded-xl border border-border px-5 py-4">
                <Phone size={16} className="text-text-muted shrink-0" />
                <p className="text-xs text-text-muted leading-relaxed">Kurýr vás bude kontaktovat <strong className="text-text-base">SMS zprávou</strong> v den doručení.</p>
            </div>
        </div>
    );
}

function KartaStripe({ totalStr, orderId }: { totalStr: string; orderId: string }) {
    return (
        <div>
            <div className="mb-8">
                <SectionLabel>Potvrzení transakce</SectionLabel>
                <h2 className="text-2xl font-extrabold text-text-base tracking-tight mb-2">Platba proběhla v pořádku</h2>
                <p className="text-text-muted text-sm leading-relaxed max-w-lg">Transakce byla úspěšně autorizována. Vaši objednávku nyní prioritně zpracováváme.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface rounded-2xl border border-border p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-4">Souhrn transakce</p>
                    {[
                        { label: "Stav platby", value: "✓ Zaplaceno", highlight: true },
                        { label: "Způsob úhrady", value: "Platební karta / Apple Pay", highlight: false },
                        { label: "Číslo objednávky", value: `#${orderId}`, highlight: false },
                        { label: "Celková částka", value: totalStr, highlight: true },
                    ].map(({ label, value, highlight }) => (
                        <div key={label} className="flex items-center justify-between py-3.5 border-b border-border last:border-0">
                            <span className="text-xs font-bold uppercase tracking-wider text-text-subtle">{label}</span>
                            <span className={`text-sm font-bold ${highlight ? "text-primary" : "text-text-base"}`}>{value}</span>
                        </div>
                    ))}
                    <div className="mt-5 flex items-center gap-2 justify-center">
                        <ShieldCheck size={13} className="text-text-subtle" />
                        <p className="text-[10px] font-bold text-text-subtle uppercase tracking-[0.12em]">Zabezpečeno přes Stripe</p>
                    </div>
                </div>
                <div className="bg-surface rounded-2xl border border-border p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-4">Co bude dál?</p>
                    <div className="space-y-4">
                        {[
                            { icon: Mail, title: "Potvrzovací e-mail", desc: "Zaslán na váš e-mail z objednávky." },
                            { icon: Package, title: "Balíme zásilku", desc: "Expedice probíhá do 24 hodin." },
                            { icon: Truck, title: "Kurýr dorazí", desc: "SMS notifikace v den doručení." },
                        ].map((item) => (
                            <div key={item.title} className="flex items-start gap-3">
                                <div className="shrink-0 w-8 h-8 rounded-xl bg-white border border-border flex items-center justify-center mt-0.5">
                                    <item.icon size={14} className="text-text-muted" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-text-base">{item.title}</p>
                                    <p className="text-xs text-text-muted">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Adresní blok — zobrazí kam se balík posílá ──────────────────────────────

function DeliveryAddressBlock({ info, orderData }: { info: SnapshotInfo; orderData: Snapshot["orderData"] }) {
    const isZasilkovna = orderData?.doprava === "zasilkovna";

    // Doručovací adresa = jiná adresa pokud zaškrtnuta, jinak fakturační
    const deliveryAddr = (info.jineDorucenoAdresa && info.dorAdresa?.uliceCp)
        ? info.dorAdresa
        : info.adresa;

    return (
        <div className="space-y-4">
            {/* Způsob doručení */}
            {orderData?.dopravaName && (
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-2">Způsob doručení</p>
                    <div className="flex items-center gap-2 text-sm font-semibold text-text-base">
                        <Truck size={14} className="text-primary shrink-0" />
                        {orderData.dopravaName}
                    </div>
                </div>
            )}

            <div className="h-px bg-border" />

            {/* Výdejní místo Zásilkovny */}
            {isZasilkovna && orderData?.zbox ? (
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-2">Výdejní místo</p>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                        <Package size={14} className="text-primary mt-0.5 shrink-0" />
                        <div className="text-xs text-text-muted leading-relaxed">
                            <p className="font-bold text-text-base">{orderData.zbox.name}</p>
                            <p>{orderData.zbox.nameStreet}</p>
                            <p>{orderData.zbox.zip} {orderData.zbox.city}</p>
                        </div>
                    </div>
                </div>
            ) : (
                /* Doručovací adresa na dveře */
                deliveryAddr && (
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-2">
                            {info.jineDorucenoAdresa && info.dorAdresa?.uliceCp ? "Doručovací adresa" : "Fakturační adresa"}
                        </p>
                        <div className="flex items-start gap-3">
                            <MapPin size={14} className="text-text-subtle mt-0.5 shrink-0" />
                            <div className="text-sm text-text-muted leading-relaxed">
                                {info.nakupNaFirmu && info.firma && (
                                    <p className="font-bold text-text-base flex items-center gap-1.5">
                                        <Building2 size={12} className="text-text-subtle" />{info.firma}
                                    </p>
                                )}
                                <p className="font-bold text-text-base">{info.jmeno}</p>
                                {deliveryAddr.uliceCp && <p>{deliveryAddr.uliceCp}</p>}
                                {(deliveryAddr.psc || deliveryAddr.mesto) && (
                                    <p>{[deliveryAddr.psc, deliveryAddr.mesto].filter(Boolean).join(" ")}</p>
                                )}
                                {deliveryAddr.zeme && deliveryAddr.zeme !== "Česká republika" && (
                                    <p>{deliveryAddr.zeme}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )
            )}

            {/* Fakturační adresa — pouze když je jiná doručovací adresa */}
            {info.adresa && info.jineDorucenoAdresa && info.dorAdresa?.uliceCp && (
                <>
                    <div className="h-px bg-border" />
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-2">Fakturační adresa</p>
                        <div className="flex items-start gap-3">
                            <MapPin size={14} className="text-text-subtle mt-0.5 shrink-0" />
                            <div className="text-sm text-text-muted leading-relaxed">
                                {info.nakupNaFirmu && info.firma && (
                                    <p className="font-bold text-text-base flex items-center gap-1.5">
                                        <Building2 size={12} className="text-text-subtle" />{info.firma}
                                    </p>
                                )}
                                <p className="font-bold text-text-base">{info.jmeno}</p>
                                {info.adresa.uliceCp && <p>{info.adresa.uliceCp}</p>}
                                {(info.adresa.psc || info.adresa.mesto) && (
                                    <p>{[info.adresa.psc, info.adresa.mesto].filter(Boolean).join(" ")}</p>
                                )}
                                {info.adresa.zeme && info.adresa.zeme !== "Česká republika" && (
                                    <p>{info.adresa.zeme}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function SuccessContent() {
    const searchParams = useSearchParams();
    const { currency } = useCurrency();

    const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
    const [hydrated, setHydrated] = useState(false);
    const [stableOrderId, setStableOrderId] = useState<string>("");
    const [loadError, setLoadError] = useState(false);
    const [apiTotal, setApiTotal] = useState<number | null>(null);

    const rawMethod = searchParams.get("method") ?? "";
    const method: "prevod" | "dobirka" | "karta" =
        rawMethod === "prevod" ? "prevod" : rawMethod === "dobirka" ? "dobirka" : "karta";
    const sessionId = searchParams.get("session_id");

    useEffect(() => {
        const id = sessionId
            ? sessionId.replace(/^cs_live_|^cs_test_/, "").slice(-10).toUpperCase()
            : (Math.floor(Math.random() * 90000) + 10000).toString();
        setStableOrderId(id);

        // Platba kartou — NEspoléháme na localStorage (to může obsahovat
        // starou objednávku z jiné návštěvy). Místo toho ověříme skutečnou
        // Stripe session a naši uloženou objednávku přes API.
        if (method === "karta" && sessionId) {
            fetch(`/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`)
                .then((res) => res.json())
                .then((data) => {
                    if (!data.paid || !data.order) {
                        setLoadError(true);
                        setHydrated(true);
                        return;
                    }
                    const o = data.order;
                    setApiTotal(typeof data.amountTotal === "number" ? data.amountTotal : o.total);
                    setSnapshot({
                        items: o.items.map((it: any) => ({
                            slug: it.slug,
                            name: it.name,
                            priceCZK: it.unitPrice,
                            priceRaw: it.unitPrice,
                            img: "",
                            variants: it.variants,
                            quantity: it.quantity,
                        })),
                        info: {
                            jmeno: o.customer?.jmeno,
                            email: o.customer?.email,
                            telefon: o.customer?.telefon,
                            firma: o.customer?.firma,
                            nakupNaFirmu: !!o.customer?.firma,
                            jineDorucenoAdresa: !!o.deliveryAddress,
                            adresa: o.address,
                            dorAdresa: o.deliveryAddress ?? undefined,
                        },
                        orderData: {
                            dopravaName: o.shippingName,
                            dopravaPrices: { CZK: o.shippingPrice, EUR: o.shippingPrice, USD: o.shippingPrice },
                            isDobirka: false,
                            zbox: o.zboxId ? { id: o.zboxId, name: "", nameStreet: "", city: "", zip: "" } : null,
                            discountCode: o.discountCode ?? null,
                            discountLabel: o.discountLabel ?? null,
                        },
                        savedAt: Date.now(),
                    });
                    posthog.capture("order_completed", {
                        payment_method: "karta",
                        stripe_session_id: sessionId,
                        item_count: o.items.reduce((sum: number, it: any) => sum + it.quantity, 0),
                        product_slugs: o.items.map((it: any) => it.slug),
                        shipping_method: o.shippingName ?? null,
                        discount_code: o.discountCode ?? null,
                        amount_total: typeof data.amountTotal === "number" ? data.amountTotal : o.total,
                        currency: o.currency ?? null,
                    });
                    setHydrated(true);
                })
                .catch(() => {
                    setLoadError(true);
                    setHydrated(true);
                });
            return;
        }

        // Dobírka / převod — tahle data se zapsala do localStorage jen pár
        // vteřin předtím na téhle stránce, takže jsou spolehlivě aktuální.
        let parsedSnapshot: Snapshot | null = null;
        try {
            const raw = localStorage.getItem(SNAPSHOT_KEY);
            if (raw) {
                parsedSnapshot = JSON.parse(raw);
                setSnapshot(parsedSnapshot);
            }
        } catch {}
        if (parsedSnapshot) {
            posthog.capture("order_completed", {
                payment_method: method,
                item_count: parsedSnapshot.items.reduce((sum, it) => sum + it.quantity, 0),
                product_slugs: parsedSnapshot.items.map((it) => it.slug),
                shipping_method: parsedSnapshot.orderData?.dopravaName ?? null,
                discount_code: parsedSnapshot.orderData?.discountCode ?? null,
            });
        }
        setHydrated(true);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const items = snapshot?.items ?? [];
    const info = snapshot?.info ?? {};
    const orderData = snapshot?.orderData ?? null;

    const vsymbol = stableOrderId.replace(/\D/g, "").slice(-8).padStart(8, "0");

    const subtotal = items.reduce((s, i) => s + getPrice(i.priceRaw as any, currency) * i.quantity, 0);
    const dopravaPrice = orderData?.dopravaPrices ? getPrice(orderData.dopravaPrices, currency) : 0;
    const dobirkaExtra = orderData?.isDobirka ? getPrice({ CZK: 39, EUR: 1.59, USD: 1.79 }, currency) : 0;
    const celkem = apiTotal ?? (subtotal + dopravaPrice + dobirkaExtra);
    const celkemStr = hydrated ? formatPrice(celkem, currency) : "—";

    const statusLabel = method === "prevod" ? "Čeká na platbu" : method === "dobirka" ? "Připraveno k expedici" : "Zaplaceno";
    const methodLabel = method === "prevod" ? "Bankovní převod" : method === "dobirka" ? "Dobírka" : "Platební karta";

    return (
        <>
            <Header />
            <main className="min-h-screen bg-surface">
                {/* Hero */}
                <div className="bg-header relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
                    <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
                    <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-14 lg:py-20 relative z-10">
                        <nav className="flex items-center gap-2 text-xs text-white/30 mb-8">
                            <a href="/" className="hover:text-white/60 transition-colors">Domů</a>
                            <span className="opacity-40 mx-1">›</span>
                            <a href="/kosik" className="hover:text-white/60 transition-colors">Košík</a>
                            <span className="opacity-40 mx-1">›</span>
                            <span className="text-white/60">Potvrzení objednávky</span>
                        </nav>
                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                            <div className="flex items-start gap-6">
                                <div className="shrink-0 w-16 h-16 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                                    <CheckCircle2 size={30} className="text-primary" />
                                </div>
                                <div>
                                    <p className="text-primary text-xs font-bold uppercase tracking-[0.18em] mb-2">Objednávka přijata</p>
                                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-3">Děkujeme za nákup!</h1>
                                    <p className="text-white/50 text-base leading-relaxed">
                                        Objednávka{" "}
                                        {stableOrderId
                                            ? <span className="font-mono text-white/80 font-bold">#{stableOrderId}</span>
                                            : <span className="inline-block w-24 h-4 rounded bg-white/10 animate-pulse align-middle" />
                                        }
                                        {" "}byla úspěšně zaevidována.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right hidden sm:block">
                                    <p className="text-white/30 text-[10px] uppercase tracking-widest">Způsob platby</p>
                                    <p className="text-white/80 text-sm font-bold">{methodLabel}</p>
                                </div>
                                <StatusPill label={statusLabel} active />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-12 lg:py-16">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                        {/* Platební sekce */}
                        <div className="xl:col-span-2">
                            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 lg:p-10">
                                {method === "prevod" && <BankovniPrevod totalStr={celkemStr} vsymbol={vsymbol} />}
                                {method === "dobirka" && <Dobirka totalStr={celkemStr} />}
                                {method === "karta" && <KartaStripe totalStr={celkemStr} orderId={stableOrderId || "—"} />}
                            </div>
                        </div>

                        {/* Postranní panel */}
                        <div className="xl:col-span-1 flex flex-col gap-5">

                            {/* Položky objednávky */}
                            <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-4">Položky objednávky</p>
                                {hydrated && items.length > 0 ? (
                                    <div className="space-y-4 mb-5">
                                        {items.map((item, i) => {
                                            const itemPrice = getPrice(item.priceRaw as any, currency);
                                            const variantStr = item.variants ? Object.values(item.variants).join(" · ") : null;
                                            return (
                                                <div key={item.slug + i} className="flex items-start gap-3">
                                                    <div className="relative shrink-0 w-12 h-12 rounded-xl bg-surface border border-border overflow-hidden">
                                                        {item.img && <Image src={item.img} alt={item.name} fill className="object-contain p-1.5" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-text-base line-clamp-2 leading-snug">{item.name}</p>
                                                        {variantStr && <p className="text-[11px] text-text-subtle mt-0.5">{variantStr}</p>}
                                                        <p className="text-[11px] text-text-subtle">{item.quantity}&nbsp;ks</p>
                                                    </div>
                                                    <p className="text-xs font-bold text-text-base shrink-0 tabular-nums">
                                                        {formatPrice(itemPrice * item.quantity, currency)}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : hydrated ? (
                                    <p className="text-text-subtle text-xs py-4 text-center">Položky se nepodařilo načíst.</p>
                                ) : (
                                    <div className="space-y-3 mb-5 animate-pulse">
                                        {[1, 2].map((n) => (
                                            <div key={n} className="flex items-start gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-surface border border-border shrink-0" />
                                                <div className="flex-1 space-y-1.5 pt-1">
                                                    <div className="h-3 bg-surface rounded w-3/4" />
                                                    <div className="h-2.5 bg-surface rounded w-1/3" />
                                                </div>
                                                <div className="h-3 bg-surface rounded w-14 shrink-0 mt-1" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Cenový souhrn */}
                                {hydrated && (
                                    <div className="border-t border-border pt-4 space-y-2">
                                        <div className="flex justify-between text-xs text-text-muted">
                                            <span>Mezisoučet</span>
                                            <span className="tabular-nums">{formatPrice(subtotal, currency)}</span>
                                        </div>
                                        {orderData?.discountCode && (
                                            <div className="flex justify-between text-xs text-green-600">
                                                <span className="flex items-center gap-1.5">
                                                    <Tag size={11} />
                                                    <span className="notranslate" translate="no">{orderData.discountCode}</span>
                                                </span>
                                                <span className="tabular-nums font-semibold">{orderData.discountLabel}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-xs text-text-muted">
                                            <span>Doprava{orderData?.dopravaName ? ` (${orderData.dopravaName})` : ""}</span>
                                            <span className="tabular-nums">
                                                {dopravaPrice > 0 ? formatPrice(dopravaPrice, currency) : "Zdarma"}
                                            </span>
                                        </div>
                                        {orderData?.isDobirka && (
                                            <div className="flex justify-between text-xs text-text-muted">
                                                <span>Dobírka</span>
                                                <span className="tabular-nums">{formatPrice(dobirkaExtra, currency)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm font-extrabold text-text-base pt-2 border-t border-border">
                                            <span>Celkem</span>
                                            <span className="text-primary tabular-nums">{celkemStr}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Adresa doručení */}
                            {hydrated && (info.jmeno || info.adresa) && (
                                <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
                                    <DeliveryAddressBlock info={info} orderData={orderData} />
                                </div>
                            )}

                            {/* Kontakt */}
                            {hydrated && (info.email || info.telefon) && (
                                <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-3">Kontaktní údaje</p>
                                    <div className="space-y-2">
                                        {info.email && (
                                            <div className="flex items-center gap-2 text-xs text-text-muted">
                                                <Mail size={13} className="text-text-subtle shrink-0" />
                                                <span className="break-all">{info.email}</span>
                                            </div>
                                        )}
                                        {info.telefon && (
                                            <div className="flex items-center gap-2 text-xs text-text-muted">
                                                <Phone size={13} className="text-text-subtle shrink-0" />
                                                <span>{info.telefon}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Podpora */}
                            <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-2">Potřebujete pomoc?</p>
                                <p className="text-xs text-text-muted leading-relaxed mb-4">Zákaznický servis je k dispozici Po–Pá 9–18 h, So 10–14 h.</p>
                                <Link href="/kontakt" className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-base font-bold text-xs hover:bg-border/50 transition-colors">
                                    Kontaktovat podporu <ArrowRight size={13} />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Spodní info lišta */}
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { icon: Mail, title: "Potvrzení e-mailem", desc: "Kopie objednávky čeká ve vaší schránce." },
                            { icon: Truck, title: "Expedice do 24 h", desc: "Zásilku odesíláme ihned po potvrzení platby." },
                            { icon: ShieldCheck, title: "30 dní na vrácení", desc: "Zboží lze vrátit bez udání důvodu do 30 dní." },
                        ].map((item) => (
                            <div key={item.title} className="flex items-start gap-4 bg-white rounded-2xl border border-border shadow-sm p-5">
                                <div className="shrink-0 w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center">
                                    <item.icon size={18} className="text-text-muted" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-text-base mb-0.5">{item.title}</p>
                                    <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/" className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-primary text-dark font-extrabold text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10">
                            <ShoppingBag size={16} /> Pokračovat v nákupu
                        </Link>
                        <Link href="/reklamace" className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-border text-text-muted font-bold text-sm hover:bg-white hover:text-text-base transition-all flex items-center justify-center gap-2">
                            Reklamace a vrácení
                        </Link>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}

export default function UspechPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}