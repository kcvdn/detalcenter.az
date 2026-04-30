import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "Sebet",
  description: "Sebet sehifesi.",
  path: "/cart",
});

export default function CartLayout({ children }) {
  return children;
}
