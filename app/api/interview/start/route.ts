import { NextResponse } from "next/server";
import { generateWithGemini } from "../../../../lib/gemini";
import { getProgramById, getSchoolById } from "../../../../lib/loadData";
import { createSession } from "../../../../lib/sessionStore";
import { InterviewSessionInput } from "../../../../types";

export async function POST(request: Request) {
  const body: InterviewSessionInput = await request.json();

  if (!body.schoolId || !body.programId) {
    return NextResponse.json({ error: "Missing schoolId or programId" }, { status: 400 });
  }

  const school = await getSchoolById(body.schoolId);
  const program = await getProgramById(body.programId);

  if (!school || !program) {
    return NextResponse.json({ error: "Invalid schoolId or programId" }, { status: 404 });
  }

  const sessionId = crypto.randomUUID();

  const prompt = `You are building an admissions interview simulation agent.
Return strict JSON only in this shape:
{
  "interviewer": {"name": string, "title": string, "background": string},
  "topics": [string, string, string, string, string, string, string],
  "openingQuestion": string
}

School: ${school.school_name}
Program: ${program.program_name} (${program.degree_type})
School values: ${school.general_values.join(", ")}
Interview tone: ${school.interview_tone.join(", ")}
Program highlights: ${program.highlights.join(", ")}
Candidate resume info: ${body.resumeText || "not provided"}
Candidate extra info: ${body.coverLetterText || "not provided"}

Requirements:
- topics must be 6-7 high-probability probing themes.
- topics should align with school values and candidate profile.
- openingQuestion should start topic 1.`;

  let interviewer = {
    name: "Sarah Jenkins",
    title: "Admissions Director",
    background: `${school.school_name} admissions interviewer with focus on leadership potential and program fit.`,
  };

  let topics = [
    "自我介绍与申请动机",
    "职业目标与 Why MBA",
    "领导力案例深挖",
    "失败与反思",
    "跨文化/团队协作",
    "行业洞察与学校匹配",
    "反向提问质量",
  ];

  let openingQuestion = "请先做一个简短自我介绍，并说明为什么在当前阶段申请这个项目？";

  try {
    const modelText = await generateWithGemini(prompt, 700);
    if (modelText) {
      const parsed = JSON.parse(modelText) as {
        interviewer?: { name?: string; title?: string; background?: string };
        topics?: string[];
        openingQuestion?: string;
      };

      if (parsed.interviewer?.name && parsed.interviewer.title && parsed.interviewer.background) {
        interviewer = {
          name: parsed.interviewer.name,
          title: parsed.interviewer.title,
          background: parsed.interviewer.background,
        };
      }

      if (Array.isArray(parsed.topics) && parsed.topics.length >= 6) {
        topics = parsed.topics.slice(0, 7);
      }

      if (parsed.openingQuestion) {
        openingQuestion = parsed.openingQuestion;
      }
    }
  } catch (error) {
    console.warn("Failed to generate interviewer/topics from model, fallback applied.", error);
  }

  const session = createSession({
    sessionId,
    school,
    program,
    interviewer,
    topics,
    resumeText: body.resumeText,
    coverLetterText: body.coverLetterText,
  });

  return NextResponse.json({
    sessionId: session.sessionId,
    interviewer: session.interviewer,
    topics: session.topics,
    currentTopicIndex: session.currentTopicIndex,
    openingQuestion,
  });
}
