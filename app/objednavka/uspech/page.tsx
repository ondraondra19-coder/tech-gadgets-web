"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import {
    CheckCircle2, ShoppingBag, Mail, Clock, Banknote, Package,
    ArrowRight, MapPin, Truck, ShieldCheck, Phone, Building2, Copy, Check, Tag, Smartphone,
} from "lucide-react";
import { useCurrency } from "@/lib/CurrencyContext";
import { formatPrice, getPrice } from "@/lib/currency";
import { buildSpdString, orderIdToVariableSymbol } from "@/lib/qrPlatba";
import QRCode from "qrcode";
import { DOBIRKA_FEE } from "@/lib/fees";
import { identifyUser } from "@/lib/analytics";
import { useT } from "@/lib/useT";
import { shippingLabel, paymentLabel } from "@/lib/shippingLabels";
import { COUNTRY_CZECHIA } from "@/lib/shipping/pricing";

const SNAPSHOT_KEY = "slingr-order-snapshot";

type SnapshotItem = {
    slug: string;
    name: string;
    priceCZK: number;
    priceRaw: number | Partial<Record<"CZK" | "EUR" | "USD", number>>;
    img: string;
    variants?: Record<string, string>;
    quantity: number;
};

// Tvar položky, jak ji vrací /api/checkout/session z uložené objednávky.
type ApiOrderItem = {
    slug: string;
    name: string;
    unitPrice: number;
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
            active ? "bg-primary/10 border-primary/20 text-primary-ink" : "bg-surface border-border text-text-muted"
        }`}>
            <span className={`w-2 h-2 rounded-full ${active ? "bg-primary animate-pulse" : "bg-border"}`} />
            {label}
        </div>
    );
}

function CopyButton({ value }: { value: string }) {
    const t = useT("success");
    const [copied, setCopied] = useState(false);
    return (
        <button onClick={() => { navigator.clipboard.writeText(value).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            aria-label={copied ? t("copied", { value }) : t("copy", { value })}
            className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-border/50 transition-colors text-text-subtle hover:text-text-base" title={t("copyShort")}>
            {copied ? <Check size={13} aria-hidden="true" className="text-primary-ink" /> : <Copy size={13} aria-hidden="true" />}
        </button>
    );
}

function BankovniPrevod({ totalStr, vsymbol, amount, currencyCode }: { totalStr: string; vsymbol: string; amount: number; currencyCode: string }) {
    const t = useT("success");
    const accountDisplay = process.env.NEXT_PUBLIC_BANK_ACCOUNT_DISPLAY;
    const iban = process.env.NEXT_PUBLIC_BANK_ACCOUNT_IBAN;
    const bankName = process.env.NEXT_PUBLIC_BANK_NAME;
    // USD nemá smysl — bankovní převod se pro USD vůbec nenabízí (viz
    // /objednavka), takže sem se dostane jen CZK/EUR.
    const showQr = Boolean(iban) && (currencyCode === "CZK" || currencyCode === "EUR");

    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!showQr || !iban) return;
        const spd = buildSpdString({ iban, amount, currency: currencyCode, variableSymbol: vsymbol, message: "Dekujeme za objednavku" });
        let cancelled = false;
        QRCode.toDataURL(spd, { width: 200, margin: 1 })
            .then(url => { if (!cancelled) setQrDataUrl(url); })
            .catch(() => { if (!cancelled) setQrDataUrl(null); });
        return () => { cancelled = true; };
    }, [showQr, iban, amount, currencyCode, vsymbol]);

    return (
        <div>
            <div className="mb-8">
                <SectionLabel>{t("transferEyebrow")}</SectionLabel>
                <h2 className="text-2xl font-extrabold text-text-base tracking-tight mb-2">{t("transferTitle")}</h2>
                <p className="text-text-muted text-sm leading-relaxed max-w-lg">{t("transferDesc")}</p>
            </div>
            {!accountDisplay ? (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-black text-white">!</div>
                    <p className="text-xs text-amber-900 leading-relaxed">{t("transferNotSetUp")}</p>
                </div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-surface rounded-2xl border border-border p-6 space-y-5">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-1.5">{t("accountNumber")}</p>
                        <div className="flex items-center justify-between bg-white border border-border rounded-xl px-4 py-3">
                            <span className="font-mono font-black text-text-base text-lg tracking-wide">{accountDisplay}</span>
                            <div className="flex items-center gap-2">
                                {bankName && <span className="text-[10px] font-bold text-text-subtle uppercase">{bankName}</span>}
                                <CopyButton value={accountDisplay} />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-1.5">{t("variableSymbol")}</p>
                            <div className="flex items-center justify-between bg-white border border-border rounded-xl px-4 py-3">
                                <span className="font-mono font-black text-text-base">{vsymbol}</span>
                                <CopyButton value={vsymbol} />
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-1.5">{t("amount")}</p>
                            <div className="bg-white border border-primary/20 rounded-xl px-4 py-3 font-mono font-black text-primary-ink text-lg">{totalStr}</div>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-surface rounded-2xl border border-border p-6 flex flex-col items-center justify-center gap-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle">{t("qrTitle")}</p>
                    <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
                        {showQr && qrDataUrl ? (
                            <Image src={qrDataUrl} alt={t("qrAlt")} width={160} height={160} className="w-40 h-40" unoptimized />
                        ) : (
                            <div className="w-40 h-40 bg-surface rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-2">
                                <div className="w-10 h-10 border-2 border-dashed border-text-subtle/30 rounded-full flex items-center justify-center">
                                    <span className="text-primary-ink font-extrabold text-[10px]">QR</span>
                                </div>
                                <span className="text-[10px] font-bold text-text-subtle uppercase tracking-tight text-center px-2">
                                    {showQr ? t("qrGenerating") : t("qrUnavailable")}
                                </span>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-text-muted text-center leading-relaxed">{t("qrCompatible")}</p>
                </div>
            </div>
            )}
            {accountDisplay && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { icon: Banknote, label: t("transferStep1"), desc: t("transferStep1Desc") },
                    { icon: Clock, label: t("transferStep2"), desc: t("transferStep2Desc") },
                    { icon: Truck, label: t("transferStep3"), desc: t("transferStep3Desc") },
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
            )}
        </div>
    );
}

function Dobirka({ totalStr, isZasilkovnaBox }: { totalStr: string; isZasilkovnaBox: boolean }) {
    const t = useT("success");
    const steps = isZasilkovnaBox
        ? [
            { step: "1", icon: Package, title: t("codPacking"), desc: t("codPackingDesc"), active: true },
            { step: "2", icon: Smartphone, title: t("codBoxPay"), desc: t("codBoxPayDesc"), active: false },
            { step: "3", icon: MapPin, title: t("codBoxPickup"), desc: t("codBoxPickupDesc"), active: false },
        ]
        : [
            { step: "1", icon: Package, title: t("codPacking"), desc: t("codPackingDesc"), active: true },
            { step: "2", icon: Truck, title: t("codCourier"), desc: t("codCourierDesc"), active: false },
            { step: "3", icon: Banknote, title: t("codPay"), desc: t("codPayDesc"), active: false },
        ];

    return (
        <div>
            <div className="mb-8">
                <SectionLabel>{t("paymentMethodEyebrow")}</SectionLabel>
                <h2 className="text-2xl font-extrabold text-text-base tracking-tight mb-2">
                    {isZasilkovnaBox ? t("codBoxTitle") : t("codTitle")}
                </h2>
                <p className="text-text-muted text-sm leading-relaxed max-w-lg">
                    {isZasilkovnaBox ? t("codBoxDesc") : t("codDesc")}
                </p>
            </div>
            <div className="bg-surface rounded-2xl border border-border p-6 lg:p-8 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {steps.map((s) => (
                        <div key={s.step} className="flex items-start gap-4">
                            <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm ${s.active ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : "bg-white border border-border text-text-subtle"}`}>{s.step}</div>
                            <div>
                                <p className="text-sm font-bold text-text-base mb-0.5">{s.title}</p>
                                <p className="text-xs text-text-muted leading-snug">{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-1 text-center sm:text-left">{t("amountDue")}</p>
                        <p className="text-3xl font-black text-text-base text-center sm:text-left">{totalStr}<span className="text-sm font-normal text-text-muted ml-2">{t("inclCodFee")}</span></p>
                    </div>
                    <StatusPill label={t("statusReady")} active />
                </div>
            </div>
            <div className="flex items-center gap-3 bg-surface rounded-xl border border-border px-5 py-4">
                <Phone size={16} className="text-text-muted shrink-0" aria-hidden="true" />
                <p className="text-xs text-text-muted leading-relaxed">
                    {isZasilkovnaBox ? t("codBoxNote") : t("codCourierNote")}
                </p>
            </div>
        </div>
    );
}

