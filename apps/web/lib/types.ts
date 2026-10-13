export type PositionStatus = "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";
export type ApplicationStatus = "ACTIVE" | "HIRED" | "REJECTED" | "WITHDRAWN";
export type RoundType = "FORM" | "TEST" | "ASSESSMENT" | "INTERVIEW" | "MANUAL";
export type RoundStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "PASSED"
  | "FAILED"
  | "SKIPPED";

export interface WrittenTestConfig {
  testDate?: string | null;
  location?: string | null;
  mapUrl?: string | null;
  syllabus?: string | null;
  description?: string | null;
  meetingDate?: string | null;
  meetingUrl?: string | null;
  isPublished?: boolean;
  publishedAt?: string | null;
}

export interface HiringRound {
  id: string;
  positionId: string;
  title: string;
  type: RoundType;
  order: number;
  instructions?: string | null;
  externalUrl?: string | null;
  config?: (Record<string, unknown> & WrittenTestConfig) | null;
  isRequired: boolean;
  publishedAt?: string | null;
}

export interface RoundParticipation {
  id: string;
  applicationId: string;
  roundId: string;
  round?: HiringRound;
  status: RoundStatus;
  submissionData?: Record<string, unknown> | null;
  score?: number | null;
  recruiterNotes?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  endsAt?: string | null;
  timeZone?: string | null;
  meetingUrl?: string | null;
  decisionAt?: string | null;
  completedAt?: string | null;
  customConfig?: Record<string, unknown> | null;
}

export interface AiEvaluation {
  strengths?: string[];
  gaps?: string[];
  evidence?: string[];
  recommendation?: string;
  summary?: string;
}

export interface Application {
  id: string;
  positionId: string;
  position?: Position;
  candidateId: string;
  candidate?: Candidate;
  status: ApplicationStatus;
  source?: string | null;
  sourceResponseId?: string | null;
  appliedAt: string;
  rawAnswers?: Record<string, unknown> | null;
  resumeUrl?: string | null;
  aiScore?: number | null;
  aiEvaluation?: AiEvaluation | null;
  roundResults?: RoundParticipation[];
  createdAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  applications?: Application[];
  createdAt: string;
  updatedAt?: string;
}

export interface Position {
  id: string;
  title: string;
  description?: string | null;
  status: PositionStatus;
  googleFormUrl?: string | null;
  announcementSubject?: string | null;
  announcementBody?: string | null;
  creatorId?: string;
  rounds?: HiringRound[];
  applications?: Application[];
  _count?: {
    applications: number;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface DashboardStats {
  totalPositions: number;
  openPositions: number;
  totalApplications: number;
}
