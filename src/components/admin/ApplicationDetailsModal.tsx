"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useRTL } from "@/hooks/useRTL";
import {
  STATUS_VALUES,
  StatusValue,
  ApplicationRecord,
  formatTimestamp,
} from "./types";

const statusSelectedClasses: Record<StatusValue, string> = {
  pending: "bg-amber-500 border-amber-500 text-white",
  accepted: "bg-emerald-600 border-emerald-600 text-white",
  rejected: "bg-red-600 border-red-600 text-white",
};

interface DetailField {
  label: string;
  value: string;
  wide?: boolean;
}

function ModalContent({
  app,
  onClose,
  onSaved,
  onSendEmail,
}: {
  app: ApplicationRecord;
  onClose: () => void;
  onSaved: (rowNumber: number, updates: Partial<ApplicationRecord>) => void;
  onSendEmail: (rowNumber: number, decision: "accepted" | "rejected") => Promise<{ ok: boolean; sentAt?: string; error?: string }>;
}) {
  const t = useTranslations("admin");
  const { isRTL } = useRTL();

  const [selectedStatus, setSelectedStatus] = useState<StatusValue>(app.status);
  const [notesText, setNotesText] = useState(app.notes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [emailLoading, setEmailLoading] = useState<"accepted" | "rejected" | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const trackLabel =
    app.track === "expert"
      ? t("tracks.expert")
      : app.track === "young-speaker"
        ? t("tracks.young-speaker")
        : app.track;

  const details: DetailField[] = [
    { label: t("fields.timestamp"), value: formatTimestamp(app.timestamp, isRTL ? "ar" : "en") },
    { label: t("fields.track"), value: trackLabel },
    { label: t("fields.fullName"), value: app.fullName },
    { label: t("fields.age"), value: app.age },
    { label: t("fields.email"), value: app.email },
    { label: t("fields.phone"), value: app.phone },
    { label: t("fields.city"), value: app.city },
    { label: t("fields.howHeardAboutUs"), value: app.howHeardAboutUs },
    { label: t("fields.talkIdeaTitle"), value: app.talkIdeaTitle, wide: true },
    { label: t("fields.themeConnection"), value: app.themeConnection, wide: true },
    { label: t("fields.ideaSummary"), value: app.ideaSummary, wide: true },
    { label: t("fields.whyItMatters"), value: app.whyItMatters, wide: true },
  ];

  if (app.track === "young-speaker") {
    details.push(
      { label: t("fields.schoolName"), value: app.schoolName },
      { label: t("fields.guardianName"), value: app.guardianName },
      { label: t("fields.guardianContact"), value: app.guardianContact },
      { label: t("fields.parentalConsent"), value: app.parentalConsent }
    );
  } else if (app.track === "expert") {
    details.push(
      { label: t("fields.organizationAndRole"), value: app.organizationAndRole },
      { label: t("fields.areaOfWorkWithYouth"), value: app.areaOfWorkWithYouth, wide: true }
    );
  }

  details.push({ label: t("fields.consentToTerms"), value: app.consentToTerms });

  const statusChanged = selectedStatus !== app.status;
  const notesChanged = notesText.trim() !== (app.notes || "").trim();
  const hasChanges = statusChanged || notesChanged;

  const handleSave = async () => {
    if (saving || !hasChanges) return;
    setSaving(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [{
            rowNumber: app._rowNumber,
            ...(statusChanged ? { status: selectedStatus } : {}),
            ...(notesChanged ? { notes: notesText.trim() } : {}),
          }],
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      onSaved(app._rowNumber, {
        ...(statusChanged ? { status: selectedStatus } : {}),
        ...(notesChanged ? { notes: notesText.trim() } : {}),
      });
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2500);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleEmail = async (decision: "accepted" | "rejected") => {
    if (emailLoading) return;
    setEmailLoading(decision);
    setEmailError(null);
    try {
      const result = await onSendEmail(app._rowNumber, decision);
      if (!result.ok) setEmailError(result.error || "failed");
    } catch {
      setEmailError("network");
    } finally {
      setEmailLoading(null);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={t("modal.title")} wide>
      <div className="space-y-6">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {details.map((field) => (
            <div key={field.label} className={field.wide ? "sm:col-span-2" : ""}>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {field.label}
              </dt>
              <dd
                className={`mt-1 whitespace-pre-wrap break-words text-sm text-zinc-900 ${
                  field.wide ? "leading-relaxed" : ""
                }`}
              >
                {field.value || "—"}
              </dd>
            </div>
          ))}
        </dl>

        {/* الملاحظات الداخلية */}
        <div className="space-y-3 border-t border-border pt-5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("modalExtra.notes")}
          </label>
          <textarea
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            placeholder={t("modalExtra.notesPlaceholder")}
            rows={3}
            className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 resize-y"
          />
        </div>

        {/* تغيير الحالة + حفظ مدمج */}
        <div className="space-y-3 border-t border-border pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("modal.changeStatus")}
          </p>
          <div className="flex flex-wrap gap-2" role="group">
            {STATUS_VALUES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                aria-pressed={selectedStatus === status}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                  selectedStatus === status
                    ? statusSelectedClasses[status]
                    : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
                }`}
              >
                {t(`statuses.${status}`)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              size="sm"
              onClick={handleSave}
              loading={saving}
              loadingText={t("modalExtra.saving")}
              showCheck={savedFlash}
              disabled={!hasChanges}
            >
              {t("modalExtra.saveChanges")}
            </Button>
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {t("modal.saveFailed")}
              </p>
            )}
            {savedFlash && !error && (
              <p role="status" className="text-sm text-emerald-600">
                {t("modalExtra.saved")}
              </p>
            )}
          </div>
        </div>

        {/* قسم إيميل القرار */}
        <div className="space-y-3 border-t border-border pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("modalExtra.emailSection")}
          </p>
          {app.decisionEmailSentAt ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs">✓</span>
              {t("modalExtra.emailSentAt", { date: formatTimestamp(app.decisionEmailSentAt, isRTL ? "ar" : "en") })}
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={emailLoading !== null}
                onClick={() => handleEmail("accepted")}
                className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700 cursor-pointer transition-colors hover:bg-emerald-100 disabled:opacity-50"
              >
                {emailLoading === "accepted" ? t("modalExtra.emailSending") : t("modalExtra.sendAcceptEmail")}
              </button>
              <button
                type="button"
                disabled={emailLoading !== null}
                onClick={() => handleEmail("rejected")}
                className="rounded-full border border-red-300 bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-700 cursor-pointer transition-colors hover:bg-red-100 disabled:opacity-50"
              >
                {emailLoading === "rejected" ? t("modalExtra.emailSending") : t("modalExtra.sendRejectEmail")}
              </button>
              {emailError && (
                <p role="alert" className="text-sm text-red-600">{t("modalExtra.emailFailed")}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function ApplicationDetailsModal({
  app,
  onClose,
  onSaved,
  onSendEmail,
}: {
  app: ApplicationRecord | null;
  onClose: () => void;
  onSaved: (rowNumber: number, updates: Partial<ApplicationRecord>) => void;
  onSendEmail: (rowNumber: number, decision: "accepted" | "rejected") => Promise<{ ok: boolean; sentAt?: string; error?: string }>;
}) {
  if (!app) return null;
  return (
    <ModalContent
      key={app._rowNumber}
      app={app}
      onClose={onClose}
      onSaved={onSaved}
      onSendEmail={onSendEmail}
    />
  );
}
