import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "Sifarisler",
  description: "Istifadeci sifarisleri sehifesi.",
  path: "/orders",
});

export default function OrdersLayout({ children }) {
  return children;
}
