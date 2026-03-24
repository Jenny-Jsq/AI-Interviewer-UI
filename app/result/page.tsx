"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import TakeawayCard from "../../components/TakeawayCard";
import { requestInterviewFeedback } from "../../lib/api";
import { ChatMessage, InterviewFeedback } from "../../types";

const fallbackFeedback: InterviewFeedback = {
  summary: "整体表达逻辑清晰，职业叙事完整，但在高压追问下仍有量化细节不足的问题。",
  takeaways: [
    {
      title: "Why MBA 更聚焦",
      detail: "你的长期目标清晰，但短期路径与项目资源映射可以再具体。",
      action: "准备一条 30 秒版本：Why now + Why this school。",
    },
    {
      title: "增强成果量化",
      detail: "领导力案例具备说服力，但数字结果出现频次偏少。",
      action: "每个 STAR 案例至少补充 1-2 个可验证指标。",
    },
    {
      title: "挑战案例更具反思",
      detail: "你强调了结果，但决策冲突和复盘过程还可以更深入。",
      action: "加入“当时如何权衡”“复盘后如何调整”的表述。",
    },
  ],
};

export default function ResultPage() {
  return (
    <Suspense fallback={<main className="app-shell"><section className="panel"><p className="panel-intro">正在加载反馈报告...</p></section></main>}>
      <ResultContent />
    </Suspense>
  );
}

function ResultContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") ?? "";
  const rawMessages = searchParams.get("messages") ?? "[]";
  const schoolId = searchParams.get("schoolId") ?? "";
  const programId = searchParams.get("programId") ?? "";

  const parsedMessages = useMemo<ChatMessage[]>(() => {
    try {
      return JSON.parse(decodeURIComponent(rawMessages)) as ChatMessage[];
    } catch {
      return [];
    }
  }, [rawMessages]);

  const [feedback, setFeedback] = useState<InterviewFeedback>(fallbackFeedback);
  const [copied, setCopied] = useState(false);

  const handleGenerateFeedback = async () => {
    const webhookFeedback = await requestInterviewFeedback({
      sessionId,
      messages: parsedMessages,
      schoolId,
      programId,
    });
    if (webhookFeedback) {
      setFeedback(webhookFeedback);
    }
  };

  const handleCopy = async () => {
    const text = [
      `Summary: ${feedback.summary}`,
      ...feedback.takeaways.map(
        (item, index) => `${index + 1}. ${item.title}\nDetail: ${item.detail}\nNext action: ${item.action}`,
      ),
    ].join("\n\n");

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="app-shell">
      <section className="panel result-panel">
        <div className="result-head">
          <div>
            <h2>面试评估报告</h2>
            <p>基于商学院面试官评价体系生成</p>
          </div>
          <div className="score-pill">88%</div>
        </div>

        <p className="result-summary">{feedback.summary}</p>

        <div className="result-actions">
          <button className="secondary-btn" type="button" onClick={handleGenerateFeedback}>
            刷新 API 反馈
          </button>
          <button className="primary-btn" type="button" onClick={handleCopy}>
            {copied ? "已复制" : "复制反馈"}
          </button>
          <Link className="secondary-btn" href="/">
            重新匹配面试官
          </Link>
        </div>

        <section className="takeaway-grid">
          {feedback.takeaways.map((takeaway) => (
            <TakeawayCard
              key={takeaway.title}
              title={takeaway.title}
              detail={takeaway.detail}
              action={takeaway.action}
            />
          ))}
        </section>
      </section>
    </main>
  );
}
