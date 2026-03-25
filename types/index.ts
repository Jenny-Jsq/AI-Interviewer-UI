export interface School {
  school_id: string;
  school_name: string;
  country: string;
  ranking_note: string;
  general_values: string[];
  interview_tone: string[];
  example_question_style: string[];
}

export interface Program {
  program_id: string;
  school_id: string;
  program_name: string;
  degree_type: string;
  duration_months: number;
  highlights: string[];
}

export interface InterviewSessionInput {
  accessCode: string;
  schoolId: string;
  programId: string;
  resumeText?: string;
  coverLetterText?: string;
}

export interface InterviewerProfile {
  name: string;
  title: string;
  background: string;
}

export interface StartInterviewResponse {
  sessionId: string;
  interviewer: InterviewerProfile;
  topics: string[];
  currentTopicIndex: number;
  openingQuestion: string;
  remainingUses: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface TurnResponse {
  reply: string;
  currentTopicIndex: number;
  completedTopicIndexes: number[];
  interviewComplete: boolean;
}

export interface InterviewFeedback {
  summary: string;
  takeaways: Array<{
    title: string;
    detail: string;
    action: string;
  }>;
}

export interface AccessCodeValidationResponse {
  valid: boolean;
  remainingUses: number;
  message?: string;
}
