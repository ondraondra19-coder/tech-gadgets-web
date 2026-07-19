import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DopravaClient from "@/components/DopravaClient";

// Serverová stránka jen kvůli metadata — ta z klientské komponenty exportovat
// nejdou, a titulek stránky je pro vyhledávače podstatný. Obsah je klientský,
// protože texty potřebují jazyk (viz lib/locale.ts).
export const metadata = {
  title: "Doprava a platba | SLINGR",
  description: "Přehled způsobů dopravy, platby a informace o expedici objednávek.",
};

export default function DopravaAPlatbaPage() {
  return (
    <>
      <Header />
      <DopravaClient />
      <Footer />
    </>
  );
}
