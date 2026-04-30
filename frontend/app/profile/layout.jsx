import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "Profil",
  description: "Istifadeci profil sehifesi.",
  path: "/profile",
});

export default function ProfileLayout({ children }) {
  return children;
}
