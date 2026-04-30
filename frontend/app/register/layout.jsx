import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "Qeydiyyat",
  description: "Yeni istifadeci hesabinin yaradilməsi.",
  path: "/register",
});

export default function RegisterLayout({ children }) {
  return children;
}
