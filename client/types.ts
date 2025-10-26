export enum GameState {
  Setup = 'setup',
  Interview = 'interview',
  Loading = 'loading',
  Feedback = 'feedback',
}

export interface InterviewMessage {
  speaker: 'ai' | 'user';
  text: string;
}

export interface FeedbackSection {
  score: number;
  analysis: string;
  suggestions: string;
}

export interface FeedbackReport {
  overallScore: {
    score: number;
    summary: string;
  };
  answerQuality: FeedbackSection;
  communicationSkills: FeedbackSection;
  contentAndStrategy: FeedbackSection;
}
