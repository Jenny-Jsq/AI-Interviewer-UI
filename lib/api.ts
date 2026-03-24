import {
  ChatMessage,
  InterviewFeedback,
  InterviewSessionInput,
  StartInterviewResponse,
  TurnResponse,
} from "../types";

async function postToLocal<TPayload, TResponse>(endpoint: string, payload: TPayload): Promise<TResponse | null> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`API call failed: ${res.status} ${res.statusText}`);
      return null;
    }
    return (await res.json()) as TResponse;
  } catch (err) {
    console.error("API call error", err);
    return null;
  }
}

export async function startInterviewSession(payload: InterviewSessionInput): Promise<StartInterviewResponse | null> {
  return postToLocal<InterviewSessionInput, StartInterviewResponse>("/api/interview/start", payload);
}

export async function sendInterviewMessage(payload: {
  sessionId?: string;
  messages: ChatMessage[];
  schoolId: string;
  programId: string;
}): Promise<TurnResponse | null> {
  return postToLocal<typeof payload, TurnResponse>("/api/interview/turn", payload);
}

export async function requestInterviewFeedback(payload: {
  sessionId?: string;
  messages: ChatMessage[];
  schoolId: string;
  programId: string;
}): Promise<InterviewFeedback | null> {
  return postToLocal<typeof payload, InterviewFeedback>("/api/interview/feedback", payload);
}
