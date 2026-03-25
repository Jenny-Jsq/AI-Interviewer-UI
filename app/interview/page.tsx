"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ChatWindow from "../../components/ChatWindow";
import { sendInterviewMessage, startInterviewSession } from "../../lib/api";
import { ChatMessage } from "../../types";

const agendaItems = [
  "自我介绍与破冰",
  "职业目标 (Why MBA)",
  "领导力案例深挖",
  "失败/挑战经历分析",
  "行业洞察与观点",
  "团队协作与多样性",
  "反向提问环节",
];

const seedMessage: ChatMessage = {
  id: "assistant-1",
  role: "assistant",
  content:
    "您好。我是 Sarah。我已经仔细审阅了您的申请背景。首先请做一个简短的自我介绍，并重点谈谈为什么选择在现在申请 MBA？",
  timestamp: Date.now(),
};

type InterviewStage = "loading" | "chat";

export default function InterviewPage() {
  return (
    <Suspense fallback={<main className="app-shell"><section className="panel"><p className="panel-intro">正在加载面试界面...</p></section></main>}>
      <InterviewContent />
    </Suspense>
  );
}

function InterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const schoolId = searchParams.get("schoolId") ?? "";
  const programId = searchParams.get("programId") ?? "";
  const resumeFileName = searchParams.get("resumeFileName") ?? "";
  const coverLetterText = searchParams.get("coverLetterText") ?? "";

  const [stage, setStage] = useState<InterviewStage>("loading");
  const [loadingCountdown, setLoadingCountdown] = useState(8);
  const [seconds, setSeconds] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([seedMessage]);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isSending, setIsSending] = useState(false);

  const canStart = useMemo(() => Boolean(schoolId) && Boolean(programId), [schoolId, programId]);

  useEffect(() => {
    if (!canStart) return;

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
  }, [canStart]);

  useEffect(() => {
    if (stage !== "chat") return;
    const timer = window.setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => window.clearInterval(timer);
  }, [stage]);

  const completedCount = Math.min(agendaItems.length, Math.max(0, messages.length - 1));

  const handleStartIfNeeded = async () => {
    if (sessionId || !canStart) return;
    const response = await startInterviewSession({
      schoolId,
      programId,
      resumeText: resumeFileName ? `Uploaded file: ${resumeFileName}` : undefined,
      coverLetterText,
    });
    if (response?.sessionId) {
      setSessionId(response.sessionId);
      setInterviewer(response.interviewer);
      setTopics(response.topics);
      setCurrentTopicIndex(response.currentTopicIndex);
      setMessages([
        {
          id: "assistant-1",
          role: "assistant",
          content: response.openingQuestion,
          timestamp: Date.now(),
        },
      ]);

      setTimeout(() => {
        setStage("chat");
      }, 1200);
    };

    setup();
  }, [canStart, schoolId, programId, resumeFileName, coverLetterText]);

  useEffect(() => {
    if (stage !== "chat") return;
    const timer = window.setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => window.clearInterval(timer);
  }, [stage]);

  const handleSendMessage = async (content: string) => {
    setIsSending(true);
    await handleStartIfNeeded();

      setSessionId(response.sessionId);
      setInterviewer(response.interviewer);
      setTopics(response.topics);
      setCurrentTopicIndex(response.currentTopicIndex);
      setMessages([
        {
          id: "assistant-1",
          role: "assistant",
          content: response.openingQuestion,
          timestamp: Date.now(),
        },
      ]);

      setTimeout(() => {
        if (!isCancelled) {
          setStage("chat");
        }
      }, 1200);
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);

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
        webhookResponse?.reply ??
        "谢谢你的分享。接下来请举一个你在高压环境下体现领导力的具体案例。",
      timestamp: Date.now(),
    };
  }, [canStart, schoolId, programId, resumeFileName, coverLetterText]);

    setMessages((prev) => [...prev, assistantMessage]);
    setIsSending(false);
  };

  const handleFinish = () => {
    const payload = encodeURIComponent(JSON.stringify(messages));
    router.push(
      `/result?messages=${payload}&sessionId=${sessionId ?? ""}&schoolId=${schoolId}&programId=${programId}`,
    );
  };

  if (!canStart) {
    return (
      <main className="app-shell">
        <section className="panel">
          <h2>缺少必要参数</h2>
          <p className="panel-intro">请返回首页重新选择目标学校与项目。</p>
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
          <p>{schoolId} · {programId}</p>
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
                <li key={item} className={index < completedCount ? "done" : ""}>
                  <span className="agenda-check">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button className="secondary-btn" onClick={handleFinish}>结束面试并查看反馈</button>
          </aside>

          <div className="panel chat-panel">
            <ChatWindow messages={messages} onSendMessage={handleSendMessage} isSending={isSending} />
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
