"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import TableAdminUsers from "@/components/tables/TableAdminUsers";
import ModalConfirmDelete from "@/components/modals/ModalConfirmDelete";
import Toast from "@/components/Toast";
import { deleteUser, getUsers, type AdminUser } from "@/lib/api/admin";
import { useAppSelector } from "@/store/hooks";

export default function AdminPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [isExpanded, setIsExpanded] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getUsers();
      setUsers(response.users);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setError("You do not have permission to view users.");
      } else {
        setError(err?.response?.data?.error?.message || "Unable to load users.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.id === user?.id) {
      setToast({ message: "You cannot delete your own admin account.", variant: "error" });
      setDeleteTarget(null);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setToast({ message: "User deleted.", variant: "success" });
      setDeleteTarget(null);
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || "Unable to delete user.";
      setToast({ message, variant: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <main className="min-h-screen bg-gradient-to-b from-calm-50 via-white to-primary-50">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 md:px-8 md:py-16">
          <header className="rounded-3xl border border-calm-200/70 bg-white/80 p-8 shadow-sm backdrop-blur">
            <p className="text-xs uppercase tracking-[0.25em] text-calm-500">Admin</p>
            <h1 className="mt-3 text-3xl font-display font-semibold text-calm-900 md:text-4xl">
              Manage Mantrify
            </h1>
            <p className="mt-3 max-w-2xl text-base text-calm-600 md:text-lg">
              Review user accounts, meditation content, sound files, and queued jobs.
            </p>
          </header>

          <section className="space-y-4">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-2xl border border-calm-200/70 bg-white/80 px-4 py-3 text-left shadow-sm transition hover:border-primary-200"
              aria-expanded={isExpanded}
            >
              <div>
                <h2 className="text-xl font-display font-semibold text-calm-900">Users</h2>
                <p className="text-sm text-calm-500">Manage registered users</p>
              </div>
              <span className="text-calm-500">
                {isExpanded ? (
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </span>
            </button>

            {isExpanded && (
              <div className="rounded-3xl border border-calm-200/70 bg-white p-4 shadow-sm md:p-6">
                {loading && (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={`admin-users-skeleton-${index}`}
                        className="flex items-center justify-between rounded-2xl border border-calm-100 bg-calm-50 px-4 py-3 animate-pulse"
                      >
                        <div className="h-4 w-1/3 rounded-full bg-calm-200" />
                        <div className="h-4 w-20 rounded-full bg-calm-200" />
                      </div>
                    ))}
                  </div>
                )}

                {!loading && error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">
                    <p>{error}</p>
                    <button
                      type="button"
                      onClick={fetchUsers}
                      className="mt-3 rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:border-red-300"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!loading && !error && (
                  <TableAdminUsers
                    users={users}
                    currentUserId={user?.id}
                    onDelete={(target) => setDeleteTarget(target)}
                  />
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      <ModalConfirmDelete
        isOpen={!!deleteTarget}
        title={`Delete ${deleteTarget?.email || "user"}`}
        message="This will permanently remove the user account."
        confirmLabel="Delete user"
        isLoading={isDeleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
      {toast && <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
    </ProtectedRoute>
  );
}
