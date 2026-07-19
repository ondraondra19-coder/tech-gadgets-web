import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TermsPage from "@/components/legal/TermsPage";

// Serverová stránka jen kvůli metadata — ta z klientské komponenty exportovat
// nejdou. Text je klientský, protože se vybírá podle jazyka (viz lib/locale.ts).
export const metadata = {
  title: "Obchodní podmínky | SLINGR",
};

export default function ObchodniPodminkyPage() {
  return (
    <>
      <Header />
      <TermsPage />
      <Footer />
    </>
  );
}
