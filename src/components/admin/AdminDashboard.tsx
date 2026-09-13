"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  AlertCircle,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  User,
} from "lucide-react";
import Button from "@/components/ui/Button";
import ApplicationsTable from "./ApplicationsTable";
import ApplicationDetailsModal from "./ApplicationDetailsModal";
import {
  STATUS_VALUES,
  StatusValue,
  ApplicationRecord,
  normalizeApplication,
} from "./types";
import StatsBar from "./StatsBar";

const TOKEN_KEY = "tedx-admin-token";
const USER_KEY = "tedx-admin-user";
const LAST_SEEN_KEY = "tedx-admin-last-seen";

interface StoredUser {
  username: string;
  displayName: string;
  role: string;
}

type TrackFilter = "all" | "young-speaker" | "expert";
type TimeFilter = "all" | "week" | "month";
type LoginErrorKey = "wrong" | "notConfigured" | "rateLimited" | "network";
type FetchErrorKey = "fetchFailed" | "unauthorized" | null;

interface UpdateItem {
  rowNumber: number;
  status?: StatusValue;
  notes?: string;
}

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-zinc-200 bg-white p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
            value === option.value
              ? "bg-tedx-red text-white"
              : "text-zinc-600 hover:text-black"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function mergeApplications(
  old: ApplicationRecord[],
  fresh: ApplicationRecord[]
): ApplicationRecord[] {
  const freshMap = new Map(fresh.map((a) => [a._rowNumber, a]));
  const seen = new Set<number>();
  const result: ApplicationRecord[] = [];

  for (const app of old) {
    const updated = freshMap.get(app._rowNumber);
    if (updated) {
      result.push(updated);
      seen.add(app._rowNumber);
    }
  }

  for (const app of fresh) {
    if (!seen.has(app._rowNumber)) {
      result.push(app);
    }
  }

  return result;
}

