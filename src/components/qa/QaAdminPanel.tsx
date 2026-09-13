"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  Check,
  Download,
  MessageSquare,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Button from "@/components/ui/Button";
import AnalyticsDashboard from "@/components/qa/AnalyticsDashboard";

const TOKEN_KEY = "tedx-admin-token";
const USER_KEY = "tedx-admin-user";

interface QaQuestion {
  id: string;
  author: string;
  text: string;
  votes: number;
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  answered?: boolean;
  createdAt: string;
}

interface QaPoll {
  id: string;
  prompt: string;
  promptAr?: string;
  options: string[];
  optionsAr?: string[];
  tallies: number[];
  active: boolean;
  showResults: boolean;
  createdAt: string;
}

interface QaSession {
  id: string;
  title: string;
  titleAr?: string;
  active: boolean;
  acceptingQuestions: boolean;
  createdAt: string;
  questions: QaQuestion[];
  polls: QaPoll[];
  attendeeNames: string[];
}

interface AdminData {
  settings: { eventName: string; eventNameAr: string; active: boolean };
  meta: { totalAttendees: number; totalQuestions: number; totalVotes: number };
  sessions: QaSession[];
}

async function api<T>(url: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
  const text = await res.text().catch(() => "");
  let data: { error?: string };
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`HTTP ${res.status}: server returned a non-JSON response`);
  }
  if (!res.ok) {
    throw new Error(data.error || `Request failed (HTTP ${res.status})`);
  }
  return data as T;
}

