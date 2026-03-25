import { NextResponse } from "next/server";
import { generateWithGemini } from "../../../lib/gemini";
import { getSession, updateSession } from "../../../lib/sessionStore";
import { ChatMessage } from "../../../types";

interface TurnRequest {
  sessionId?: string;
  messages: ChatMessage[];
  schoolId: string;
  programId: string;
}

export async function POST(request: Request) {
  const body: TurnRequest = await request.json();
  const { sessionId, messages } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Missing messages" }, { status: 400 });
  }

  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const currentTopic = session.topics[session.currentTopicIndex];
  if (!currentTopic) {
    return NextResponse.json({
      reply: "所有核心话题都已完成，感谢参与本次模拟面试。",
      currentTopicIndex: session.currentTopicIndex,
      completedTopicIndexes: session.completedTopicIndexes,
      interviewComplete: true,
    });
  }

  const transcript = messages
    .map((m) => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`)
    .join("\n");

  const prompt = `You are an admissions interviewer. Evaluate whether the candidate's latest answer is sufficient for the current topic.
Current topic: ${currentTopic}
Current follow-up count for this topic: ${session.followUpCountForCurrentTopic}
Max follow-up allowed: 2

Return strict JSON only:
{"satisfied": boolean, "nextQuestion": string}

Rules:
- If not satisfied and follow-up count < 2, ask a probing follow-up on SAME topic.
- If satisfied, ask question for NEXT topic directly.
- Keep question concise and interview-like.

Conversation transcript:
${transcript}`;

  let satisfied = false;
  let nextQuestion = "谢谢你的回答。我们进入下一个话题：请谈谈你的职业目标和项目匹配。";

  try {
    const modelText = await generateWithGemini(prompt, 220);
    if (modelText) {
      const parsed = JSON.parse(modelText) as { satisfied?: boolean; nextQuestion?: string };
      satisfied = Boolean(parsed.satisfied);
      if (parsed.nextQuestion) {
        nextQuestion = parsed.nextQuestion;
      }
    }
  } catch {
    // Use fallback logic below
  }

  if (!satisfied && session.followUpCountForCurrentTopic < 2) {
    session.followUpCountForCurrentTopic += 1;
    updateSession(session);
    return NextResponse.json({
      reply: nextQuestion,
      currentTopicIndex: session.currentTopicIndex,
      completedTopicIndexes: session.completedTopicIndexes,
      interviewComplete: false,
    });
  }

  if (!session.completedTopicIndexes.includes(session.currentTopicIndex)) {
    session.completedTopicIndexes.push(session.currentTopicIndex);
  }

  session.currentTopicIndex += 1;
  session.followUpCountForCurrentTopic = 0;

  const interviewComplete = session.currentTopicIndex >= session.topics.length;

  if (interviewComplete) {
    updateSession(session);
    return NextResponse.json({
      reply: "非常好，我们已完成所有核心话题。请进入反馈页面查看评估报告。",
      currentTopicIndex: session.currentTopicIndex,
      completedTopicIndexes: session.completedTopicIndexes,
      interviewComplete: true,
    });
  }

  const nextTopic = session.topics[session.currentTopicIndex];
  const fallbackNextQuestion = `好的，我们进入下一部分：${nextTopic}。请你先给出一个最有代表性的例子。`;
  updateSession(session);

  return NextResponse.json({
    reply: satisfied ? nextQuestion : fallbackNextQuestion,
    currentTopicIndex: session.currentTopicIndex,
    completedTopicIndexes: session.completedTopicIndexes,
    interviewComplete: false,
  });
}
