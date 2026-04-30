"use client";

import { useEffect, useState } from "react";
import Toast from "@/app/dashboard/components/Toast";
import { logApiUrl, safeDelete, safeGet, safePost, safePut } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/session";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingEmail, setEditingEmail] = useState("");
  const [editingPassword, setEditingPassword] = useState("");
  const [editingSaving, setEditingSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const loadUsers = async () => {
    setLoading(true);

    try {
      const data = await safeGet(
        "/api/users",
        {
          headers: getAuthHeaders(),
        },
        "User siyahisi yuklenmedi.",
      );

      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      setToast({ message: error.message || "User siyahisi yuklenmedi.", type: "error" });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    logApiUrl();
    loadUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!name || !email || !password || !role) {
      setToast({ message: "Butun user field-leri vacibdir.", type: "error" });
      return;
    }

    setSubmitting(true);

    try {
      await safePost(
        "/api/users",
        {
          name,
          email,
          password,
          role,
        },
        {
          headers: getAuthHeaders(),
        },
        "User yaratmaq olmadi.",
      );

      setName("");
      setEmail("");
      setPassword("");
      setToast({ message: "User yaradildi.", type: "success" });
      loadUsers();
    } catch (error) {
      setToast({
        message: error.message || "User yaratmaq olmadi.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const startEditingUser = (user) => {
    setEditingUserId(user.id);
    setEditingName(user.name || "");
    setEditingEmail(user.email || "");
    setEditingPassword("");
  };

  const cancelEditingUser = () => {
    setEditingUserId(null);
    setEditingName("");
    setEditingEmail("");
    setEditingPassword("");
  };

  const saveUser = async () => {
    if (!editingUserId || !editingName || !editingEmail) {
      setToast({ message: "Ad və email boş ola bilməz.", type: "error" });
      return;
    }

    setEditingSaving(true);

    try {
      const updatePayload = {
        name: editingName,
        email: editingEmail,
      };

      if (editingPassword.trim()) {
        if (editingPassword.length < 6) {
          throw new Error("Yeni sifre en azi 6 simvoldan ibaret olmalidir.");
        }

        updatePayload.password = editingPassword;
      }

      await safePut(
        `/api/users/${editingUserId}`,
        updatePayload,
        {
          headers: getAuthHeaders(),
        },
        "User yenilenmedi.",
      );

      setToast({ message: "User yenilendi.", type: "success" });
      cancelEditingUser();
      loadUsers();
    } catch (error) {
      setToast({ message: error.message || "User yenilenmedi.", type: "error" });
    } finally {
      setEditingSaving(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!userId || deletingId === userId) {
      return;
    }

    if (!window.confirm("Bu user-i silmek istediyinizden eminsiniz?")) {
      return;
    }

    setDeletingId(userId);

    try {
      await safeDelete(
        `/api/users/${userId}`,
        {
          headers: getAuthHeaders(),
        },
        "User silmek olmadi.",
      );

      setToast({ message: "User silindi.", type: "success" });
      loadUsers();
    } catch (error) {
      setToast({ message: error.message || "User silmek olmadi.", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <Toast message={toast.message} type={toast.type} />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <p className="mt-1 text-sm text-slate-500">Admin butun qeydiyyatdan kecen user-leri gore biler</p>
      </div>

      <section className="rounded-3xl bg-slate-50 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Yeni user yarat</h2>
          <p className="mt-1 text-sm text-slate-500">
            Yeni hesablar buradan yaradilir. Rol secimi baglanib, butun yeni userler
            standart `USER` rolu ile yaradilir.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <input
            className="rounded-xl border border-slate-200 px-4 py-3"
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={submitting}
          />
          <input
            className="rounded-xl border border-slate-200 px-4 py-3"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={submitting}
          />
          <select
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            disabled={submitting}
          >
            <option value="USER">User</option>
            <option value="SELLER_ADMIN">Seller Admin</option>
            <option value="ADMIN">Admin</option>
          </select>
          <input
            className="rounded-xl border border-slate-200 px-4 py-3"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          Rol sahesi yalniz baxis ucundur. Admin panelinden rol redaktesi ve rol
          teyinati deaktiv edilib.
        </div>

        <button
          type="button"
          onClick={handleCreateUser}
          disabled={submitting}
          className="mt-4 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating..." : "Create User"}
        </button>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Qeydiyyatdan kecen userler</h2>
          <p className="mt-1 text-sm text-slate-500">
            Rol melumati sadece gosterilir. Buradan user adini ve email-i redakte etmek olur.
          </p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-5 py-8 text-sm text-slate-500">
            Userler yuklenir...
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-5 py-8 text-sm text-slate-500">
            User tapilmadi.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {users.map((user) => (
              <article
                key={user.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    {editingUserId === user.id ? (
                      <div className="space-y-3">
                        <input
                          className="w-full rounded-xl border border-slate-200 px-4 py-3"
                          placeholder="Name"
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          disabled={editingSaving}
                        />
                        <input
                          className="w-full rounded-xl border border-slate-200 px-4 py-3"
                          placeholder="Email"
                          type="email"
                          value={editingEmail}
                          onChange={(event) => setEditingEmail(event.target.value)}
                          disabled={editingSaving}
                        />
                        <input
                          className="w-full rounded-xl border border-slate-200 px-4 py-3"
                          placeholder="Yeni sifre (bos buraxmaq istenilmir)"
                          type="password"
                          value={editingPassword}
                          onChange={(event) => setEditingPassword(event.target.value)}
                          disabled={editingSaving}
                        />
                        <p className="text-xs text-slate-400">Sifresini deyiwmek istemirsinizse, bu saheni bos buraxin.</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-lg font-semibold text-slate-900">{user.name}</p>
                        <p className="mt-1 break-all text-sm text-slate-500">{user.email}</p>
                      </>
                    )}
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {user.role}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Role</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{user.role}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Created</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {new Date(user.createdAt).toLocaleDateString("az-AZ")}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {editingUserId === user.id ? (
                    <>
                      <button
                        type="button"
                        onClick={saveUser}
                        disabled={editingSaving}
                        className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {editingSaving ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditingUser}
                        disabled={editingSaving}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEditingUser(user)}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteUser(user.id)}
                        disabled={deletingId === user.id}
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === user.id ? "Deleting..." : "Delete"}
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
