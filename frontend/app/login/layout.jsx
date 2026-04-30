import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "Giris",
  description: "Istifadeci hesabina daxil ol.",
  path: "/login",
});

export default function LoginLayout({ children }) {
  return children;
}
