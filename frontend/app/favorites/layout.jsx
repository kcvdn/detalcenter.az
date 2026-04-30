import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "Secilmisler",
  description: "Secilmis mehsullar sehifesi.",
  path: "/favorites",
});

export default function FavoritesLayout({ children }) {
  return children;
}
