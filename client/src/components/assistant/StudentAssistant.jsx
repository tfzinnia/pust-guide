import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/auth";
import useApi from "../../hooks/useApi";

const greeting = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I’m your PUST campus guide. I can help you find information, understand your next step, or get student support. What do you need help with?",
  actions: [],
  sources: [],
};
const starters = [
  ["Report ragging", "How do I report ragging?"],
  ["My timetable", "Where can I find my class routine?"],
  ["Syllabus & PDFs", "How do I download my syllabus?"],
  ["Study help", "Can you help me make a study plan?"],
];
const messageId = () =>
  globalThis.crypto?.randomUUID?.() || `message-${Date.now()}-${Math.random()}`;

export default function StudentAssistant() {
  const { user, isGuest, loading } = useAuth(),
    location = useLocation();
  const hidden =
    /^\/(login|signup|forgot-password|reset-password|splash|onboarding)(?:\/|$)/.test(
      location.pathname,
    );
  if (
    loading ||
    hidden ||
    (!user &&
      !isGuest &&
      !["/emergency", "/administration"].includes(location.pathname))
  )
    return null;
  return <AssistantPanel key={user?.id || "guest"} />;
}

function AssistantPanel() {
  const [open, setOpen] = useState(false),
    [messages, setMessages] = useState([greeting]),
    [draft, setDraft] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [replyMode, setReplyMode] = useState("");
  const status = useApi("/assistant/status"),
    navigate = useNavigate();
  const input = useRef(null),
    log = useRef(null),
    launcher = useRef(null),
    request = useRef(null);
  const mode = replyMode || status.data?.mode || "guide";
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (open) input.current?.focus();
    const escape = (event) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        requestAnimationFrame(() => launcher.current?.focus());
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [open]);
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages, busy, open]);

  function close() {
    setOpen(false);
    requestAnimationFrame(() => launcher.current?.focus());
  }
  function clear() {
    request.current?.abort();
    request.current = null;
    setMessages([greeting]);
    setDraft("");
    setBusy(false);
    setError("");
    input.current?.focus();
  }
  function visit(path) {
    // Only the server's internal navigation catalog and source links can reach this handler.
    if (
      !path.startsWith("/") ||
      path.startsWith("//") ||
      path.includes("\\") ||
      [...path].some((character) => character.charCodeAt(0) < 32)
    )
      return;
    navigate(path);
    setOpen(false);
  }
  async function send(value = draft) {
    const content = value.trim();
    if (!content || busy) return;
    const controller = new AbortController();
    request.current = controller;
    const history = messages
      .filter((item) => item.id !== "welcome")
      .slice(-10)
      .map(({ role, content }) => ({ role, content }));
    const userMessage = { id: messageId(), role: "user", content };
    setMessages((previous) => [...previous, userMessage]);
    setDraft("");
    setBusy(true);
    setError("");
    try {
      const response = await api.post(
        "/assistant/chat",
        { message: content, history },
        { signal: controller.signal, timeout: 30000 },
      );
      if (controller.signal.aborted) return;
      setMessages((previous) => [
        ...previous,
        {
          id: messageId(),
          role: "assistant",
          content: response.data.answer,
          actions: response.data.actions || [],
          sources: response.data.sources || [],
          notice: response.data.notice,
        },
      ]);
      setReplyMode(response.data.mode);
    } catch (failure) {
      if (controller.signal.aborted) return;
      setMessages((previous) =>
        previous.filter((item) => item.id !== userMessage.id),
      );
      setError(
        failure.response?.data?.message ||
          (navigator.onLine
            ? "I couldn’t connect just now. Please try again."
            : "Chat needs a connection. You can still open previously viewed emergency contacts."),
      );
      setDraft(content);
    } finally {
      if (!controller.signal.aborted) {
        setBusy(false);
        request.current = null;
        input.current?.focus();
      }
    }
  }
  return (
    <>
      <button
        ref={launcher}
        type="button"
        aria-label={open ? "Close student assistant" : "Open student assistant"}
        aria-expanded={open}
        aria-controls="student-assistant-panel"
        onClick={() => (open ? close() : setOpen(true))}
        className={`fixed bottom-24 right-4 z-50 flex items-center gap-3 rounded-full bg-blue-700 px-5 py-4 font-semibold text-white shadow-xl shadow-blue-950/20 transition hover:bg-blue-800 ${open ? "hidden" : "flex"}`}
      >
        <MessageCircle size={23} />
        <span>Ask PUST</span>
        <span
          aria-hidden="true"
          className="h-2 w-2 rounded-full bg-emerald-300"
        />
      </button>
      {open && (
        <section
          id="student-assistant-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="student-assistant-title"
          className="assistant-panel fixed z-50 flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
        >
          <header className="flex shrink-0 items-center gap-3 bg-gradient-to-r from-blue-700 to-teal-600 px-4 py-4 text-white">
            <div className="rounded-2xl bg-white/15 p-2.5">
              <Sparkles size={21} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="student-assistant-title" className="font-bold">
                PUST assistant
              </h2>
              <p className="mt-0.5 text-xs text-white/85">
                {mode === "ai"
                  ? "AI help · campus information & studies"
                  : "Campus guide · support & next steps"}
              </p>
            </div>
            <button
              type="button"
              aria-label="Start a new chat"
              title="Start a new chat"
              onClick={clear}
              className="rounded-lg p-2 hover:bg-white/15"
            >
              <Trash2 size={17} />
            </button>
            <button
              type="button"
              aria-label="Close chat"
              onClick={close}
              className="rounded-lg p-2 hover:bg-white/15"
            >
              <X size={21} />
            </button>
          </header>
          <div className="flex shrink-0 items-start gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[11px] leading-5 text-slate-500">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-teal-600" />
            <p>
              Avoid names, passwords, or identifying details here. With AI
              enabled, messages are shared with OpenAI for replies. Review and
              submit reports in the complaint form.
            </p>
          </div>
          <div
            ref={log}
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            aria-label="Conversation with PUST assistant"
            className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-slate-50/50 px-4 py-5"
          >
            {messages.map((message) => (
              <article
                key={message.id}
                className={message.role === "user" ? "ml-8" : "mr-3"}
              >
                <p
                  className={`mb-1.5 text-[10px] font-semibold uppercase tracking-wider ${message.role === "user" ? "text-right text-blue-600" : "text-slate-400"}`}
                >
                  {message.role === "user" ? "You" : "PUST assistant"}
                </p>
                <div
                  className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "rounded-tr-sm bg-blue-700 text-white" : "rounded-tl-sm border border-slate-200 bg-white text-slate-700"}`}
                >
                  {message.content}
                </div>
                {message.notice && (
                  <p className="mt-2 text-xs leading-5 text-amber-700">
                    {message.notice}
                  </p>
                )}
                {message.actions?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.actions.map((action) => (
                      <button
                        type="button"
                        key={action.id}
                        onClick={() => visit(action.path)}
                        className="flex w-full items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-left text-xs font-semibold text-blue-800 transition hover:bg-blue-100"
                      >
                        <span>{action.label}</span>
                        <ArrowUpRight size={16} className="shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
                {message.sources?.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Published references
                    </p>
                    {message.sources.map((source) => (
                      <button
                        type="button"
                        key={source.id}
                        onClick={() => visit(source.path)}
                        className="mb-1 block text-left text-xs text-blue-700 underline underline-offset-2"
                      >
                        {source.title}
                      </button>
                    ))}
                  </div>
                )}
              </article>
            ))}
            {messages.length === 1 && (
              <div
                className="grid grid-cols-2 gap-2"
                aria-label="Suggested questions"
              >
                {starters.map(([label, prompt]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => send(prompt)}
                    disabled={busy}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-700"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            {busy && (
              <p
                role="status"
                className="flex items-center gap-2 text-xs text-slate-500"
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-teal-500" />
                Finding your next step…
              </p>
            )}
          </div>
          <div className="shrink-0 border-t border-slate-200 bg-white p-3">
            {error && (
              <p
                role="alert"
                className="mb-2 rounded-lg bg-red-50 p-2 text-xs leading-5 text-red-700"
              >
                {error}
              </p>
            )}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                send();
              }}
              className="flex items-end gap-2"
            >
              <label htmlFor="assistant-message" className="sr-only">
                Message the student assistant
              </label>
              <textarea
                ref={input}
                id="assistant-message"
                rows={2}
                value={draft}
                maxLength={2000}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about campus, studies, or getting help…"
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    send();
                  }
                }}
                className="min-w-0 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-5"
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={busy || !draft.trim()}
                className="mb-0.5 rounded-xl bg-blue-700 p-3 text-white hover:bg-blue-800 disabled:opacity-40"
              >
                <Send size={19} />
              </button>
            </form>
            <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-400">
              <span>
                {mode === "ai"
                  ? "AI answers can make mistakes. Check published details."
                  : "Enter to send · Shift + Enter for a new line"}
              </span>
              <button
                className="shrink-0 font-semibold text-red-700"
                onClick={() => visit("/emergency")}
              >
                Emergency contacts
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
