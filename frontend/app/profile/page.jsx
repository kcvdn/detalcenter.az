"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Toast from "@/app/dashboard/components/Toast";
import Navbar from "@/components/Navbar";
import SkeletonBlock from "@/components/SkeletonBlock";
import { navigateWithProgress } from "@/lib/navigationProgress";
import { clearStoredSession, getAuthHeaders, getStoredSession } from "@/lib/session";
import useTranslation from "@/hooks/useTranslation";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
const emptyForm = {
  name: "",
  email: "",
  oldPassword: "",
  newPassword: "",
};

function ProfileSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_0.8fr]">
      <section className="rounded-[32px] bg-white p-6 shadow-sm sm:p-8">
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="mt-4 h-8 w-48" />
        <div className="mt-8 grid gap-4">
          <SkeletonBlock className="h-14 w-full rounded-2xl" />
          <SkeletonBlock className="h-14 w-full rounded-2xl" />
          <SkeletonBlock className="h-16 w-full rounded-3xl" />
          <SkeletonBlock className="h-16 w-full rounded-3xl" />
          <SkeletonBlock className="h-12 w-full rounded-2xl" />
        </div>
      </section>

      <aside className="space-y-6">
        <div className="rounded-[32px] bg-white p-6 shadow-sm sm:p-8">
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="mt-4 h-8 w-40" />
          <SkeletonBlock className="mt-3 h-4 w-48" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <SkeletonBlock className="h-24 w-full rounded-3xl" />
            <SkeletonBlock className="h-24 w-full rounded-3xl" />
          </div>
        </div>

        <div className="rounded-[32px] bg-slate-950 p-6 shadow-sm sm:p-8">
          <SkeletonBlock className="h-4 w-28 bg-slate-700/80" />
          <SkeletonBlock className="mt-4 h-7 w-3/4 bg-slate-700/80" />
          <SkeletonBlock className="mt-3 h-20 w-full bg-slate-700/80" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <SkeletonBlock className="h-12 w-full rounded-2xl bg-slate-700/80" />
            <SkeletonBlock className="h-12 w-full rounded-2xl bg-slate-700/80" />
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    if (!toast.message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToast({ message: "", type: "success" });
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast.message]);

  useEffect(() => {
    const session = getStoredSession();

    if (!session.token || !session.userId) {
      navigateWithProgress(router, "/login", "replace");
      return;
    }

    axios
      .get(`${apiUrl}/api/me`, {
        headers: getAuthHeaders(),
      })
      .then((response) => {
        setUser(response.data);
        setForm({
          name: response.data?.name || "",
          email: response.data?.email || "",
          oldPassword: "",
          newPassword: "",
        });
      })
      .catch(() => {
        clearStoredSession();
        navigateWithProgress(router, "/login", "replace");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const handleChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    if (!form.name.trim() || !form.email.trim()) {
      setToast({ message: "Ad ve email mutleqdir.", type: "error" });
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
    };

    if (form.oldPassword || form.newPassword) {
      payload.oldPassword = form.oldPassword;
      payload.newPassword = form.newPassword;
    }

    setSaving(true);

    try {
      const response = await axios.put(`${apiUrl}/api/users/me`, payload, {
        headers: getAuthHeaders(),
      });

      setUser(response.data);
      setForm({
        name: response.data?.name || "",
        email: response.data?.email || "",
        oldPassword: "",
        newPassword: "",
      });
      setToast({ message: "Profil yenil\u0259ndi", type: "success" });
    } catch (error) {
      if (error.response?.status === 401) {
        clearStoredSession();
        navigateWithProgress(router, "/login", "replace");
        return;
      }

      setToast({
        message: error.response?.data?.error || "Profil yenil\u0259nm\u0259di.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <Toast message={toast.message} type={toast.type} />
      <Navbar search={search} setSearch={setSearch} isLoading={loading} />

      <section className="mx-auto max-w-5xl px-4 py-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:py-8 md:px-6 md:pb-10">
        {loading ? (
          <ProfileSkeleton />
        ) : user ? (
          <div className="grid gap-6 md:grid-cols-[1fr_0.8fr]">
            <form
              onSubmit={handleSave}
              className="rounded-[32px] bg-white p-6 shadow-sm sm:p-8"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-500">
                {t("profile")}
              </p>
              <h1 className="mt-4 text-2xl font-black text-slate-950 sm:text-3xl">
                Profili redakte et
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Adini, email unvanini ve istesen sifreni buradan yenile.
              </p>

              <div className="mt-8 grid gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Ad</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => handleChange("name", event.target.value)}
                    disabled={saving}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-red-300"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => handleChange("email", event.target.value)}
                    disabled={saving}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-red-300"
                  />
                </label>

                <div className="rounded-3xl bg-slate-50 p-4 sm:p-5">
                  <p className="text-sm font-semibold text-slate-900">Sifre deyis</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Sifreni deyismek istemirsense bu xanalarni bos saxla.
                  </p>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Kohne sifre</span>
                      <input
                        type="password"
                        value={form.oldPassword}
                        onChange={(event) => handleChange("oldPassword", event.target.value)}
                        disabled={saving}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-red-300"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Yeni sifre</span>
                      <input
                        type="password"
                        value={form.newPassword}
                        onChange={(event) => handleChange("newPassword", event.target.value)}
                        disabled={saving}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-red-300"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="press-feedback touch-target mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-44"
              >
                {saving ? "Yadda saxlanilir..." : t("save")}
              </button>
            </form>

            <div className="space-y-6">
              <div className="rounded-[32px] bg-white p-6 shadow-sm sm:p-8">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                  Hesab melumatlari
                </p>
                <h2 className="mt-3 text-2xl font-bold text-slate-950">{user.name}</h2>
                <p className="mt-2 text-base text-slate-500">{user.email}</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Rol</p>
                    <p className="mt-3 text-xl font-bold text-slate-900">{user.role}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Qosulub</p>
                    <p className="mt-3 text-xl font-bold text-slate-900">
                      {new Date(user.createdAt).toLocaleDateString("az-AZ")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[32px] bg-slate-950 p-6 text-white shadow-sm sm:p-8">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                  Account status
                </p>
                <h2 className="mt-4 text-2xl font-bold">Marketplace hesabin aktivdir</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Profilini yenile, sifarislerini yoxla ve alis-verise eyni yerdan davam et.
                </p>
              </div>

              <div className="rounded-[32px] bg-white p-6 shadow-sm sm:p-8">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/orders"
                    className="press-feedback touch-target inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Sifarislerim
                  </Link>
                  <Link
                    href="/favorites"
                    className="press-feedback touch-target inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Favoriler
                  </Link>
                  <Link
                    href="/"
                    className="press-feedback touch-target inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Alisverise davam et
                  </Link>
                  <Link
                    href="/cart"
                    className="press-feedback touch-target inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Sebete kec
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[28px] bg-white p-8 text-center text-slate-500 shadow-sm sm:p-10">
            Profil tapilmadi.
          </div>
        )}
      </section>
    </main>
  );
}
