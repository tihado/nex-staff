import {
  PixelButton,
  PixelChoiceMenu,
  type PixelChoiceOption,
} from "@/components/pixel";
import type { DocumentSummary } from "@/lib/documents/types";

export interface StaffOption {
  id: string;
  name: string;
  role?: string;
}

interface DocumentDetailProps {
  actionError?: string | null;
  document: DocumentSummary;
  mode: "assignStaff" | "confirmDelete" | "idle";
  onAssignStaff: () => void;
  onCancelAction: () => void;
  onConfirmAssign: (staffId: string) => void;
  onConfirmDelete: () => void;
  onDelete: () => void;
  onView: () => void;
  staffOptions: StaffOption[];
}

function formatUploadedAt(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function resolveLinkedStaffNames(
  document: DocumentSummary,
  staffOptions: StaffOption[]
): string {
  if (document.linkedStaffIds.length === 0) {
    return "None";
  }

  const names = document.linkedStaffIds
    .map(
      (staffId) => staffOptions.find((option) => option.id === staffId)?.name
    )
    .filter((name): name is string => Boolean(name));

  return names.length > 0 ? names.join(", ") : "None";
}

export function DocumentDetail({
  document,
  staffOptions,
  mode,
  actionError,
  onDelete,
  onAssignStaff,
  onConfirmDelete,
  onConfirmAssign,
  onCancelAction,
  onView,
}: DocumentDetailProps) {
  const deleteChoices: PixelChoiceOption[] = [
    { id: "cancel", label: "Cancel" },
    { id: "delete", label: "Delete" },
  ];

  const assignableStaff = staffOptions.filter(
    (option) => !document.linkedStaffIds.includes(option.id)
  );

  const assignChoices: PixelChoiceOption[] = assignableStaff.map((option) => ({
    id: option.id,
    label: option.role ? `${option.name} — ${option.role}` : option.name,
  }));

  return (
    <section className="flex flex-col gap-3 border-2 border-wood bg-choice-bg/40 p-3">
      <div className="space-y-1">
        <p className="font-[family-name:var(--font-body)] text-[length:var(--font-size-dialogue)] text-text-primary">
          <span className="text-text-muted">Selected:</span> {document.filename}
        </p>
        <p className="font-[family-name:var(--font-body)] text-[18px] text-text-muted">
          {document.mimeType} · uploaded {formatUploadedAt(document.uploadedAt)}
        </p>
        <p className="font-[family-name:var(--font-body)] text-[18px] text-text-muted">
          Linked staff: {resolveLinkedStaffNames(document, staffOptions)}
        </p>
      </div>

      {actionError ? (
        <p
          className="font-[family-name:var(--font-body)] text-[18px] text-alert"
          role="alert"
        >
          {actionError}
        </p>
      ) : null}

      {mode === "confirmDelete" ? (
        <div className="space-y-2">
          <p className="font-[family-name:var(--font-body)] text-[18px] text-text-muted">
            Remove this document from the library?
          </p>
          <PixelChoiceMenu
            choices={deleteChoices}
            onSelect={(choiceId) => {
              if (choiceId === "delete") {
                onConfirmDelete();
                return;
              }

              onCancelAction();
            }}
          />
        </div>
      ) : null}

      {mode === "assignStaff" ? (
        <div className="space-y-2">
          {assignChoices.length === 0 ? (
            <p className="font-[family-name:var(--font-body)] text-[18px] text-text-muted">
              {staffOptions.length === 0
                ? "Hire staff on the floor before assigning documents."
                : "This document is already linked to all hired staff."}
            </p>
          ) : (
            <>
              <p className="font-[family-name:var(--font-body)] text-[18px] text-text-muted">
                Choose a staff member to link this document.
              </p>
              <PixelChoiceMenu
                choices={assignChoices}
                onSelect={onConfirmAssign}
              />
            </>
          )}
          <PixelButton onClick={onCancelAction}>Back</PixelButton>
        </div>
      ) : null}

      {mode === "idle" ? (
        <div className="flex flex-wrap gap-2">
          <PixelButton onClick={onView}>Unroll scroll</PixelButton>
          <PixelButton onClick={onDelete}>Delete</PixelButton>
          <PixelButton
            disabled={staffOptions.length === 0}
            onClick={onAssignStaff}
          >
            Assign staff
          </PixelButton>
        </div>
      ) : null}
    </section>
  );
}
