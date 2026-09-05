"use client";

import { useEffect, useState } from "react";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { Oval } from "react-loader-spinner";
import { toast } from "react-toastify";
import { useDashboardContext } from "@/context/DashboardContext";
import {
  DIETARY_RESTRICTIONS,
  DIETARY_RESTRICTION_LABELS,
} from "@/lib/ai-flow/dietary";

export default function PreferencesDialog() {
  const {
    preferencesDialogRef,
    dietaryRestrictions,
    savePreferences,
  } = useDashboardContext()!;

  // working copy of the restrictions edited in the dialog; committed on save
  const [draft, setDraft] = useState<DietaryRestriction[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // reset the draft whenever the persisted restrictions change
  useEffect(() => {
    setDraft(dietaryRestrictions);
  }, [dietaryRestrictions]);

  const handleClose = () => {
    preferencesDialogRef.current?.close();
  };

  const handleToggle = (restriction: DietaryRestriction) => {
    setDraft((prev) =>
      prev.includes(restriction)
        ? prev.filter((r) => r !== restriction)
        : [...prev, restriction]
    );
  };

  async function handleSave() {
    try {
      setIsSaving(true);
      await savePreferences(draft);
      preferencesDialogRef.current?.close();
      toast.success("Dietary preferences saved");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <dialog
      ref={preferencesDialogRef}
      className="m-0 bg-transparent p-0 w-full max-w-xl"
    >
      <div className="fixed inset-0 bg-black/60 z-[-1]" onClick={handleClose} />
      <div className="card m-4 sm:m-auto p-6 bg-bg-card shadow-2xl border-white/10 max-h-[90dvh] flex flex-col gap-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="flex items-center gap-3">
              <span className="w-1.5 h-6 bg-accent rounded-full" />
              Dietary Preferences
            </h2>
            <p className="text-text-muted text-sm">
              Every generated dish will respect the restrictions you select.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 -mr-2 text-text-muted hover:text-red-500 transition-colors"
          >
            <IoIosCloseCircleOutline className="text-3xl" />
          </button>
        </div>

        {/* Restriction options */}
        <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-2">
          {DIETARY_RESTRICTIONS.map((restriction) => (
            <label
              key={restriction}
              className="flex items-center gap-3 p-3 bg-bg-subtle/50 border border-border rounded-lg cursor-pointer select-none hover:border-primary/40 transition-colors"
            >
              <input
                type="checkbox"
                checked={draft.includes(restriction)}
                onChange={() => handleToggle(restriction)}
                className="w-4 h-4 shrink-0 accent-primary cursor-pointer"
              />
              <span className="text-sm font-medium text-text">
                {DIETARY_RESTRICTION_LABELS[restriction]}
              </span>
              {draft.includes(restriction) && (
                <span className="ml-auto text-[10px] font-bold uppercase tracking-widest bg-accent/15 text-accent px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </label>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-border/50">
          <button
            onClick={handleClose}
            className="btn btn-ghost flex-1 h-10"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary flex-1 h-10"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Oval visible height="16" width="16" color="currentColor" />
                Saving...
              </span>
            ) : (
              "Save preferences"
            )}
          </button>
        </div>
      </div>
    </dialog>
  );
}