import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PrivacyPage from "@/components/legal/PrivacyPage";

// Serverová stránka jen kvůli metadata — ta z klientské komponenty exportovat
// nejdou. Text je klientský, protože se vybírá podle jazyka (viz lib/locale.ts).
export const metadata = {
  title: "Ochrana osobních údajů | SLINGR",
};

export default function OchranaOsobnichUdajuPage() {
  return (
    <>
      <Header />
      <PrivacyPage />
      <Footer />
    </>
  );
}