function KartaStripe({ totalStr, orderId }: { totalStr: string; orderId: string }) {
    const t = useT("success");
    return (
        <div>
            <div className="mb-8">
                <SectionLabel>{t("cardEyebrow")}</SectionLabel>
                <h2 className="text-2xl font-extrabold text-text-base tracking-tight mb-2">{t("cardTitle")}</h2>
                <p className="text-text-muted text-sm leading-relaxed max-w-lg">{t("cardDesc")}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface rounded-2xl border border-border p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-4">{t("cardSummary")}</p>
                    {[
                        { label: t("cardStatusLabel"), value: `✓ ${t("cardStatusPaid")}`, highlight: true },
                        { label: t("paymentMethodEyebrow"), value: t("cardMethod"), highlight: false },
                        { label: t("orderNumber"), value: `#${orderId}`, highlight: false },
                        { label: t("totalAmount"), value: totalStr, highlight: true },
                    ].map(({ label, value, highlight }) => (
                        <div key={label} className="flex items-center justify-between py-3.5 border-b border-border last:border-0">
                            <span className="text-xs font-bold uppercase tracking-wider text-text-subtle">{label}</span>
                            <span className={`text-sm font-bold ${highlight ? "text-primary-ink" : "text-text-base"}`}>{value}</span>
                        </div>
                    ))}
                    <div className="mt-5 flex items-center gap-2 justify-center">
                        <ShieldCheck size={13} className="text-text-subtle" aria-hidden="true" />
                        <p className="text-[10px] font-bold text-text-subtle uppercase tracking-[0.12em]">{t("securedByStripe")}</p>
                    </div>
                </div>
                <div className="bg-surface rounded-2xl border border-border p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-4">{t("whatsNext")}</p>
                    <div className="space-y-4">
                        {[
                            { icon: Mail, title: t("nextEmail"), desc: t("nextEmailDesc") },
                            { icon: Package, title: t("nextPacking"), desc: t("nextPackingDesc") },
                            { icon: Truck, title: t("nextCourier"), desc: t("nextCourierDesc") },
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
    const t = useT("success");
    const tc = useT("checkout");
    const isZasilkovna = orderData?.doprava === "zasilkovna_box";

    // Doručovací adresa = jiná adresa pokud zaškrtnuta, jinak fakturační
    const deliveryAddr = (info.jineDorucenoAdresa && info.dorAdresa?.uliceCp)
        ? info.dorAdresa
        : info.adresa;

    return (
        <div className="space-y-4">
            {/* Způsob doručení */}
            {orderData?.dopravaName && (
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-2">{t("deliveryMethod")}</p>
                    <div className="flex items-center gap-2 text-sm font-semibold text-text-base">
                        <Truck size={14} className="text-primary-ink shrink-0" aria-hidden="true" />
                        {shippingLabel(tc, orderData.doprava, orderData.dopravaName)}
                    </div>
                </div>
            )}

            <div className="h-px bg-border" />

            {/* Výdejní místo Zásilkovny */}
            {isZasilkovna && orderData?.zbox ? (
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-2">{t("pickupPoint")}</p>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                        <Package size={14} className="text-primary-ink mt-0.5 shrink-0" />
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
                            {info.jineDorucenoAdresa && info.dorAdresa?.uliceCp ? t("deliveryAddress") : t("billingAddress")}
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
                                {deliveryAddr.zeme && deliveryAddr.zeme !== COUNTRY_CZECHIA && (
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
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-2">{t("billingAddress")}</p>
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
                                {info.adresa.zeme && info.adresa.zeme !== COUNTRY_CZECHIA && (
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
    const t = useT("success");
    const tc = useT("checkout");
    const tcart = useT("cart");
    const searchParams = useSearchParams();
    const { currency } = useCurrency();

    const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
    const [hydrated, setHydrated] = useState(false);
    const [stableOrderId, setStableOrderId] = useState<string>("");
    const [, setLoadError] = useState(false);
    const [apiTotal, setApiTotal] = useState<number | null>(null);

    const rawMethod = searchParams.get("method") ?? "";
    const method: "prevod" | "dobirka" | "karta" =
        rawMethod === "prevod" ? "prevod" : rawMethod === "dobirka" ? "dobirka" : "karta";
    const sessionId = searchParams.get("session_id");
    const orderIdParam = searchParams.get("order_id");

    useEffect(() => {
        // Dokud neznáme skutečné ID objednávky, zobrazíme dočasnou hodnotu —
        // jakmile dorazí (níže), přepíšeme ji na variabilní symbol odvozený
        // ze SKUTEČNÉHO order.id, ať sedí se souhrnem v potvrzovacím e-mailu.
        if (orderIdParam) {
            // Dočasné ID z URL parametru; níže se přepíše skutečným order.id.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setStableOrderId(orderIdToVariableSymbol(orderIdParam));
        } else if (!sessionId) {
            setStableOrderId((Math.floor(Math.random() * 90000) + 10000).toString());
        }

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
                    if (o.id) setStableOrderId(orderIdToVariableSymbol(o.id));
                    setApiTotal(typeof data.amountTotal === "number" ? data.amountTotal : o.total);
                    setSnapshot({
                        items: o.items.map((it: ApiOrderItem) => ({
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
        try {
            const raw = localStorage.getItem(SNAPSHOT_KEY);
            if (raw) setSnapshot(JSON.parse(raw));
        } catch {}
        setHydrated(true);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const items = snapshot?.items ?? [];
    const info = snapshot?.info ?? {};
    const orderData = snapshot?.orderData ?? null;

    // Spojí dosavadní anonymní návštěvnickou identitu se skutečným zákazníkem
    // — jediné místo v appce, kde e-mail zákazníka známe jistě u všech tří
    // platebních metod (kartou/dobírkou/převodem), protože snapshot je vždy
    // dohydratovaný teprve tady.
    useEffect(() => {
        if (!hydrated || !info.email) return;
        identifyUser(info.email, info.jmeno ? { name: info.jmeno } : undefined);
    }, [hydrated, info.email, info.jmeno]);

    const vsymbol = stableOrderId.replace(/\D/g, "").slice(-8).padStart(8, "0");

    const subtotal = items.reduce((s, i) => s + getPrice(i.priceRaw, currency) * i.quantity, 0);
    const dopravaPrice = orderData?.dopravaPrices ? getPrice(orderData.dopravaPrices, currency) : 0;
    const dobirkaExtra = orderData?.isDobirka ? getPrice(DOBIRKA_FEE, currency) : 0;
    const celkem = apiTotal ?? (subtotal + dopravaPrice + dobirkaExtra);
    const celkemStr = hydrated ? formatPrice(celkem, currency) : "—";

    const statusLabel = method === "prevod" ? t("statusAwaitingPayment") : method === "dobirka" ? t("statusReady") : t("statusPaid");
    const methodLabel = paymentLabel(tc, method, t("cardMethodShort"));

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
                            <Link href="/" className="hover:text-white/60 transition-colors">{tc("home")}</Link>
                            <span className="opacity-40 mx-1">›</span>
                            <Link href="/kosik" className="hover:text-white/60 transition-colors">{tc("cart")}</Link>
                            <span className="opacity-40 mx-1">›</span>
                            <span className="text-white/60">{t("breadcrumb")}</span>
                        </nav>
                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                            <div className="flex items-start gap-6">
                                <div className="shrink-0 w-16 h-16 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                                    <CheckCircle2 size={30} className="text-primary-ink" />
                                </div>
                                <div>
                                    <p className="text-primary-ink text-xs font-bold uppercase tracking-[0.18em] mb-2">{t("eyebrow")}</p>
                                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-3">{t("title")}</h1>
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
                                    <p className="text-white/30 text-[10px] uppercase tracking-widest">{t("paymentMethodEyebrow")}</p>
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
                                {method === "prevod" && <BankovniPrevod totalStr={celkemStr} vsymbol={vsymbol} amount={celkem} currencyCode={currency.code} />}
                                {method === "dobirka" && <Dobirka totalStr={celkemStr} isZasilkovnaBox={orderData?.doprava === "zasilkovna_box"} />}
                                {method === "karta" && <KartaStripe totalStr={celkemStr} orderId={stableOrderId || "—"} />}
                            </div>
                        </div>

                        {/* Postranní panel */}
                        <div className="xl:col-span-1 flex flex-col gap-5">

                            {/* Položky objednávky */}
                            <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-4">{t("orderItems")}</p>
                                {hydrated && items.length > 0 ? (
                                    <div className="space-y-4 mb-5">
                                        {items.map((item, i) => {
                                            const itemPrice = getPrice(item.priceRaw, currency);
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
                                    <p className="text-text-subtle text-xs py-4 text-center">{t("itemsFailed")}</p>
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
                                            <span>{tc("subtotal")}</span>
                                            <span className="tabular-nums">{formatPrice(subtotal, currency)}</span>
                                        </div>
                                        {orderData?.discountCode && (
                                            <div className="flex justify-between text-xs text-green-600">
                                                <span className="flex items-center gap-1.5">
                                                    <Tag size={11} />
                                                    <span>{orderData.discountCode}</span>
                                                </span>
                                                <span className="tabular-nums font-semibold">{orderData.discountLabel}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-xs text-text-muted">
                                            <span>{tc("shipping")}{orderData?.doprava ? ` (${shippingLabel(tc, orderData.doprava, orderData.dopravaName)})` : ""}</span>
                                            <span className="tabular-nums">
                                                {dopravaPrice > 0 ? formatPrice(dopravaPrice, currency) : "Zdarma"}
                                            </span>
                                        </div>
                                        {orderData?.isDobirka && (
                                            <div className="flex justify-between text-xs text-text-muted">
                                                <span>{tc("cod")}</span>
                                                <span className="tabular-nums">{formatPrice(dobirkaExtra, currency)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm font-extrabold text-text-base pt-2 border-t border-border">
                                            <span>{tc("total")}</span>
                                            <span className="text-primary-ink tabular-nums">{celkemStr}</span>
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
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-3">{t("contactDetails")}</p>
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
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-2">{t("helpTitle")}</p>
                                <p className="text-xs text-text-muted leading-relaxed mb-4">{t("helpDesc")}</p>
                                <Link href="/kontakt" className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-base font-bold text-xs hover:bg-border/50 transition-colors">
                                    Kontaktovat podporu <ArrowRight size={13} />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Spodní info lišta */}
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { icon: Mail, title: t("trustEmail"), desc: t("trustEmailDesc") },
                            { icon: Truck, title: t("trustShipping"), desc: t("trustShippingDesc") },
                            { icon: ShieldCheck, title: t("trustReturns"), desc: t("trustReturnsDesc") },
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
                        <Link href="/" className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-primary text-on-primary font-extrabold text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10">
                            <ShoppingBag size={16} aria-hidden="true" /> {tcart("continueShopping")}
                        </Link>
                        <Link href="/reklamace" className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-border text-text-muted font-bold text-sm hover:bg-white hover:text-text-base transition-all flex items-center justify-center gap-2">
                            {t("complaintsLink")}
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