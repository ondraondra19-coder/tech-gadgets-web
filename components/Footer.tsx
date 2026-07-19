"use client";

// Klientská komponenta. Dřív byla serverová (nižší bundle), ale jazyk se čte
// z cookie až po hydrataci — viz komentář v lib/locale.ts — a patička je
// prakticky celá text, takže by ze serveru stejně nezbylo nic k ušetření.
// Interaktivní části (newsletter, logo se scrollem) zůstávají zvlášť.
import {
  Phone, Mail, MapPin, Clock,
  Instagram, Facebook, Youtube,
  Truck, RotateCcw, ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Newsletter from "./FooterNewsletter";
import HomeLink from "./HomeLink";
import { categories, getCategoryName } from "@/lib/products";
import { useT } from "@/lib/useT";
import { useLang } from "@/lib/LangContext";

const socialLinks = [
  { icon: Instagram, label: "Instagram", href: "https://instagram.com/slingr.cz" },
  { icon: Facebook,  label: "Facebook",  href: "https://facebook.com/slingr.cz"  },
  { icon: Youtube,   label: "YouTube",   href: "https://youtube.com/@slingr"     },
];

export default function Footer() {
  const t = useT("footer");
  const { locale } = useLang();

  const trustItems = [
    { icon: Truck,       label: t("trustExpedition") },
    { icon: RotateCcw,   label: t("trustReturns")    },
    { icon: ShieldCheck, label: t("trustWarranty")   },
  ];

  const footerNav = [
    {
      heading: t("headingCategories"),
      links: categories.map(cat => ({
        label: getCategoryName(cat, locale),
        href: `/kategorie/${cat.slug}`,
      })),
    },
    {
      heading: t("headingCustomer"),
      links: [
        { label: t("orderStatus"),     href: "/objednavky" },
        { label: t("returnsLink"),     href: "/reklamace"  },
        { label: t("claims"),          href: "/reklamace"  },
        { label: t("shippingPayment"), href: "/doprava"    },
        { label: t("faq"),             href: "/faq"        },
      ],
    },
    {
      heading: t("headingAbout"),
      links: [
        { label: t("aboutHackpack"), href: "/o-nas"   },
        { label: t("blog"),          href: "/blog"    },
        { label: t("contact"),       href: "/kontakt" },
      ],
    },
  ];

  const legalLinks = [
    { label: t("terms"),   href: "/obchodni-podminky"      },
    { label: t("privacy"), href: "/ochrana-osobnich-udaju" },
    { label: t("cookies"), href: "/cookies"                },
  ];

  return (
    <footer className="bg-header">

      <Newsletter />

      {/* Main grid */}
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8">

          {/* Brand column — 2/6 */}
          <div className="sm:col-span-2 lg:col-span-2 flex flex-col gap-6">

            {/* Logo — HomeLink je klientský ostrůvek kvůli scrollu nahoru */}
            <HomeLink className="inline-block">
              <Image
                src="/images/main/logo-white.png"
                alt="SLINGR"
                width={1024}
                height={559}
                className="h-20 w-auto object-contain"
              />
            </HomeLink>

            <p className="text-white/60 text-sm leading-relaxed max-w-[260px]">
              {t("description")}
            </p>

            {/* Trust pills */}
            <div className="flex flex-col gap-2">
              {trustItems.map(item => (
                <div key={item.label} className="inline-flex items-center gap-2.5 text-white/60 text-xs">
                  <item.icon size={13} className="text-primary shrink-0" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Kontakty */}
            <div className="flex flex-col gap-2.5 pt-1 border-t border-white/8">
              <a
                href="tel:+420737565577"
                className="inline-flex items-center gap-2.5 text-white/60 text-sm hover:text-white/70 transition-colors"
              >
                <Phone size={13} className="text-primary shrink-0" />
                <span>+420 737 565 577</span>
              </a>
              <a
                href="mailto:info@dodelat.cz"
                className="inline-flex items-center gap-2.5 text-white/60 text-sm hover:text-white/70 transition-colors"
              >
                <Mail size={13} className="text-primary shrink-0" />
                <span>info@dodelat.cz</span>
              </a>
              <div className="inline-flex items-start gap-2.5 text-white/60 text-sm">
                <MapPin size={13} className="text-primary shrink-0 mt-0.5" />
                <span>{t("address")}</span>
              </div>
              <div className="inline-flex items-start gap-2.5 text-white/60 text-sm">
                <Clock size={13} className="text-primary shrink-0 mt-0.5" />
                <span>{t("openingHours")}</span>
              </div>
            </div>

            {/* Social */}
            <div className="flex items-center gap-2">
              {socialLinks.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/55 hover:text-white hover:border-white/30 transition-all duration-200"
                >
                  <s.icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Separator — desktop only */}
          <div className="hidden lg:block lg:col-span-1" />

          {/* Nav columns — 3/6 */}
          {footerNav.map(col => (
            <div key={col.heading} className="flex flex-col gap-4">
              <p className="text-white/70 font-semibold text-xs uppercase tracking-widest">
                {col.heading}
              </p>
              <ul className="flex flex-col gap-3">
                {col.links.map(link => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-white/55 text-sm hover:text-white/75 transition-colors duration-150"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/50 text-xs">
            © {new Date().getFullYear()} SLINGR s.r.o. — {t("rights")}
          </p>
          <div className="flex items-center gap-1">
            {legalLinks.map((link, i, arr) => (
              <span key={link.label} className="flex items-center gap-1">
                <a
                  href={link.href}
                  className="text-white/50 text-xs hover:text-white/55 transition-colors"
                >
                  {link.label}
                </a>
                {i < arr.length - 1 && (
                  /* Čistě dekorativní oddělovač — aria-hidden, ať ho čtečka nečte
                     mezi odkazy. Kontrast se u dekorace neposuzuje. */
                  <span aria-hidden="true" className="text-white/15 text-xs select-none">·</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

    </footer>
  );
}
