"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import TableAdminUsers from "@/components/tables/TableAdminUsers";
import TableAdminSoundsFiles from "@/components/tables/TableAdminSoundsFiles";
import TableAdminMeditations from "@/components/tables/TableAdminMeditations";
import TableAdminQueuer from "@/components/tables/TableAdminQueuer";
import ModalUploadSoundFile from "@/components/modals/ModalUploadSoundFile";
import ModalConfirmDelete from "@/components/modals/ModalConfirmDelete";
import Toast from "@/components/Toast";
import {
  deleteMantra,
  deleteQueuerRecord,
  deleteUser,
  getAllMantras,
  getQueuerRecords,
  getUsers,
  type AdminUser,
  type QueueRecord,
} from "@/lib/api/admin";
import type { Meditation } from "@/store/features/meditationSlice";
import {
  deleteSoundFile,
  getSoundFiles,
  type SoundFile,
} from "@/lib/api/sounds";
import { useAppSelector } from "@/store/hooks";

export default function AdminPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [isExpanded, setIsExpanded] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const [isSoundsExpanded, setIsSoundsExpanded] = useState(false);
  const [soundFiles, setSoundFiles] = useState<SoundFile[]>([]);
  const [soundsLoading, setSoundsLoading] = useState(false);
  const [soundsError, setSoundsError] = useState<string | null>(null);
  const [soundDeleteTarget, setSoundDeleteTarget] = useState<SoundFile | null>(
    null,
  );
  const [isSoundDeleting, setIsSoundDeleting] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isMeditationsExpanded, setIsMeditationsExpanded] = useState(false);
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [meditationsLoading, setMeditationsLoading] = useState(false);
  const [meditationsError, setMeditationsError] = useState<string | null>(null);
  const [meditationDeleteTarget, setMeditationDeleteTarget] =
    useState<Meditation | null>(null);
  const [isMeditationDeleting, setIsMeditationDeleting] = useState(false);
  const [isQueuerExpanded, setIsQueuerExpanded] = useState(false);
  const [queueRecords, setQueueRecords] = useState<QueueRecord[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [queueDeleteTarget, setQueueDeleteTarget] =
    useState<QueueRecord | null>(null);
  const [isQueueDeleting, setIsQueueDeleting] = useState(false);

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
        setError(
          err?.response?.data?.error?.message || "Unable to load users.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSoundFiles = useCallback(async () => {
    setSoundsLoading(true);
    setSoundsError(null);

    try {
      const response = await getSoundFiles();
      setSoundFiles(response.soundFiles ?? []);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setSoundsError("You do not have permission to view sound files.");
      } else {
        setSoundsError(
          err?.response?.data?.error?.message || "Unable to load sound files.",
        );
      }
    } finally {
      setSoundsLoading(false);
    }
  }, []);

  const fetchMeditations = useCallback(async () => {
    setMeditationsLoading(true);
    setMeditationsError(null);

    try {
      const response = await getAllMantras();
      setMeditations(response.mantras ?? []);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setMeditationsError("You do not have permission to view meditations.");
      } else {
        setMeditationsError(
          err?.response?.data?.error?.message || "Unable to load meditations.",
        );
      }
    } finally {
      setMeditationsLoading(false);
    }
  }, []);

  const fetchQueuerRecords = useCallback(async () => {
    setQueueLoading(true);
    setQueueError(null);

    try {
      const response = await getQueuerRecords();
      setQueueRecords(response.queue ?? []);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setQueueError("You do not have permission to view queue records.");
      } else {
        setQueueError(
          err?.response?.data?.error?.message ||
            "Unable to load queue records.",
        );
      }
    } finally {
      setQueueLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!isSoundsExpanded || soundFiles.length > 0 || soundsLoading) return;
    fetchSoundFiles();
  }, [fetchSoundFiles, isSoundsExpanded, soundFiles.length, soundsLoading]);

  useEffect(() => {
    if (!isMeditationsExpanded || meditations.length > 0 || meditationsLoading)
      return;
    fetchMeditations();
  }, [
    fetchMeditations,
    isMeditationsExpanded,
    meditations.length,
    meditationsLoading,
  ]);

  useEffect(() => {
    if (!isQueuerExpanded || queueRecords.length > 0 || queueLoading) return;
    fetchQueuerRecords();
  }, [fetchQueuerRecords, isQueuerExpanded, queueRecords.length, queueLoading]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.id === user?.id) {
      setToast({
        message: "You cannot delete your own admin account.",
        variant: "error",
      });
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
      const message =
        err?.response?.data?.error?.message || "Unable to delete user.";
      setToast({ message, variant: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSoundDeleteConfirm = async () => {
    if (!soundDeleteTarget) return;
    setIsSoundDeleting(true);
    try {
      await deleteSoundFile(soundDeleteTarget.id);
      setSoundFiles((prev) =>
        prev.filter((item) => item.id !== soundDeleteTarget.id),
      );
      setToast({ message: "Sound file deleted.", variant: "success" });
      setSoundDeleteTarget(null);
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message || "Unable to delete sound file.";
      setToast({ message, variant: "error" });
    } finally {
      setIsSoundDeleting(false);
    }
  };

  const handleMeditationDeleteConfirm = async () => {
    if (!meditationDeleteTarget) return;
    setIsMeditationDeleting(true);
    try {
      await deleteMantra(meditationDeleteTarget.id);
      setMeditations((prev) =>
        prev.filter((item) => item.id !== meditationDeleteTarget.id),
      );
      setToast({ message: "Meditation deleted.", variant: "success" });
      setMeditationDeleteTarget(null);
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message || "Unable to delete meditation.";
      setToast({ message, variant: "error" });
    } finally {
      setIsMeditationDeleting(false);
    }
  };

  const handleQueueDeleteConfirm = async () => {
    if (!queueDeleteTarget) return;
    setIsQueueDeleting(true);
    try {
      await deleteQueuerRecord(queueDeleteTarget.id);
      setQueueRecords((prev) =>
        prev.filter((item) => item.id !== queueDeleteTarget.id),
      );
      setToast({ message: "Queue record deleted.", variant: "success" });
      setQueueDeleteTarget(null);
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message || "Unable to delete queue record.";
      setToast({ message, variant: "error" });
    } finally {
      setIsQueueDeleting(false);
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <main className="min-h-screen bg-gradient-to-b from-calm-50 via-white to-primary-50">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 md:px-8 md:py-16">
          <header className="rounded-3xl border border-calm-200/70 bg-white/80 p-8 shadow-sm backdrop-blur">
            <p className="text-xs uppercase tracking-[0.25em] text-calm-500">
              Admin
            </p>
            <h1 className="mt-3 text-3xl font-display font-semibold text-calm-900 md:text-4xl">
              Manage Go Lightly
            </h1>
            <p className="mt-3 max-w-2xl text-base text-calm-600 md:text-lg">
              Review user accounts, meditation content, sound files, and queued
              jobs.
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
                <h2 className="text-xl font-display font-semibold text-calm-900">
                  Users
                </h2>
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
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
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

          <section className="space-y-4">
            <button
              type="button"
              onClick={() => setIsSoundsExpanded((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-2xl border border-calm-200/70 bg-white/80 px-4 py-3 text-left shadow-sm transition hover:border-primary-200"
              aria-expanded={isSoundsExpanded}
            >
              <div>
                <h2 className="text-xl font-display font-semibold text-calm-900">
                  Sound Files
                </h2>
                <p className="text-sm text-calm-500">
                  Upload and manage audio assets
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsUploadOpen(true);
                  }}
                  className="rounded-full border border-primary-200 px-4 py-2 text-xs font-semibold text-primary-700 transition hover:border-primary-300"
                >
                  Upload Sound File
                </button>
                <span className="text-calm-500">
                  {isSoundsExpanded ? (
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </span>
              </div>
            </button>

            {isSoundsExpanded && (
              <div className="rounded-3xl border border-calm-200/70 bg-white p-4 shadow-sm md:p-6">
                {soundsLoading && (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={`admin-sounds-skeleton-${index}`}
                        className="flex items-center justify-between rounded-2xl border border-calm-100 bg-calm-50 px-4 py-3 animate-pulse"
                      >
                        <div className="h-4 w-1/3 rounded-full bg-calm-200" />
                        <div className="h-4 w-20 rounded-full bg-calm-200" />
                      </div>
                    ))}
                  </div>
                )}

                {!soundsLoading && soundsError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">
                    <p>{soundsError}</p>
                    <button
                      type="button"
                      onClick={fetchSoundFiles}
                      className="mt-3 rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:border-red-300"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!soundsLoading && !soundsError && (
                  <TableAdminSoundsFiles
                    soundFiles={soundFiles}
                    onDelete={(target) => setSoundDeleteTarget(target)}
                  />
                )}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <button
              type="button"
              onClick={() => setIsMeditationsExpanded((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-2xl border border-calm-200/70 bg-white/80 px-4 py-3 text-left shadow-sm transition hover:border-primary-200"
              aria-expanded={isMeditationsExpanded}
            >
              <div>
                <h2 className="text-xl font-display font-semibold text-calm-900">
                  Meditations
                </h2>
                <p className="text-sm text-calm-500">
                  Review all meditation content
                </p>
              </div>
              <span className="text-calm-500">
                {isMeditationsExpanded ? (
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </span>
            </button>

            {isMeditationsExpanded && (
              <div className="rounded-3xl border border-calm-200/70 bg-white p-4 shadow-sm md:p-6">
                {meditationsLoading && (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={`admin-meditations-skeleton-${index}`}
                        className="flex items-center justify-between rounded-2xl border border-calm-100 bg-calm-50 px-4 py-3 animate-pulse"
                      >
                        <div className="h-4 w-1/3 rounded-full bg-calm-200" />
                        <div className="h-4 w-20 rounded-full bg-calm-200" />
                      </div>
                    ))}
                  </div>
                )}

                {!meditationsLoading && meditationsError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">
                    <p>{meditationsError}</p>
                    <button
                      type="button"
                      onClick={fetchMeditations}
                      className="mt-3 rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:border-red-300"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!meditationsLoading && !meditationsError && (
                  <TableAdminMeditations
                    meditations={meditations}
                    onDelete={(target) => setMeditationDeleteTarget(target)}
                  />
                )}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <button
              type="button"
              onClick={() => setIsQueuerExpanded((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-2xl border border-calm-200/70 bg-white/80 px-4 py-3 text-left shadow-sm transition hover:border-primary-200"
              aria-expanded={isQueuerExpanded}
            >
              <div>
                <h2 className="text-xl font-display font-semibold text-calm-900">
                  Queuer
                </h2>
                <p className="text-sm text-calm-500">
                  Monitor queued meditation jobs
                </p>
              </div>
              <span className="text-calm-500">
                {isQueuerExpanded ? (
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </span>
            </button>

            {isQueuerExpanded && (
              <div className="rounded-3xl border border-calm-200/70 bg-white p-4 shadow-sm md:p-6">
                {queueLoading && (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={`admin-queue-skeleton-${index}`}
                        className="flex items-center justify-between rounded-2xl border border-calm-100 bg-calm-50 px-4 py-3 animate-pulse"
                      >
                        <div className="h-4 w-1/3 rounded-full bg-calm-200" />
                        <div className="h-4 w-20 rounded-full bg-calm-200" />
                      </div>
                    ))}
                  </div>
                )}

                {!queueLoading && queueError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">
                    <p>{queueError}</p>
                    <button
                      type="button"
                      onClick={fetchQueuerRecords}
                      className="mt-3 rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:border-red-300"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!queueLoading && !queueError && (
                  <TableAdminQueuer
                    records={queueRecords}
                    onDelete={(target) => setQueueDeleteTarget(target)}
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
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}
      <ModalUploadSoundFile
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={() => {
          fetchSoundFiles();
          setToast({ message: "Sound file uploaded.", variant: "success" });
        }}
      />
      <ModalConfirmDelete
        isOpen={!!soundDeleteTarget}
        title={`Delete ${soundDeleteTarget?.name || "sound file"}`}
        message="This will permanently remove the sound file."
        confirmLabel="Delete sound file"
        isLoading={isSoundDeleting}
        onClose={() => setSoundDeleteTarget(null)}
        onConfirm={handleSoundDeleteConfirm}
      />
      <ModalConfirmDelete
        isOpen={!!meditationDeleteTarget}
        title={`Delete ${meditationDeleteTarget?.title || "meditation"}`}
        message="This will permanently remove the meditation. Admins can delete any meditation."
        confirmLabel="Delete meditation"
        isLoading={isMeditationDeleting}
        onClose={() => setMeditationDeleteTarget(null)}
        onConfirm={handleMeditationDeleteConfirm}
      />
      <ModalConfirmDelete
        isOpen={!!queueDeleteTarget}
        title={`Delete queue record ${queueDeleteTarget?.id || ""}`}
        message="This will remove the queue record but not the meditation itself."
        confirmLabel="Delete queue record"
        isLoading={isQueueDeleting}
        onClose={() => setQueueDeleteTarget(null)}
        onConfirm={handleQueueDeleteConfirm}
      />
    </ProtectedRoute>
  );
}
