"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useTranslation from "@/hooks/useTranslation";
import { navigateWithProgress } from "@/lib/navigationProgress";
import { clearStoredSession, getStoredSession } from "@/lib/session";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const { token, role, userId } = getStoredSession();

    if (!token && !role) {
      return;
    }

    if (!token || !role || !userId) {
      clearStoredSession();
      return;
    }

    navigateWithProgress(router, role === "ADMIN" ? "/dashboard" : "/", "replace");
  }, [router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await axios.post(`${apiUrl}/api/auth/register`, {
        name,
        email,
        password,
      });

      navigateWithProgress(router, "/login", "replace");
    } catch (error) {
      if (error.code === "ERR_NETWORK") {
        setError(t("backend_not_running"));
      } else {
        setError(error.response?.data?.error || t("register_failed"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-start justify-center bg-slate-100 px-4 py-6 sm:py-10 md:items-center">
      <div className="w-full max-w-md overflow-hidden rounded-[32px] bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
        <div className="mb-6 h-1.5 w-24 rounded-full bg-gradient-to-r from-slate-950 via-red-500 to-rose-400" />
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-500">{t("register")}</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">{t("register_title")}</h1>
          <p className="mt-2 text-sm text-slate-500">{t("register_desc")}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder={t("name")}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-red-400"
            disabled={submitting}
            required
          />

          <input
            type="email"
            placeholder={t("email")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-red-400"
            disabled={submitting}
            required
          />

          <input
            type="password"
            placeholder={t("password")}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-red-400"
            disabled={submitting}
            required
          />

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="press-feedback touch-target w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? `${t("register")}...` : t("register")}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="press-feedback touch-target inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 font-medium text-slate-500 transition hover:text-slate-900"
          >
            {t("back_home")}
          </Link>
          <Link
            href="/login"
            className="press-feedback touch-target inline-flex items-center justify-center rounded-2xl bg-red-50 px-4 py-3 font-medium text-red-500 transition hover:bg-red-100 hover:text-red-600"
          >
            {t("login_here")}
          </Link>
        </div>
      </div>
    </main>
  );
}