export default function AdminDashboard() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common.ui");
  const locale = useLocale();

  const [bootstrapped, setBootstrapped] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<LoginErrorKey | null>(null);

  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<FetchErrorKey>(null);

  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState<TrackFilter>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | StatusValue>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [exporting, setExporting] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(
    null
  );
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [cpCurrent, setCpCurrent] = useState("");
  const [cpNew, setCpNew] = useState("");
  const [cpLoading, setCpLoading] = useState(false);
  const [cpError, setCpError] = useState<string | null>(null);
  const [cpSuccess, setCpSuccess] = useState(false);

  const [lastSeenTs, setLastSeenTs] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem(LAST_SEEN_KEY) || 0);
  });

  function timestampMs(value: string): number {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  }

  const newCount = useMemo(
    () => (lastSeenTs > 0 ? applications.filter((app) => timestampMs(app.timestamp) > lastSeenTs).length : 0),
    [applications, lastSeenTs]
  );

  const loadApplications = useCallback(
    async (authToken: string, mode: "initial" | "refresh") => {
      if (mode === "initial") setLoading(true);
      else setRefreshing(true);
      setFetchError(null);
      try {
        const res = await fetch("/api/admin/applications", {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.status === 401 || res.status === 403) {
          sessionStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setApplications([]);
          setFetchError("unauthorized");
          return;
        }
        if (!res.ok) {
          setFetchError("fetchFailed");
          return;
        }
        const data = await res.json();
        const rows: Record<string, unknown>[] = Array.isArray(
          data?.applications
        )
          ? data.applications
          : [];
        setApplications(rows.map(normalizeApplication));
      } catch {
        setFetchError("fetchFailed");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      const saved = sessionStorage.getItem(TOKEN_KEY);
      const savedUser = sessionStorage.getItem(USER_KEY);
      setBootstrapped(true);
      if (!saved) return;
      setToken(saved);
      if (savedUser) {
        try { setCurrentUser(JSON.parse(savedUser)); } catch { /* ignore */ }
      }
      loadApplications(saved, "initial");
    })();
    return () => {
      cancelled = true;
    };
  }, [loadApplications]);

  // --- Live polling: 15s interval, pauses when tab is hidden ---
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function poll() {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const res = await fetch("/api/admin/applications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const rows: Record<string, unknown>[] = Array.isArray(data?.applications)
          ? data.applications
          : [];
        if (cancelled) return;
        const fresh = rows.map(normalizeApplication);
        setApplications((prev) => {
          const merged = mergeApplications(prev, fresh);
          if (merged.length === prev.length && merged.every((a, i) => a._rowNumber === prev[i]._rowNumber && a.status === prev[i].status && a.notes === prev[i].notes)) {
            return prev;
          }
          return merged;
        });
        setLastUpdated(Date.now());
      } catch {
        // silently ignore — keep last known data
      }
    }

    const timer = setInterval(poll, 15_000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [token]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password.trim() || loginLoading) return;
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (res.ok) {
        const data = await res.json();
        const jwt = data.token || password;
        const user = data.user || { username: "admin", displayName: "Admin", role: "admin" };
        sessionStorage.setItem(TOKEN_KEY, jwt);
        sessionStorage.setItem(USER_KEY, JSON.stringify(user));
        setToken(jwt);
        setCurrentUser(user);
        setPassword("");
        setUsername("");
        loadApplications(jwt, "initial");
      } else if (res.status === 429) {
        setLoginError("rateLimited");
      } else if (res.status === 503) {
        setLoginError("notConfigured");
      } else {
        setLoginError("wrong");
      }
    } catch {
      setLoginError("network");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setToken(null);
    setCurrentUser(null);
    setApplications([]);
    setSelectedApp(null);
    setFetchError(null);
    setSearch("");
    setTrackFilter("all");
    setStatusFilter("all");
    setTimeFilter("all");
  };

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!cpCurrent || !cpNew || cpLoading) return;
    setCpLoading(true);
    setCpError(null);
    setCpSuccess(false);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: cpCurrent, newPassword: cpNew }),
      });
      if (res.ok) {
        setCpSuccess(true);
        setTimeout(() => handleLogout(), 2000);
      } else {
        const data = await res.json().catch(() => null);
        setCpError(data?.error || "Failed to change password");
      }
    } catch {
      setCpError("Network error");
    } finally {
      setCpLoading(false);
    }
  };

  const handleAppSaved = useCallback(
    (rowNumber: number, updates: Partial<ApplicationRecord>) => {
      setApplications((prev) =>
        prev.map((app) =>
          app._rowNumber === rowNumber ? { ...app, ...updates } : app
        )
      );
      setSelectedApp((prev) =>
        prev && prev._rowNumber === rowNumber
          ? { ...prev, ...updates }
          : prev
      );
    },
    []
  );

  const handleBulkUpdate = useCallback(
    async (items: UpdateItem[]): Promise<boolean> => {
      const res = await fetch("/api/admin/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ updates: items }),
      });
      if (!res.ok) return false;
      const { failed = [] } = await res.json();
      if (failed.length === 0) {
        setApplications((prev) =>
          prev.map((app) => {
            const update = items.find((u) => u.rowNumber === app._rowNumber);
            if (!update) return app;
            return { ...app, ...(update.status ? { status: update.status } : {}), ...(update.notes !== undefined ? { notes: update.notes } : {}) };
          })
        );
        return true;
      }
      return false;
    },
    [token]
  );

  const handleSendEmail = useCallback(
    async (rowNumber: number, decision: "accepted" | "rejected"): Promise<{ok:boolean;sentAt?:string;error?:string}> => {
      const res = await fetch("/api/admin/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "send-email", rowNumber, decision }),
      });
      if (res.ok) {
        const data = await res.json();
        handleAppSaved(rowNumber, { decisionEmailSentAt: data.sentAt || new Date().toISOString(), status: decision });
        return { ok: true, sentAt: data.sentAt };
      }
      const err = await res.json().catch(() => null);
      return { ok: false, error: err?.error || String(res.status) };
    },
    [token, handleAppSaved]
  );

  const markSeen = useCallback(() => {
    const maxTs = applications.reduce(
      (mx, app) => Math.max(mx, timestampMs(app.timestamp)),
      Date.now()
    );
    localStorage.setItem(LAST_SEEN_KEY, String(maxTs));
    setLastSeenTs(maxTs);
  }, [applications]);

  const stats = useMemo(() => {
    let pending = 0;
    let accepted = 0;
    let rejected = 0;
    for (const app of applications) {
      if (app.status === "accepted") accepted += 1;
      else if (app.status === "rejected") rejected += 1;
      else pending += 1;
    }
    return {
      total: applications.length,
      pending,
      accepted,
      rejected,
    };
  }, [applications]);

  const maxTs = useMemo(
    () => applications.reduce((mx, app) => Math.max(mx, timestampMs(app.timestamp)), 0),
    [applications]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const WEEK = 7 * 24 * 60 * 60 * 1000;
    const MONTH = 30 * 24 * 60 * 60 * 1000;
    return applications.filter((app) => {
      const ts = timestampMs(app.timestamp);
      if (trackFilter !== "all" && app.track !== trackFilter) return false;
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      if (timeFilter === "week" && ts < maxTs - WEEK) return false;
      if (timeFilter === "month" && ts < maxTs - MONTH) return false;
      if (!query) return true;
      return (
        app.fullName.toLowerCase().includes(query) ||
        app.email.toLowerCase().includes(query) ||
        app.schoolName.toLowerCase().includes(query)
      );
    });
  }, [applications, search, trackFilter, statusFilter, timeFilter, maxTs]);

  const handleExport = async () => {
    if (!applications.length || exporting) return;
    setExporting(true);
    try {
      const XLSX = await import("xlsx");
      const rows = applications.map((app) => {
        const row: Record<string, string> = {};
        row[t("fields.timestamp")] = app.timestamp;
        row[t("fields.track")] =
          app.track === "expert"
            ? t("tracks.expert")
            : t("tracks.young-speaker");
        row[t("fields.fullName")] = app.fullName;
        row[t("fields.age")] = app.age;
        row[t("fields.email")] = app.email;
        row[t("fields.phone")] = app.phone;
        row[t("fields.city")] = app.city;
        row[t("fields.talkIdeaTitle")] = app.talkIdeaTitle;
        row[t("fields.ideaSummary")] = app.ideaSummary;
        row[t("fields.whyItMatters")] = app.whyItMatters;
        row[t("fields.themeConnection")] = app.themeConnection;
        row[t("fields.howHeardAboutUs")] = app.howHeardAboutUs;
        row[t("fields.schoolName")] = app.schoolName;
        row[t("fields.guardianName")] = app.guardianName;
        row[t("fields.guardianContact")] = app.guardianContact;
        row[t("fields.organizationAndRole")] = app.organizationAndRole;
        row[t("fields.areaOfWorkWithYouth")] = app.areaOfWorkWithYouth;
        row[t("fields.parentalConsent")] = app.parentalConsent;
        row[t("fields.consentToTerms")] = app.consentToTerms;
        row[t("fields.status")] = t(`statuses.${app.status}`);
        row[t("modalExtra.notes")] = app.notes;
        return row;
      });
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");
      XLSX.writeFile(
        workbook,
        `tedx-applications-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } finally {
      setExporting(false);
    }
  };

  if (!bootstrapped) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={26} className="animate-spin text-tedx-red" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 pt-24 pb-16">
        <div className="w-full max-w-md rounded-[28px] border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col items-center gap-4 text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-tedx-red/10 border border-border flex items-center justify-center text-tedx-red">
              <ShieldCheck size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                {t("login.title")}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t("login.description")}
              </p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <User
                size={16}
                className="absolute start-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
              />
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder={t("login.username")}
                autoComplete="username"
                autoFocus
                className="w-full rounded-full border border-zinc-300 bg-white ps-11 pe-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>
            <div className="relative">
              <LockKeyhole
                size={16}
                className="absolute start-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
              />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t("login.placeholder")}
                autoComplete="current-password"
                className="w-full rounded-full border border-zinc-300 bg-white ps-11 pe-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>
            {(fetchError === "unauthorized" || loginError) && (
              <p
                role="alert"
                className="flex items-center gap-2 px-2 text-sm text-red-600"
              >
                <AlertCircle size={15} />
                {fetchError === "unauthorized"
                  ? t("errors.unauthorized")
                  : loginError === "network"
                    ? tCommon("serverError")
                    : loginError
                      ? t(`login.${loginError}`)
                      : null}
              </p>
            )}
            <Button
              type="submit"
              loading={loginLoading}
              loadingText={t("login.submit")}
              className="w-full"
            >
              {t("login.submit")}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: t("dashboard.total"), value: stats.total, accent: "text-foreground" },
    { label: t("dashboard.pending"), value: stats.pending, accent: "text-amber-600" },
    { label: t("dashboard.accepted"), value: stats.accepted, accent: "text-emerald-600" },
    { label: t("dashboard.rejected"), value: stats.rejected, accent: "text-red-600" },
  ];

  const trackOptions: SegmentedOption<TrackFilter>[] = [
    { value: "all", label: t("dashboard.trackAll") },
    { value: "young-speaker", label: t("dashboard.youngTrack") },
    { value: "expert", label: t("dashboard.expertTrack") },
  ];

  const statusOptions: SegmentedOption<"all" | StatusValue>[] = [
    { value: "all", label: t("dashboard.statusAll") },
    ...STATUS_VALUES.map((status) => ({
      value: status,
      label: t(`statuses.${status}`),
    })),
  ];

  const timeOptions: SegmentedOption<TimeFilter>[] = [
    { value: "all", label: t("timeFilter.all") },
    { value: "week", label: t("timeFilter.thisWeek") },
    { value: "month", label: t("timeFilter.thisMonth") },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 pt-28 pb-16">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight">
                {t("dashboard.title")}
              </h1>
              {newCount > 0 && (
                <button
                  type="button"
                  onClick={markSeen}
                  title={t("newBadge.markSeen")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-tedx-red/30 bg-tedx-red/10 px-3 py-1 text-xs font-semibold text-tedx-red cursor-pointer transition-colors hover:bg-tedx-red/20"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tedx-red opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-tedx-red" />
                  </span>
                  {t("newBadge.count", { count: newCount })}
                </button>
              )}
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t("dashboard.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {currentUser && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {currentUser.displayName || currentUser.username}
              </span>
            )}
            {lastUpdated && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {t("dashboard.lastUpdated")}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadApplications(token, "refresh")}
              loading={refreshing}
              loadingText={t("dashboard.refreshing")}
            >
              {t("dashboard.refresh")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChangePassword(true)}
            >
              {t("dashboard.changePassword")}
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              {t("dashboard.logout")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-[20px] border border-border bg-card p-5"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {card.label}
              </p>
              <p className={`mt-2 text-3xl font-black ${card.accent}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <StatsBar applications={applications} locale={locale} />

        <div className="flex flex-col xl:flex-row xl:items-center gap-4 mb-6">
          <div className="relative grow max-w-md">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("dashboard.searchPlaceholder")}
              className="w-full rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            />
          </div>
          <Segmented options={trackOptions} value={trackFilter} onChange={setTrackFilter} />
          <Segmented options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
          <Segmented options={timeOptions} value={timeFilter} onChange={setTimeFilter} />
          <div className="xl:ms-auto">
            <Button
              size="sm"
              onClick={handleExport}
              disabled={!applications.length}
              loading={exporting}
              loadingText={t("dashboard.exporting")}
            >
              {t("dashboard.exportExcel")}
            </Button>
          </div>
        </div>

        {fetchError === "fetchFailed" && !loading && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <AlertCircle size={16} />
            {t("errors.fetchFailed")}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
            <Loader2 size={22} className="animate-spin" />
            {t("dashboard.loading")}
          </div>
        ) : (
          <ApplicationsTable
            applications={filtered}
            onView={setSelectedApp}
            onUpdate={handleBulkUpdate}
            sending={false}
          />
        )}
      </main>

      <ApplicationDetailsModal
        app={selectedApp}
        onClose={() => setSelectedApp(null)}
        onSaved={handleAppSaved}
        onSendEmail={handleSendEmail}
      />

      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowChangePassword(false)}>
          <div className="w-full max-w-md rounded-[28px] border border-border bg-card p-8 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black tracking-tight mb-4">
              {t("changePassword.title")}
            </h2>
            {cpSuccess ? (
              <p className="text-sm text-emerald-600 text-center py-6">
                {t("changePassword.success")}
              </p>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <input
                  type="password"
                  value={cpCurrent}
                  onChange={(e) => setCpCurrent(e.target.value)}
                  placeholder={t("changePassword.currentPassword")}
                  autoComplete="current-password"
                  autoFocus
                  className="w-full rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
                <input
                  type="password"
                  value={cpNew}
                  onChange={(e) => setCpNew(e.target.value)}
                  placeholder={t("changePassword.newPassword")}
                  autoComplete="new-password"
                  className="w-full rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
                {cpError && (
                  <p className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle size={15} />
                    {cpError}
                  </p>
                )}
                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowChangePassword(false)}>
                    {tCommon("close")}
                  </Button>
                  <Button type="submit" loading={cpLoading} loadingText={t("changePassword.saving")} className="flex-1">
                    {t("changePassword.save")}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
