import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "Sifarisi tamamla",
  description: "Sifaris tamamlanma sehifesi.",
  path: "/checkout",
});

export default function CheckoutLayout({ children }) {
  return children;
}
