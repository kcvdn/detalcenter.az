import "./globals.css";
import MobileNav from "@/components/MobileNav";
import PageTransition from "@/components/PageTransition";
import PublicFooter from "@/components/PublicFooter";
import SiteIntro from "@/components/SiteIntro";
import StructuredData from "@/components/StructuredData";
import TopProgressBar from "@/components/TopProgressBar";
import {
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE,
  DEFAULT_SEO_DESCRIPTION,
  SITE_LANGUAGE,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
  buildRobots,
} from "@/lib/seo";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_SEO_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.svg"],
    apple: ["/favicon.svg"],
  },
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DEFAULT_SEO_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DEFAULT_SEO_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: buildRobots(false),
};

export default function RootLayout({ children }) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: SITE_LANGUAGE,
  };

  return (
    <html lang="az" data-scroll-behavior="smooth">
      <body className="min-h-screen overflow-x-hidden">
        <StructuredData data={organizationJsonLd} />
        <StructuredData data={websiteJsonLd} />
        <SiteIntro />
        <TopProgressBar />
        <PageTransition groupId="root-page-transition" preservePrefix="/dashboard">
          {children}
        </PageTransition>
        <PublicFooter />
        <MobileNav />
      </body>
    </html>
  );
}