export default function QaAdminPanel() {
  const t = useTranslations("qa.adminLive");

  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // create session form
  const [newTitle, setNewTitle] = useState("");
  // poll create form
  const [pollPrompt, setPollPrompt] = useState("");
  const [pollPromptAr, setPollPromptAr] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [creatingPoll, setCreatingPoll] = useState(false);

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<null | string>(null);

  // login form
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const selected = data?.sessions.find((s) => s.id === selectedId) ?? null;
  const activeSession = data?.sessions.find((s) => s.active) ?? null;

  const load = useCallback(
    async (authToken: string, silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const d = await api<AdminData>("/api/qa/admin/questions", authToken);
        setData(d);
        setSelectedId((cur) => cur ?? (d.sessions[0]?.id ?? null));
      } catch (e) {
        setError(e instanceof Error ? e.message : "load error");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      const stored = sessionStorage.getItem(TOKEN_KEY);
      if (cancelled || !stored) return;
      setToken(stored);
      load(stored);
    })();
    const iv = setInterval(() => {
      const tok = sessionStorage.getItem(TOKEN_KEY);
      if (tok) load(tok, true);
    }, 5000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [load]);

  const act = <T,>(label: string, fn: () => Promise<T>): Promise<T | undefined> => {
    setBusy(label);
    setError(null);
    return fn()
      .catch((e) => {
        setError(e instanceof Error ? e.message : "error");
        return undefined;
      })
      .finally(() => setBusy(null));
  };

  const handleLogin = async () => {
    if (!loginUsername.trim() || !loginPassword.trim() || loginLoading) return;
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername.trim(), password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        setLoginError(data.error || "Login failed");
        return;
      }
      sessionStorage.setItem(TOKEN_KEY, data.token);
      if (data.user) sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setToken(data.token);
      load(data.token);
    } catch {
      setLoginError("Network error");
    } finally {
      setLoginLoading(false);
    }
  };

  const session = selected ?? activeSession;

  const createSession = async () => {
    const title = newTitle.trim();
    if (!title || !token) return;
    await act("create", async () => {
      await api("/api/qa/admin/session", token, {
        method: "POST",
        body: JSON.stringify({ action: "create", title }),
      });
      setNewTitle("");
      await load(token);
    });
  };

  const setActive = async (sessionId: string) => {
    if (!token) return;
    await act("activate", async () => {
      await api("/api/qa/admin/session", token, {
        method: "POST",
        body: JSON.stringify({ action: "activate", sessionId }),
      });
      await load(token);
    });
  };

  const setQuestions = async (open: boolean) => {
    if (!selected || !token) return;
    await act("toggle", async () => {
      await api("/api/qa/admin/session", token, {
        method: "POST",
        body: JSON.stringify({ action: "toggle", sessionId: selected.id, acceptingQuestions: open }),
      });
      await load(token);
    });
  };

  const delSession = async (sessionId: string) => {
    if (!token || !confirm(`${t("confirmDelete")} (${sessionId})`)) return;
    await act("delete", async () => {
      await api("/api/qa/admin/session", token, {
        method: "POST",
        body: JSON.stringify({ action: "delete", sessionId }),
      });
      setSelectedId(null);
      await load(token);
    });
  };

  const moderate = async (action: "approve" | "reject" | "feature" | "answer", questionId: string, featured?: boolean) => {
    if (!session || !selected || !token) return;
    await act(action, async () => {
      await api("/api/qa/admin/moderate", token, {
        method: "POST",
        body: JSON.stringify({ action, sessionId: selected.id, questionId, featured }),
      });
      await load(token, true);
    });
  };

  const updatePoll = async (sessionIdValue: string, action: string, pollId?: string, extra: Record<string, unknown> = {}) => {
    if (!token) return;
    await act(action, async () => {
      await api("/api/qa/admin/poll", token, {
        method: "POST",
        body: JSON.stringify({ action, sessionId: sessionIdValue, pollId, ...extra }),
      });
      await load(token, true);
    });
  };

  const createPoll = async () => {
    if (!selected || !token) return;
    const options = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (!pollPrompt.trim() || options.length < 2) return;
    setCreatingPoll(true);
    await act("createPoll", async () => {
      await api("/api/qa/admin/poll", token, {
        method: "POST",
        body: JSON.stringify({
          action: "create",
          sessionId: selected.id,
          prompt: pollPrompt.trim(),
          promptAr: pollPromptAr.trim() || undefined,
          options,
        }),
      });
      setPollPrompt("");
      setPollPromptAr("");
      setPollOptions(["", ""]);
      await load(token);
    });
    setCreatingPoll(false);
  };

  const allQuestions = session?.questions ?? [];
  const pending = allQuestions.filter((q) => q.status === "pending");
  const approved = allQuestions.filter((q) => q.status === "approved");
  const viewQuestions = [...pending, ...approved];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 pt-28 pb-16">

        {/* ── Login form (shown when no token) ── */}
        {!token && (
          <div className="mx-auto max-w-md">
            <div className="mb-8 text-center">
              <ShieldCheck className="mx-auto h-12 w-12 text-tedx-red mb-4" />
              <h1 className="text-3xl font-black tracking-tight">{t("title")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t("loginDescription")}</p>
            </div>
            <div className="rounded-[20px] border border-border bg-card p-8">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">{t("loginUsername")}</label>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    autoComplete="username"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-tedx-red focus:ring-1 focus:ring-tedx-red"
                    placeholder={t("loginUsernamePlaceholder")}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t("loginPassword")}</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-tedx-red focus:ring-1 focus:ring-tedx-red"
                    placeholder={t("loginPasswordPlaceholder")}
                  />
                </div>
                {loginError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle size={16} />
                    {loginError}
                  </div>
                )}
                <Button
                  className="w-full"
                  onClick={handleLogin}
                  loading={loginLoading}
                  loadingText={t("loggingIn")}
                >
                  {t("loginSubmit")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Admin panel (shown when logged in) ── */}
        {token && (<>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight">{t("title")}</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-tedx-red/30 bg-tedx-red/10 px-3 py-1 text-xs font-semibold text-tedx-red">
                <ShieldCheck className="h-3.5 w-3.5" />
                {activeSession ? activeSession.title : "—"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {data?.settings && (
              <a
                href="/live/screen"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground underline hover:text-foreground"
              >
                Live Screen ↗
              </a>
            )}
            {data?.settings && (
              <a
                href="/live/speaker"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground underline hover:text-foreground"
              >
                Speaker View ↗
              </a>
            )}
            <Button variant="outline" size="sm" onClick={() => token && load(token)} loading={loading} loadingText="…">
              Refresh
            </Button>
            {selected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!token || !selected) return;
                  window.open(`/api/qa/admin/export?sessionId=${selected.id}&token=${encodeURIComponent(token)}`);
                }}
              >
                <Download className="h-4 w-4 mr-1" />
                {t("exportCsv")}
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Sessions selector + create */}
        <section className="mb-8 rounded-[20px] border border-border bg-card p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {(data?.sessions ?? []).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    s.id === selected?.id
                      ? "border-tedx-red bg-tedx-red text-white"
                      : s.active
                      ? "border-tedx-red/50 bg-tedx-red/10 text-tedx-red"
                      : "border-zinc-300 bg-white hover:border-zinc-400"
                  }`}
                >
                  {s.title || "—"}
                  {s.active ? " •" : ""}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="New session title"
                maxLength={80}
                className="w-64 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-red-500"
              />
              <Button size="sm" onClick={createSession} loading={busy === "create"} loadingText="…">
                <Plus className="h-4 w-4 mr-1" />
                {t("createSession")}
              </Button>
            </div>
          </div>
        </section>

        {!session ? (
          <section className="rounded-[20px] border border-border bg-card p-16 text-center text-muted-foreground">
            {t("noSession")}
          </section>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Questions moderation */}
            <div className="lg:col-span-2 rounded-[20px] border border-border bg-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <MessageSquare className="h-5 w-5 text-tedx-red" />
                  Questions ({viewQuestions.length})
                </h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => selected && setQuestions(!session.acceptingQuestions)}
                  loading={busy === "toggle"}
                  loadingText="…"
                >
                  {session.acceptingQuestions ? t("closeQuestions") : t("openQuestions")}
                </Button>
              </div>

              {viewQuestions.length === 0 ? (
                <p className="py-16 text-center text-muted-foreground">{t("noQuestions")}</p>
              ) : (
                <ul className="space-y-3">
                  {viewQuestions.map((q) => (
                    <li
                      key={q.id}
                      className={`rounded-2xl border p-4 ${
                        q.featured ? "border-amber-400 bg-amber-50/50" : q.answered ? "border-green-400 bg-green-50/50" : "border-border bg-background"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{q.text}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">{q.author}</span>
                        {q.status === "pending" && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            {t("questionStatus.pending")}
                          </span>
                        )}
                        {q.featured && <Star className="h-4 w-4 text-amber-500" />}
                        <div className="ms-auto flex gap-2">
                          {q.status === "pending" && (
                            <Button size="sm" onClick={() => moderate("approve", q.id)} disabled={busy !== null}>
                              <Check className="h-4 w-4 mr-1" />
                              {t("approve")}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moderate("feature", q.id, !q.featured)}
                            disabled={busy !== null}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            {q.featured ? t("unfeature") : t("feature")}
                          </Button>
                          {q.status === "approved" && (
                            <Button
                              size="sm"
                              variant={q.answered ? undefined : "outline"}
                              onClick={() => moderate("answer", q.id)}
                              disabled={busy !== null}
                              className={q.answered ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              {q.answered ? t("answered") : t("markAnswered")}
                            </Button>
                          )}
                          {q.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moderate("reject", q.id)}
                              disabled={busy !== null}
                            >
                              <X className="h-4 w-4 mr-1" />
                              {t("reject")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Session controls */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {t("totalAttendees", { count: session.attendeeNames.length })}
                </div>
                <div className="flex gap-2">
                  {!session.active && (
                    <Button size="sm" onClick={() => selected && setActive(selected.id)} loading={busy === "activate"} loadingText="…">
                      {t("activateButton")}
                    </Button>
                  )}
                  {selected && (
                    <Button size="sm" variant="outline" onClick={() => delSession(selected.id)} disabled={busy !== null}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      {t("deleteSession")}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Polls */}
            <div className="rounded-[20px] border border-border bg-card p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold mb-4">{t("polls")}</h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createPoll();
                }}
                className="space-y-2 mb-6"
              >
                <input
                  value={pollPrompt}
                  onChange={(e) => setPollPrompt(e.target.value)}
                  placeholder={t("newPollPrompt")}
                  maxLength={200}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-red-500"
                />
                <input
                  value={pollPromptAr}
                  onChange={(e) => setPollPromptAr(e.target.value)}
                  placeholder="Prompt (عربي)"
                  maxLength={200}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-red-500"
                />
                {pollOptions.map((opt, i) => (
                  <input
                    key={i}
                    value={opt}
                    onChange={(e) =>
                      setPollOptions((prev) => prev.map((o, j) => (j === i ? e.target.value : o)))
                    }
                    placeholder={t("newPollOptionPlaceholder", { n: i + 1 })}
                    maxLength={120}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-red-500"
                  />
                ))}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPollOptions((prev) => (prev.length < 6 ? [...prev, ""] : prev))}
                    disabled={pollOptions.length >= 6}
                  >
                    {t("addOption")}
                  </Button>
                  <Button type="submit" size="sm" loading={creatingPoll} loadingText="…">
                    {t("startPoll")}
                  </Button>
                </div>
              </form>

              {session.polls.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">{t("noPollsYet")}</p>
              ) : (
                <ul className="space-y-3">
                  {session.polls.map((p) => (
                    <li key={p.id} className="rounded-2xl border border-border bg-background p-4">
                      <p className="text-sm font-semibold">{p.promptAr || p.prompt}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {p.options.map((o, i) => `${i + 1}. ${o} (${p.tallies[i] ?? 0})`).join("  ·  ")}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {!p.active ? (
                          <Button size="sm" onClick={() => updatePoll(session.id, "start", p.id)} disabled={busy !== null}>
                            {t("startPoll")}
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => updatePoll(session.id, "stop", p.id)} disabled={busy !== null}>
                            {t("stopPoll")}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updatePoll(session.id, "showResults", p.id, { show: !p.showResults })}
                          disabled={busy !== null}
                        >
                          {p.showResults ? t("hideResults") : t("showResults")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => session && updatePoll(session.id, "delete", p.id)}
                          disabled={busy !== null}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        </>)}

        {/* Analytics Dashboard */}
        {token && (
          <div className="mt-8 border-t border-border pt-6">
            <AnalyticsDashboard token={token} sessionId={selected?.id} />
          </div>
        )}
      </main>
    </div>
  );
}
