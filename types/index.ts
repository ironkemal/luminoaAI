export type JobStatus = "employed" | "job_seeking";

export type ScenarioType =
  | "job_interview"
  | "salary_negotiation"
  | "performance_review";

export type Difficulty = "easy" | "medium" | "hard";

export type SessionStatus = "active" | "completed";

export interface Profile {
  id: string;
  full_name: string | null;
  job_status: JobStatus | null;
  sector: string | null;
  created_at: string;
}

export interface CvData {
  id: string;
  user_id: string;
  file_name: string;
  extracted_text: string;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  scenario_type: ScenarioType;
  company_name: string | null;
  job_title: string | null;
  sector: string | null;
  difficulty: Difficulty;
  status: SessionStatus;
  company_research: string | null;
  job_listing_url: string | null;
  job_listing_text: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface SessionAnalysis {
  id: string;
  session_id: string;
  strengths: string[];
  weaknesses: string[];
  best_moment: string;
  overall_score: number;
  created_at: string;
}

export interface Todo {
  id: string;
  user_id: string;
  session_id: string | null;
  content: string;
  completed: boolean;
  created_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface InterviewConfig {
  scenarioType: ScenarioType;
  companyName?: string;
  jobTitle?: string;
  sector?: string;
  difficulty: Difficulty;
  cvText?: string;
  companyResearch?: string;
  jobListingText?: string;
}

export interface AnalysisResult {
  strengths: string[];
  weaknesses: string[];
  best_moment: string;
  overall_score: number;
  todos: string[];
}

export const SCENARIO_LABELS: Record<ScenarioType, string> = {
  job_interview: "Vorstellungsgespräch",
  salary_negotiation: "Gehaltsverhandlung",
  performance_review: "Mitarbeitergespräch",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Einfach",
  medium: "Mittel",
  hard: "Schwer",
};

export const SECTORS = [
  "Technologie & IT",
  "Finanzen & Banking",
  "Marketing & Kommunikation",
  "Consulting & Beratung",
  "Ingenieurwesen",
  "Gesundheitswesen",
  "Bildung & Wissenschaft",
  "Einzelhandel & E-Commerce",
  "Logistik & Supply Chain",
  "Human Resources",
  "Recht & Compliance",
  "Sonstiges",
];
