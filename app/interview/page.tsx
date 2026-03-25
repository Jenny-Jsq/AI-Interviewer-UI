"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ChatWindow from "../../components/ChatWindow";
import { sendInterviewMessage, startInterviewSession } from "../../lib/api";
import { ChatMessage } from "../../types";

const defaultAgendaItems = [
  "自我介绍与破冰",
  "职业目标 (Why MBA)",
  "领导力案例深挖",
  "失败/挑战经历分析",
  "行业洞察与观点",
  "团队协作与多样性",
  "反向提问环节",
];

type InterviewStage = "loading" | "chat" | "error";

export default function InterviewPage() {
  return (
    <Suspense
      fallback={
        <main className="app-shell">
          <section className="panel">
            <p className="panel-intro">正在加载面试界面...</p>
          </section>
        </main>
      }
    >
      <InterviewContent />
    </Suspense>
  );
}

function InterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const accessCode = searchParams.get("accessCode") ?? "";
  const schoolId = searchParams.get("schoolId") ?? "";
  const programId = searchParams.get("programId") ?? "";
  const resumeFileName = searchParams.get("resumeFileName") ?? "";
  const coverLetterText = searchParams.get("coverLetterText") ?? "";

  const [stage, setStage] = useState<InterviewStage>("loading");
  const [loadingCountdown, setLoadingCountdown] = useState(8);
  const [seconds, setSeconds] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isSending, setIsSending] = useState(false);
  const [agendaItems, setAgendaItems] = useState<string[]>(defaultAgendaItems);
  const [completedCount, setCompletedCount] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [remainingUses, setRemainingUses] = useState(Number(searchParams.get("remainingUses") ?? "0"));
  const [startupError, setStartupError] = useState("");

  const canStart = useMemo(
    () => Boolean(accessCode) && Boolean(schoolId) && Boolean(programId),
    [accessCode, schoolId, programId],
  );

  useEffect(() => {
    if (!canStart) return;

    let cancelled = false;

    const initSession = async () => {
      setIsStarting(true);
      setStartupError("");

      const response = await startInterviewSession({
        accessCode,
        schoolId,
        programId,
        resumeText: resumeFileName ? `Uploaded file: ${resumeFileName}` : undefined,
        coverLetterText,
      });

      if (cancelled) return;

      if (!response?.sessionId) {
        setStartupError("无法开始面试。请确认 access code 仍有剩余次数，然后返回首页重试。");
        setStage("error");
        setIsStarting(false);
        return;
      }

      setSessionId(response.sessionId);
      setRemainingUses(response.remainingUses);
      if (response.topics.length >= 1) {
        setAgendaItems(response.topics);
      }
      setMessages([
        {
          id: "assistant-1",
          role: "assistant",
          content: response.openingQuestion,
          timestamp: Date.now(),
        },
      ]);

      const timer = window.setInterval(() => {
        setLoadingCountdown((prev) => {
          if (prev <= 1) {
            window.clearInterval(timer);
            setStage("chat");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => window.clearInterval(timer);
    };

    void initSession();

    return () => {
      cancelled = true;
    };
  }, [canStart, accessCode, schoolId, programId, resumeFileName, coverLetterText]);

  useEffect(() => {
    if (stage !== "chat") return;
    const timer = window.setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => window.clearInterval(timer);
  }, [stage]);

  const handleSendMessage = async (content: string) => {
    if (!sessionId) {
      setStartupError("会话不存在，请返回首页重新开始。");
      setStage("error");
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: Date.now(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setIsSending(true);

    const turnResponse = await sendInterviewMessage({
      sessionId,
      messages: nextMessages,
      schoolId,
      programId,
    });

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content:
        turnResponse?.reply ??
        "网络异常或会话失效，请返回首页重新输入 access code 后开始新的 mock interview。",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    if (typeof turnResponse?.currentTopicIndex === "number") {
      setCompletedCount(turnResponse.currentTopicIndex);
    }

    setIsSending(false);
  };

  const handleFinish = () => {
    const payload = encodeURIComponent(JSON.stringify(messages));
    router.push(`/result?messages=${payload}&sessionId=${sessionId ?? ""}&schoolId=${schoolId}&programId=${programId}`);
  };

  if (!canStart) {
    return (
      <main className="app-shell">
        <section className="panel">
          <h2>缺少必要参数</h2>
          <p className="panel-intro">请返回首页重新输入 access code、并选择目标学校与项目。</p>
          <button className="secondary-btn" onClick={() => router.push("/")}>返回首页</button>
        </section>
      </main>
    );
  }

  if (stage === "error") {
    return (
      <main className="app-shell">
        <section className="panel">
          <h2>无法开始面试</h2>
          <p className="panel-intro">{startupError}</p>
          <button className="secondary-btn" onClick={() => router.push("/")}>返回首页</button>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell interview-shell">
      <header className="topbar">
        <div className="brand-mark">🎙️</div>
        <div>
          <h1>MockMaster AI</h1>
          <p>{schoolId} · {programId} · 剩余次数 {remainingUses}</p>
        </div>
        {stage === "chat" ? <div className="timer-pill">{formatTime(seconds)}</div> : null}
      </header>

      {stage === "loading" ? (
        <section className="panel panel-loading">
          <div className="loader-avatar">🕵️</div>
          <h2>正在呼叫面试官</h2>
          <p>预计还需要 <strong>{loadingCountdown}</strong> 秒</p>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${((8 - loadingCountdown) / 8) * 100}%` }} />
          </div>
        </section>
      ) : (
        <section className="interview-grid">
          <aside className="panel agenda-panel">
            <h3>进度追踪</h3>
            <ul>
              {agendaItems.map((item, index) => (
                <li key={`${item}-${index}`} className={index < completedCount ? "done" : ""}>
                  <span className="agenda-check">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button className="secondary-btn" onClick={handleFinish}>结束面试并查看反馈</button>
          </aside>

          <div className="panel chat-panel">
            <ChatWindow
              messages={messages}
              onSendMessage={handleSendMessage}
              isSending={isSending || isStarting}
            />
          </div>
        </section>
      )}
    </main>
  );
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (totalSeconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}
