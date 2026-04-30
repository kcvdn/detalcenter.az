import Link from "next/link";
import BrandLockup from "@/components/BrandLockup";

function LocationPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path
        d="M12 21C12 21 18 15.6274 18 10.5C18 7.18629 15.3137 4.5 12 4.5C8.68629 4.5 6 7.18629 6 10.5C6 15.6274 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10.5" r="2.2" fill="currentColor" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 8V12L14.8 13.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M7.2 4.8C7.6 4.4 8.2 4.2 8.8 4.3L11.1 4.7C11.8 4.8 12.3 5.3 12.4 6L12.8 8.3C12.9 8.9 12.7 9.5 12.3 9.9L10.9 11.3C11.9 13.5 13.7 15.3 15.9 16.3L17.3 14.9C17.7 14.5 18.3 14.3 18.9 14.4L21.2 14.8C21.9 14.9 22.4 15.4 22.5 16.1L22.9 18.4C23 19 22.8 19.6 22.4 20C21.5 20.9 20.2 21.3 19 21.1C10.8 19.8 4.2 13.2 2.9 5C2.7 3.8 3.1 2.5 4 1.6L7.2 4.8Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M6.5 8L12 12.5L17.5 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 18V6M12 6L7 11M12 6L17 11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M13.5 21V13.75H16L16.4 10.9H13.5V9.08C13.5 8.25 13.74 7.68 14.93 7.68H16.5V5.12C15.73 5.04 14.95 5 14.18 5C11.89 5 10.32 6.39 10.32 8.95V10.9H8V13.75H10.32V21H13.5Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <rect x="4.25" y="4.25" width="15.5" height="15.5" rx="4.25" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.35" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.9" r="1" fill="currentColor" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M6.73 8.5C5.71 8.5 4.9 7.68 4.9 6.67C4.9 5.66 5.71 4.83 6.73 4.83C7.73 4.83 8.55 5.66 8.55 6.67C8.55 7.68 7.73 8.5 6.73 8.5ZM5.17 19.17H8.28V9.77H5.17V19.17ZM10.13 9.77H13.11V11.05H13.15C13.57 10.26 14.58 9.43 16.08 9.43C19.2 9.43 19.78 11.48 19.78 14.14V19.17H16.67V14.71C16.67 13.64 16.65 12.27 15.2 12.27C13.72 12.27 13.49 13.42 13.49 14.63V19.17H10.38L10.13 9.77Z" />
    </svg>
  );
}

function TiktokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M14.7 4H17.4C17.62 5.75 18.68 7.31 20.25 8.15V11.01C19.05 10.97 17.89 10.63 16.9 10.03V15.33C16.9 18.72 14.14 21.48 10.75 21.48C7.36 21.48 4.6 18.72 4.6 15.33C4.6 11.94 7.36 9.18 10.75 9.18C11.03 9.18 11.3 9.2 11.56 9.24V12.23C11.3 12.15 11.03 12.1 10.75 12.1C8.97 12.1 7.52 13.55 7.52 15.33C7.52 17.11 8.97 18.56 10.75 18.56C12.53 18.56 13.98 17.11 13.98 15.33V4H14.7Z" />
    </svg>
  );
}

function toPhoneHref(phoneNumber) {
  const normalized = String(phoneNumber || "").replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : "#";
}

function socialLinksFromContent(content) {
  return [
    {
      key: "facebook",
      href: content.footerFacebookUrl,
      icon: <FacebookIcon />,
      label: "Facebook",
    },
    {
      key: "instagram",
      href: content.footerInstagramUrl,
      icon: <InstagramIcon />,
      label: "Instagram",
    },
    {
      key: "linkedin",
      href: content.footerLinkedinUrl,
      icon: <LinkedinIcon />,
      label: "LinkedIn",
    },
    {
      key: "tiktok",
      href: content.footerTiktokUrl,
      icon: <TiktokIcon />,
      label: "TikTok",
    },
  ].filter((item) => item.href);
}

function FooterInfoRow({ icon, label, value, href, preview = false }) {
  const content = href && !preview
    ? (
      <a
        href={href}
        className="text-sm font-semibold text-slate-900 transition hover:text-red-500"
      >
        {value}
      </a>
    )
    : <span className="text-sm font-semibold text-slate-900">{value}</span>;

  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.45)]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          {label}
        </p>
        <div className="mt-1 break-words">{content}</div>
      </div>
    </div>
  );
}

