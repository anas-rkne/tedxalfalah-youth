"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Send, Vote } from "lucide-react";
import Button from "@/components/ui/Button";
import TurnstileWidget from "@/components/ui/TurnstileWidget";

interface SessionInfo {
  id: string;
  title: string;
  titleAr?: string;
  acceptingQuestions: boolean;
  attendeeCount: number;
}

interface PollView {
  id: string;
  prompt: string;
  promptAr?: string;
  options: string[];
  optionsAr?: string[];
  active: boolean;
  showResults: boolean;
  tallies: number[] | null;
  totalVotes: number | null;
}

const STORAGE = "tedx-qa-attendee";

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
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

export default function LiveParticipate() {
  const t = useTranslations("qa");
  const attendeeRef = useRef<{ id: string; name: string } | null>(null);
  const [attendee, setAttendee] = useState<{ id: string; name: string } | null>(null);

  // Join state
  const [joinName, setJoinName] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinToken, setJoinToken] = useState("");
  const [joinError, setJoinError] = useState<null | string>(null);

  // Session/question state
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [active, setActive] = useState(false);
  const [question, setQuestion] = useState("");
  const [sendingQ, setSendingQ] = useState(false);
  const [qToken, setQToken] = useState("");
  const [qMsg, setQMsg] = useState<null | { type: "ok" | "err"; text: string }>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [tag, setTag] = useState("");

  // Poll state
  const [polls, setPolls] = useState<PollView[]>([]);
  const [votingPoll, setVotingPoll] = useState<null | string>(null);
  const [pollVotes, setPollVotes] = useState<Record<string, number>>({});

  const loadCurrent = useCallback(async () => {
    try {
      const data = await api<{
        active: boolean;
        session: SessionInfo | null;
        polls: PollView[];
      }>("/api/qa/session/current");
      setActive(data.active);
      setSession(data.session);
      setPolls(data.polls ?? []);
    } catch {
      setActive(false);
    }
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE);
    if (stored) {
      try {
        attendeeRef.current = JSON.parse(stored);
        setAttendee(attendeeRef.current);
      } catch {
        attendeeRef.current = null;
      }
    }
    loadCurrent();
    const iv = setInterval(loadCurrent, 4000);
    return () => clearInterval(iv);
  }, [loadCurrent]);

  const handleJoin = async () => {
    const name = joinName.trim();
    if (!name) {
      setJoinError(t("join.required"));
      return;
    }
    setJoining(true);
    setJoinError(null);
    try {
      const res = await api<{ ok: boolean; attendeeId: string }>("/api/qa/attendee/join", {
        method: "POST",
        body: JSON.stringify({ name, turnstileToken: joinToken }),
      });
      const rec = { id: res.attendeeId, name };
      attendeeRef.current = rec;
      sessionStorage.setItem(STORAGE, JSON.stringify(rec));
      setAttendee(rec);
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : t("join.noSession"));
    } finally {
      setJoining(false);
    }
  };

  const submitQuestion = async () => {
    const text = question.trim();
    if (!text || !attendee) return;
    setSendingQ(true);
    setQMsg(null);
    try {
      const res = await api<{ ok: boolean; duplicate?: boolean; duplicateOf?: string }>("/api/qa/question", {
        method: "POST",
        body: JSON.stringify({ attendeeId: attendee.id, name: attendee.name, text, anonymous, tag: tag || undefined, turnstileToken: qToken }),
      });
      if (res.duplicate) {
        setQMsg({ type: "ok", text: t("participate.duplicate") });
      } else {
        setQuestion("");
        setQMsg({ type: "ok", text: t("participate.sent") });
      }
    } catch (e) {
      setQMsg({ type: "err", text: e instanceof Error ? e.message : t("participate.sentError") });
    } finally {
      setSendingQ(false);
    }
  };

  const vote = async (pollId: string, optionIndex: number) => {
    if (!attendee || !attendee.id) return;
    setVotingPoll(pollId);
    try {
      await api("/api/qa/poll/vote", {
        method: "POST",
        body: JSON.stringify({ attendeeId: attendee.id, pollId, optionIndex }),
      });
      setPollVotes((v) => ({ ...v, [pollId]: optionIndex }));
    } catch {
      // تجاهل التصويت المزدوج — يُظهر النتائج فقط
      setPollVotes((v) => ({ ...v, [pollId]: optionIndex }));
    } finally {
      setVotingPoll(null);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-center mb-2">{t("participate.title")}</h1>
      {session && <p className="text-center text-muted-foreground text-sm mb-6">{t("participate.sessionTitle")}: {session.titleAr || session.title}</p>}

      {/* Join gate */}
      {!attendee ? (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-semibold text-lg mb-1">{t("join.title")}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t("join.subtitle")}</p>
          <input
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
            placeholder={t("join.namePlaceholder")}
            maxLength={60}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 mb-3 outline-none focus:ring-2 focus:ring-red-500"
          />
          <TurnstileWidget onVerify={setJoinToken} />
          {joinError && <p className="text-red-600 text-sm mt-2">{joinError}</p>}
          <Button className="w-full mt-3" loading={joining} loadingText={t("join.joining")} onClick={handleJoin}>
            {t("join.joinButton")}
          </Button>
        </div>
      ) : !active ? (
        <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-muted-foreground">{t("join.noSession")}</p>
          <Button className="mt-4" variant="outline" size="sm" onClick={() => { sessionStorage.removeItem(STORAGE); setAttendee(null); }}>
            {t("join.alreadyJoined")}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Ask a question */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-3">{t("participate.askTitle")}</h2>
            {session && session.acceptingQuestions ? (
              <>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={t("participate.askPlaceholder")}
                  maxLength={300}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 mb-2 outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
                <div className="text-right text-xs text-muted-foreground mb-1">{question.length}/300</div>
                <div className="flex items-center gap-4 mb-2">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={anonymous}
                      onChange={(e) => setAnonymous(e.target.checked)}
                      className="rounded border-border"
                    />
                    {t("participate.anonymous")}
                  </label>
                  <select
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="text-sm rounded-lg border border-border bg-background px-2 py-1"
                  >
                    <option value="">{t("participate.noTag")}</option>
                    <option value="tech">{t("participate.tagTech")}</option>
                    <option value="ideas">{t("participate.tagIdeas")}</option>
                    <option value="environment">{t("participate.tagEnvironment")}</option>
                    <option value="education">{t("participate.tagEducation")}</option>
                    <option value="other">{t("participate.tagOther")}</option>
                  </select>
                </div>
                <TurnstileWidget onVerify={setQToken} />
                {qMsg && <p className={`text-sm mt-2 ${qMsg.type === "ok" ? "text-green-600" : "text-red-600"}`}>{qMsg.text}</p>}
                <Button className="w-full mt-3" loading={sendingQ} loadingText={t("participate.sending")} onClick={submitQuestion} disabled={!question.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  {t("participate.askButton")}
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">{t("participate.notAccepting")}</p>
            )}
          </div>

          {/* Live polls */}
          <div className="space-y-4">
            {polls.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm">{t("participate.noPolls")}</p>
            ) : (
              polls.map((poll) => {
                const myVote = pollVotes[poll.id];
                const showResults = poll.showResults;
                return (
                  <div key={poll.id} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                    <h3 className="font-semibold mb-4">{poll.promptAr || poll.prompt}</h3>
                    <div className="space-y-2">
                      {poll.options.map((opt, i) => {
                        const label = poll.optionsAr?.[i] ?? opt;
                        const count = showResults && poll.tallies ? poll.tallies[i] ?? 0 : 0;
                        const total = poll.totalVotes ?? 0;
                        const pct = showResults && total > 0 ? Math.round((count / total) * 100) : 0;
                        const selected = myVote === i;
                        return (
                          <button
                            key={i}
                            onClick={() => !selected && poll.active && vote(poll.id, i)}
                            disabled={!poll.active || selected || votingPoll === poll.id}
                            className={`relative w-full text-left rounded-xl border px-4 py-3 transition ${
                              selected
                                ? "border-red-600 bg-red-600/10"
                                : poll.active
                                ? "border-border hover:border-red-400"
                                : "border-border opacity-70"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                {selected && poll.active && <Vote className="h-4 w-4 text-red-600" />}
                                {label}
                              </span>
                              {showResults && <span className="text-xs text-muted-foreground">{pct}%</span>}
                            </div>
                            {showResults && (
                              <div className="absolute bottom-0 left-0 h-1 rounded-full bg-red-600/60" style={{ width: `${pct}%` }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {showResults && poll.totalVotes !== null && (
                      <p className="text-xs text-muted-foreground mt-3">{t("participate.totalVotes", { count: poll.totalVotes })}</p>
                    )}
                    {myVote === undefined && (
                      <p className="text-xs text-muted-foreground mt-3">{t("participate.voteButton")}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
