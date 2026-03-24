"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ChatWindow from "../../components/ChatWindow";
import { sendInterviewMessage, startInterviewSession } from "../../lib/api";
import { ChatMessage, InterviewerProfile } from "../../types";

type InterviewStage = "loading" | "chat";

const defaultInterviewer: InterviewerProfile = {
  name: "Sarah Jenkins",
  title: "Admissions Director",
  background: "Admissions interviewer focused on leadership and school fit.",
};

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

  const schoolId = searchParams.get("schoolId") ?? "";
  const programId = searchParams.get("programId") ?? "";
  const resumeFileName = searchParams.get("resumeFileName") ?? "";
  const coverLetterText = searchParams.get("coverLetterText") ?? "";

  const [stage, setStage] = useState<InterviewStage>("loading");
  const [seconds, setSeconds] = useState(0);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isSending, setIsSending] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);

  const [interviewer, setInterviewer] = useState<InterviewerProfile>(defaultInterviewer);
  const [topics, setTopics] = useState<string[]>([]);
  const [completedTopicIndexes, setCompletedTopicIndexes] = useState<number[]>([]);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const canStart = useMemo(() => Boolean(schoolId) && Boolean(programId), [schoolId, programId]);

  useEffect(() => {
    if (!canStart) return;

    const setup = async () => {
      const response = await startInterviewSession({
        schoolId,
        programId,
        resumeText: resumeFileName ? `Uploaded file: ${resumeFileName}` : undefined,
        coverLetterText,
      });

      if (!response) return;

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
    if (!sessionId) return;

    setIsSending(true);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: Date.now(),
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
      content: turnResponse?.reply ?? "谢谢你的回答。我们继续。",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    if (turnResponse) {
      setCurrentTopicIndex(turnResponse.currentTopicIndex);
      setCompletedTopicIndexes(turnResponse.completedTopicIndexes);
      setInterviewComplete(turnResponse.interviewComplete);
    }

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
          <button className="secondary-btn" onClick={() => router.push("/")}>
            返回首页
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell interview-shell">
      <header className="topbar">
        <div className="brand-mark">🎙️</div>
        <div>
          <h1>{interviewer.name}</h1>
          <p>
            {interviewer.title} · {schoolId} / {programId}
          </p>
        </div>
        {stage === "chat" ? <div className="timer-pill">{formatTime(seconds)}</div> : null}
      </header>

      {stage === "loading" ? (
        <section className="panel panel-loading">
          <div className="loader-avatar">🕵️</div>
          <h2>正在构建面试官 Agent</h2>
          <p>正在匹配院校偏好、候选人特质与重点追问话题...</p>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: "100%" }} />
          </div>
        </section>
      ) : (
        <section className="interview-grid">
          <aside className="panel agenda-panel">
            <h3>重点追问话题</h3>
            <ul>
              {topics.map((item, index) => (
                <li key={item} className={completedTopicIndexes.includes(index) ? "done" : ""}>
                  <span className="agenda-check">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="panel-intro">当前话题：{topics[currentTopicIndex] ?? "已完成"}</p>
            <button className="secondary-btn" onClick={handleFinish}>
              {interviewComplete ? "查看反馈报告" : "提前结束并查看反馈"}
            </button>
          </aside>

          <div className="panel chat-panel">
            <ChatWindow messages={messages} onSendMessage={handleSendMessage} isSending={isSending || interviewComplete} />
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
