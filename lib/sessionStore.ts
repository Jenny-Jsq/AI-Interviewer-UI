import { School, Program } from "../types";

export interface InterviewerProfile {
  name: string;
  title: string;
  background: string;
}

export interface InterviewSessionState {
  sessionId: string;
  schoolId: string;
  programId: string;
  schoolName: string;
  programName: string;
  interviewer: InterviewerProfile;
  topics: string[];
  currentTopicIndex: number;
  followUpCountForCurrentTopic: number;
  completedTopicIndexes: number[];
  resumeText?: string;
  coverLetterText?: string;
}

const globalStore = globalThis as unknown as {
  __interviewSessionMap?: Map<string, InterviewSessionState>;
};

const sessionMap = globalStore.__interviewSessionMap ?? new Map<string, InterviewSessionState>();
globalStore.__interviewSessionMap = sessionMap;

export function createSession(input: {
  sessionId: string;
  school: School;
  program: Program;
  interviewer: InterviewerProfile;
  topics: string[];
  resumeText?: string;
  coverLetterText?: string;
}): InterviewSessionState {
  const session: InterviewSessionState = {
    sessionId: input.sessionId,
    schoolId: input.school.school_id,
    programId: input.program.program_id,
    schoolName: input.school.school_name,
    programName: input.program.program_name,
    interviewer: input.interviewer,
    topics: input.topics,
    currentTopicIndex: 0,
    followUpCountForCurrentTopic: 0,
    completedTopicIndexes: [],
    resumeText: input.resumeText,
    coverLetterText: input.coverLetterText,
  };

  sessionMap.set(session.sessionId, session);
  return session;
}

export function getSession(sessionId?: string): InterviewSessionState | null {
  if (!sessionId) return null;
  return sessionMap.get(sessionId) ?? null;
}

export function updateSession(session: InterviewSessionState): void {
  sessionMap.set(session.sessionId, session);
}
