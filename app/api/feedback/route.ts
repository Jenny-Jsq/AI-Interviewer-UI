import { NextResponse } from "next/server";
import { getProgramById, getSchoolById } from "../../../lib/loadData";
import { generateWithGemini } from "../../../lib/gemini";
import { ChatMessage, InterviewFeedback } from "../../../types";

interface FeedbackRequest {
  sessionId?: string;
  messages: ChatMessage[];
  schoolId: string;
  programId: string;
}

export async function POST(request: Request) {
  const body: FeedbackRequest = await request.json();
  const { messages, schoolId, programId } = body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Missing messages" }, { status: 400 });
  }

  const school = await getSchoolById(schoolId);
  const program = await getProgramById(programId);

  let systemPrompt = "";
  if (school) {
    systemPrompt += `You are an admissions evaluator at ${school.school_name}. `;
    if (school.general_values.length > 0) {
      systemPrompt += `Your school values ${school.general_values.join(", ")}. `;
    }
  }
  if (program) {
    systemPrompt += `You are evaluating candidates for the ${program.program_name} program. `;
  }
  systemPrompt += "Provide a brief summary of the candidate’s performance and output 3–5 takeaways in JSON only. ";
  systemPrompt += '{"summary": string, "takeaways": [{"title": string, "detail": string, "action": string}]}. ';
  systemPrompt += "Base your feedback on the conversation transcript. Be constructive and specific.";

  const transcript = messages
    .map((m) => {
      const speaker = m.role === "user" ? "Candidate" : "Interviewer";
      return `${speaker}: ${m.content}`;
    })
    .join("\n");

  const finalPrompt = `${systemPrompt}\n\nTranscript:\n${transcript}`;

  try {
    const text = await generateWithGemini(finalPrompt, 700);
    let feedback: InterviewFeedback | null = null;

    if (text) {
      try {
        feedback = JSON.parse(text) as InterviewFeedback;
      } catch {
        feedback = null;
      }
    }

    if (feedback && feedback.summary && Array.isArray(feedback.takeaways)) {
      return NextResponse.json(feedback);
    }
  } catch (err) {
    console.error("Feedback generation failed", err);
  }

  const fallback: InterviewFeedback = {
    summary: "Good structure overall. Your examples were clear, but impact quantification can be stronger.",
    takeaways: [
      {
        title: "Sharpen your motivation",
        detail: "You explained your goals, but the link between goal and target curriculum can be tighter.",
        action: "Use a 30-second why-now + why-this-program statement.",
      },
      {
        title: "Increase measurable impact",
        detail: "Leadership stories are promising but lacked metrics.",
        action: "Add 1-2 quantified outcomes for each STAR example.",
      },
      {
        title: "Handle follow-up pressure",
        detail: "Some responses became broad under probing questions.",
        action: "End each answer with one concrete decision and result.",
      },
    ],
  };

  return NextResponse.json(fallback);
}
