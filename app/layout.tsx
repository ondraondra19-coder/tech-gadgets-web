import type { Metadata, Viewport } from "next"; // Přidán import Viewport
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { CurrencyProvider } from "@/lib/CurrencyContext";
import ChatWidget from "@/components/ChatWidget";
import CookieBanner from "@/components/CookieBanner";
import { LangProvider } from "@/lib/LangContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TechGadgets",
  description: "Originální Apple příslušenství",
};

// OPRAVA: Exportujeme nastavení viewportu, které iPhonu povolí roztáhnout web pod notch/Dynamic Island
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <head>
        {/* Vynucení černé barvy pro stavovou lištu v iOS a roztáhnutí viewportu */}
        <meta name="theme-color" content="#111111" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* CurrencyProvider je vně, aby CartProvider mohl reagovat na změnu měny */}
        <LangProvider>
          <CurrencyProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </CurrencyProvider>
        </LangProvider>

        <ChatWidget />
        <CookieBanner />

        {/* Google Translate — skrytý widget, ovládaný z Headeru */}
        <div id="google_translate_element" className="hidden" />

        <Script id="gt-init" strategy="afterInteractive">{`
          function googleTranslateElementInit() {
            new google.translate.TranslateElement({
              pageLanguage: 'cs',
              includedLanguages: 'cs,sk,en',
              autoDisplay: false,
            }, 'google_translate_element');
          }
        `}</Script>
        <Script
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />

        {/* Skryj Google Translate lištu nahoře a tooltipy */}
        <style>{`
          .goog-te-banner-frame, #goog-gt-tt, .goog-te-balloon-frame { display: none !important; }
          body { top: 0 !important; }
          .skiptranslate { display: none !important; }
        `}</style>
      </body>
    </html>
  );
}