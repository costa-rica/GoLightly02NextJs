"use client";

import { useEffect, useMemo, useState } from "react";
import { createMantra } from "@/lib/api/mantras";
import { getSoundFiles } from "@/lib/api/sounds";
import Toast from "@/components/Toast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setMeditations } from "@/store/features/meditationSlice";
import { getAllMantras } from "@/lib/api/mantras";
import { validateMeditationTitle, validatePauseDuration, validateSpeed } from "@/lib/utils/validation";
import ModalConfirmCreateMeditation from "@/components/modals/ModalConfirmCreateMeditation";

export default function CreateMeditationForm() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, accessToken } = useAppSelector((state) => state.auth);
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  type Row = {
    id: number;
    type: "text" | "pause" | "sound";
    text: string;
    speed: string;
    pauseDuration: string;
    soundFile: string;
  };
  type RowError = {
    text?: string;
    speed?: string;
    pauseDuration?: string;
    soundFile?: string;
  };

  const [rows, setRows] = useState<Row[]>([]);
  const [rowErrors, setRowErrors] = useState<Record<number, RowError>>({});
  const [soundFiles, setSoundFiles] = useState<Array<{ name: string; filename: string }>>([]);
  const [soundsLoading, setSoundsLoading] = useState(false);
  const [soundsError, setSoundsError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const maxDescriptionLength = 300;

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchSounds = async () => {
      setSoundsLoading(true);
      setSoundsError(null);
      try {
        const response = await getSoundFiles();
        setSoundFiles(
          response.soundFiles.map((sound) => ({
            name: sound.name,
            filename: sound.filename,
          }))
        );
      } catch (err: any) {
        const message = err?.response?.data?.error?.message || "Unable to load sound files.";
        setSoundsError(message);
      } finally {
        setSoundsLoading(false);
      }
    };

    fetchSounds();
  }, [isAuthenticated]);

  const handleToggle = () => {
    setIsExpanded((prev) => {
      const nextValue = !prev;
      if (nextValue && rows.length === 0) {
        setRows([
          {
            id: 1,
            type: "text",
            text: "",
            speed: "",
            pauseDuration: "",
            soundFile: "",
          },
        ]);
      }
      return nextValue;
    });
  };

  const handleAddRow = () => {
    setRows((prev) => {
      const nextId = prev.length + 1;
      return [
        ...prev,
        {
          id: nextId,
          type: "text",
          text: "",
          speed: "",
          pauseDuration: "",
          soundFile: "",
        },
      ];
    });
  };

  const handleDeleteRow = (id: number) => {
    setRows((prev) =>
      prev
        .filter((row) => row.id !== id)
        .map((row, index) => ({ ...row, id: index + 1 }))
    );
    setRowErrors({});
  };

  const moveRow = (id: number, direction: "up" | "down") => {
    setRows((prev) => {
      const index = prev.findIndex((row) => row.id === id);
      if (index < 0) return prev;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const nextRows = [...prev];
      const [moved] = nextRows.splice(index, 1);
      nextRows.splice(targetIndex, 0, moved);
      return nextRows.map((row, rowIndex) => ({ ...row, id: rowIndex + 1 }));
    });
    setRowErrors({});
  };

  const updateRow = (id: number, updates: Partial<Row>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...updates } : row)));
  };

  const clearRowError = (id: number, field: keyof RowError) => {
    setRowErrors((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: undefined,
      },
    }));
  };

  const submitEnabled = useMemo(() => !isSubmitting && rows.length > 0, [isSubmitting, rows.length]);

  const handleOpenModal = () => {
    // Validate rows before opening modal
    const nextRowErrors: typeof rowErrors = {};
    rows.forEach((row) => {
      const rowError: RowError = {};
      if (row.type === "text") {
        if (!row.text.trim()) {
          rowError.text = "Text is required";
        }
        if (row.speed.trim()) {
          const speedValidation = validateSpeed(row.speed);
          if (!speedValidation.valid) {
            rowError.speed = speedValidation.message;
          }
        }
      }

      if (row.type === "pause") {
        const pauseValidation = validatePauseDuration(row.pauseDuration);
        if (!pauseValidation.valid) {
          rowError.pauseDuration = pauseValidation.message;
        }
      }

      if (row.type === "sound") {
        if (!row.soundFile) {
          rowError.soundFile = "Select a sound file";
        }
      }

      if (Object.keys(rowError).length > 0) {
        nextRowErrors[row.id] = rowError;
      }
    });
    setRowErrors(nextRowErrors);

    // Only open modal if no row errors
    if (Object.keys(nextRowErrors).length === 0) {
      setIsModalOpen(true);
    }
  };

  const handleSubmit = async () => {
    // Validate title and description
    const titleValidation = validateMeditationTitle(title);
    const nextErrors: { title?: string; description?: string } = {};
    if (!titleValidation.valid) {
      nextErrors.title = titleValidation.message;
    }
    if (description.length > maxDescriptionLength) {
      nextErrors.description = `Description must be ${maxDescriptionLength} characters or less`;
    }
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createMantra({
        title: title.trim(),
        description: description.trim() || undefined,
        visibility,
        mantraArray: rows.map((row) => {
          if (row.type === "text") {
            return {
              id: row.id,
              text: row.text.trim(),
              speed: row.speed.trim() || undefined,
            };
          }

          if (row.type === "pause") {
            return {
              id: row.id,
              pause_duration: row.pauseDuration.trim(),
            };
          }

          return {
            id: row.id,
            sound_file: row.soundFile,
          };
        }),
      });

       const refresh = await getAllMantras(true, accessToken);
       dispatch(setMeditations(refresh.mantras ?? []));
      setToast({ message: "Meditation submitted successfully.", variant: "success" });
      setTitle("");
      setDescription("");
      setVisibility("public");
      setRows([]);
      setRowErrors({});
      setIsExpanded(false);
      setIsModalOpen(false);
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || "Unable to submit meditation.";
      setToast({ message, variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTitleBlur = () => {
    const result = validateMeditationTitle(title);
    if (!result.valid) {
      setErrors((prev) => ({ ...prev, title: result.message }));
    }
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (errors.title) {
      setErrors((prev) => ({ ...prev, title: undefined }));
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    if (value.length > maxDescriptionLength) {
      setErrors((prev) => ({
        ...prev,
        description: `Description must be ${maxDescriptionLength} characters or less`,
      }));
    } else if (errors.description) {
      setErrors((prev) => ({ ...prev, description: undefined }));
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isSubmitting}
        className="flex w-full items-center justify-between rounded-2xl border border-calm-200/70 bg-white/80 px-4 py-3 text-left shadow-sm transition hover:border-primary-200"
        aria-expanded={isExpanded}
      >
        <div>
          <h2 className="text-xl font-display font-semibold text-calm-900">Create New Meditation</h2>
          <p className="text-sm text-calm-500">Build a custom meditation sequence</p>
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
        <div className="rounded-3xl border border-dashed border-calm-200 bg-white/70 p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-semibold text-calm-900">Meditation Rows</h3>
              <button
                type="button"
                onClick={handleAddRow}
                disabled={isSubmitting}
                className="rounded-full border border-primary-200 px-4 py-2 text-xs font-semibold text-primary-700 transition hover:border-primary-300"
              >
                Add Row
              </button>
            </div>

            {soundsError && (
              <p className="mt-2 text-xs text-red-500">{soundsError}</p>
            )}

            <div className="mt-4 space-y-3">
              {rows.map((row, index) => (
                <div
                  key={row.id}
                  className="flex flex-col gap-4 rounded-2xl border border-calm-100 bg-white px-4 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-calm-100 text-xs font-semibold text-calm-600">
                        {row.id}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-calm-700">Row {row.id}</p>
                        <p className="text-xs text-calm-400">Select the row type</p>
                      </div>
                    </div>
                    <select
                      value={row.type}
                      onChange={(event) =>
                        (() => {
                          updateRow(row.id, {
                            type: event.target.value as "text" | "pause" | "sound",
                            text: "",
                            speed: "",
                            pauseDuration: "",
                            soundFile: "",
                          });
                          setRowErrors((prev) => ({
                            ...prev,
                            [row.id]: {},
                          }));
                        })()
                      }
                      disabled={isSubmitting}
                      className="rounded-full border border-calm-200 bg-white px-3 py-2 text-xs font-semibold text-calm-700"
                    >
                      <option value="text">Text</option>
                      <option value="pause">Pause</option>
                      <option value="sound">Sound File</option>
                    </select>
                  </div>

                  {row.type === "text" && (
                    <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
                      <div>
                        <label className="text-xs font-semibold text-calm-600">Text</label>
                        <textarea
                          rows={2}
                          value={row.text}
                          onChange={(event) => {
                            updateRow(row.id, { text: event.target.value });
                            if (rowErrors[row.id]?.text) {
                              clearRowError(row.id, "text");
                            }
                          }}
                          className={`mt-2 w-full rounded-2xl border px-3 py-2 text-xs text-calm-900 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100 ${
                            rowErrors[row.id]?.text ? "border-red-300" : "border-calm-200"
                          }`}
                          placeholder="Begin with a calming phrase..."
                        />
                        {rowErrors[row.id]?.text && (
                          <p className="mt-1 text-xs text-red-500">{rowErrors[row.id]?.text}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-calm-600">Speed (0.7-1.3)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.7"
                        max="1.3"
                        value={row.speed}
                        onChange={(event) => {
                          updateRow(row.id, { speed: event.target.value });
                          if (rowErrors[row.id]?.speed) {
                            clearRowError(row.id, "speed");
                          }
                        }}
                        disabled={isSubmitting}
                        className={`mt-2 w-full rounded-2xl border px-3 py-2 text-xs text-calm-900 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100 ${
                          rowErrors[row.id]?.speed ? "border-red-300" : "border-calm-200"
                        }`}
                        placeholder="1.0"
                      />
                        {rowErrors[row.id]?.speed && (
                          <p className="mt-1 text-xs text-red-500">{rowErrors[row.id]?.speed}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {row.type === "pause" && (
                    <div>
                      <label className="text-xs font-semibold text-calm-600">Duration (seconds)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={row.pauseDuration}
                        onChange={(event) => {
                          updateRow(row.id, { pauseDuration: event.target.value });
                          if (rowErrors[row.id]?.pauseDuration) {
                            clearRowError(row.id, "pauseDuration");
                          }
                        }}
                        disabled={isSubmitting}
                        className={`mt-2 w-full rounded-2xl border px-3 py-2 text-xs text-calm-900 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100 ${
                          rowErrors[row.id]?.pauseDuration ? "border-red-300" : "border-calm-200"
                        }`}
                        placeholder="5"
                      />
                      {rowErrors[row.id]?.pauseDuration && (
                        <p className="mt-1 text-xs text-red-500">
                          {rowErrors[row.id]?.pauseDuration}
                        </p>
                      )}
                    </div>
                  )}

                  {row.type === "sound" && (
                    <div>
                      <label className="text-xs font-semibold text-calm-600">Select Sound File</label>
                      <select
                        value={row.soundFile}
                        onChange={(event) => {
                          updateRow(row.id, { soundFile: event.target.value });
                          if (rowErrors[row.id]?.soundFile) {
                            clearRowError(row.id, "soundFile");
                          }
                        }}
                        disabled={soundsLoading || isSubmitting}
                        className={`mt-2 w-full rounded-2xl border px-3 py-2 text-xs text-calm-900 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100 ${
                          rowErrors[row.id]?.soundFile ? "border-red-300" : "border-calm-200"
                        }`}
                      >
                        <option value="">
                          {soundsLoading ? "Loading sound files..." : "Select a sound file"}
                        </option>
                        {soundFiles.map((sound) => (
                          <option key={sound.filename} value={sound.filename}>
                            {sound.name}
                          </option>
                        ))}
                      </select>
                      {rowErrors[row.id]?.soundFile && (
                        <p className="mt-1 text-xs text-red-500">{rowErrors[row.id]?.soundFile}</p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveRow(row.id, "up")}
                      disabled={index === 0 || isSubmitting}
                      className="rounded-full border border-calm-200 px-3 py-1 text-xs font-semibold text-calm-600 transition hover:border-primary-200 disabled:cursor-not-allowed disabled:text-calm-300"
                    >
                      Move Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRow(row.id, "down")}
                      disabled={index === rows.length - 1 || isSubmitting}
                      className="rounded-full border border-calm-200 px-3 py-1 text-xs font-semibold text-calm-600 transition hover:border-primary-200 disabled:cursor-not-allowed disabled:text-calm-300"
                    >
                      Move Down
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(row.id)}
                      disabled={isSubmitting}
                      className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 transition hover:border-red-300 disabled:cursor-not-allowed disabled:border-red-100 disabled:text-red-300"
                    >
                      Delete Row
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {rows.length === 0 && (
              <p className="mt-4 text-sm text-calm-500">Add a row to begin building your sequence.</p>
            )}
          </div>

          <div className="mt-8 flex items-center justify-end">
            <button
              type="button"
              onClick={handleOpenModal}
              disabled={!submitEnabled}
              className="rounded-full bg-primary-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-200"
            >
              Submit
            </button>
          </div>
        </div>
      )}

      <ModalConfirmCreateMeditation
        isOpen={isModalOpen}
        rows={rows}
        soundFiles={soundFiles}
        title={title}
        description={description}
        visibility={visibility}
        errors={errors}
        isSubmitting={isSubmitting}
        maxDescriptionLength={maxDescriptionLength}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleSubmit}
        onTitleChange={handleTitleChange}
        onDescriptionChange={handleDescriptionChange}
        onVisibilityChange={setVisibility}
        onTitleBlur={handleTitleBlur}
      />

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </section>
  );
}