export default function SiteFooterContent({
  content,
  preview = false,
  embedded = false,
  showScrollTop = false,
  onScrollTop,
}) {
  const quickLinks = [
    {
      href: "/mexfilik-siyaseti",
      label: content.footerPrivacyLabel,
    },
    {
      href: "/sertler-ve-qaydalar",
      label: content.footerTermsLabel,
    },
    {
      href: "/haqqimizda",
      label: content.footerAboutLabel,
    },
    {
      href: "/tez-tez-verilen-suallar",
      label: content.footerFaqLabel,
    },
  ].filter((item) => item.label);
  const socialLinks = socialLinksFromContent(content);

  return (
    <footer className={embedded ? "mt-0" : "mt-10"}>
      <div className={embedded ? "" : "mx-auto max-w-7xl px-4 pb-8 md:px-6 md:pb-10"}>
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(241,245,249,0.96))] shadow-[0_34px_80px_-52px_rgba(15,23,42,0.42)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.1),transparent_22%),radial-gradient(circle_at_center,rgba(248,250,252,0.35),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.1),transparent_24%)]" />

          <div className="relative">
            <div className="hidden md:flex absolute left-6 top-6 h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0ea5e9,#0284c7)] text-white shadow-[0_22px_36px_-18px_rgba(2,132,199,0.55)]">
              <LocationPinIcon />
            </div>

            {showScrollTop ? (
              <button
                type="button"
                onClick={onScrollTop}
                className="press-feedback absolute right-6 top-6 hidden h-14 w-14 items-center justify-center rounded-full border border-emerald-700/20 bg-white/92 text-emerald-800 shadow-[0_18px_34px_-20px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:bg-white md:inline-flex"
                aria-label="Yuxariya qayit"
              >
                <ArrowUpIcon />
              </button>
            ) : null}

            <div className="grid gap-8 px-6 py-8 md:px-8 md:py-10 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
              <section className="lg:pl-16">
                <BrandLockup
                  className="w-fit"
                  markClassName="h-14 w-auto shrink-0"
                  titleClassName="text-lg sm:text-xl"
                  taglineClassName="text-[10px] tracking-[0.32em]"
                />
                <p className="mt-5 max-w-md text-sm leading-7 text-slate-500">
                  {content.footerDescription}
                </p>
              </section>

              <section className="space-y-4">
                <FooterInfoRow
                  icon={<ClockIcon />}
                  label={content.footerWorkHoursLabel}
                  value={content.footerWorkHoursValue}
                  preview={preview}
                />
                <FooterInfoRow
                  icon={<PhoneIcon />}
                  label={content.footerPhoneLabel}
                  value={content.footerPhoneValue}
                  href={toPhoneHref(content.footerPhoneValue)}
                  preview={preview}
                />
                <FooterInfoRow
                  icon={<MailIcon />}
                  label={content.footerEmailLabel}
                  value={content.footerEmailValue}
                  href={`mailto:${content.footerEmailValue}`}
                  preview={preview}
                />

                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.45)]">
                    <InstagramIcon />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {content.footerSocialLabel}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      {socialLinks.map((item) =>
                        preview ? (
                          <span
                            key={item.key}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
                            aria-label={item.label}
                          >
                            {item.icon}
                          </span>
                        ) : (
                          <a
                            key={item.key}
                            href={item.href}
                            target="_blank"
                            rel="noreferrer"
                            className="press-feedback inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-red-500"
                            aria-label={item.label}
                          >
                            {item.icon}
                          </a>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="border-t border-slate-200/80 px-6 py-5 md:px-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-sm text-slate-500">
                  {content.footerCopyright}
                </p>

                <div className="flex flex-wrap gap-2">
                  {quickLinks.map((item) =>
                    preview ? (
                      <span
                        key={item.href}
                        className="rounded-full border border-slate-200 bg-white/92 px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_12px_24px_-22px_rgba(15,23,42,0.38)]"
                      >
                        {item.label}
                      </span>
                    ) : (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="press-feedback rounded-full border border-slate-200 bg-white/92 px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_12px_24px_-22px_rgba(15,23,42,0.38)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-red-500"
                      >
                        {item.label}
                      </Link>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
