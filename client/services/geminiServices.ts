
import { GoogleGenAI, Type } from "@google/genai";
import { InterviewMessage, FeedbackReport } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = ai.models;

const formatTranscript = (transcript: InterviewMessage[]): string => {
  return transcript.map(msg => `${msg.speaker.toUpperCase()}: ${msg.text}`).join('\n\n');
};

export const generateFirstQuestion = async (resume: string, jd: string): Promise<string> => {
  const prompt = `
    System Instruction: You are an expert interview coach. Your goal is to conduct a realistic and challenging job interview.
    User's Resume:
    ---
    ${resume}
    ---
    Job Description:
    ---
    ${jd}
    ---
    Task: Based on the user's resume and the target job description, generate the first interview question. The question should be relevant and insightful. It can be behavioral, technical, or situational. Ask only one question to start.
  `;
  
  const response = await model.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt
  });
  
  return response.text.trim();
};

export const generateNextQuestion = async (resume: string, jd: string, transcript: InterviewMessage[]): Promise<string> => {
  const prompt = `
    System Instruction: You are an expert interview coach continuing an interview. Be adaptive. Ask relevant follow-up questions based on the conversation history. Do not repeat questions. Keep the interview flowing naturally.
    User's Resume:
    ---
    ${resume}
    ---
    Job Description:
    ---
    ${jd}
    ---
    Interview Transcript (so far):
    ---
    ${formatTranscript(transcript)}
    ---
    Task: Generate the next single interview question.
  `;

  const response = await model.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt
  });

  return response.text.trim();
};

const feedbackSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER, description: "A score from 0-100." },
        summary: { type: Type.STRING, description: "A brief summary of the performance." }
      },
       required: ["score", "summary"]
    },
    answerQuality: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER, description: "A score from 0-100 for answer quality." },
        analysis: { type: Type.STRING, description: "Detailed analysis on relevance, use of examples, technical accuracy." },
        suggestions: { type: Type.STRING, description: "Actionable advice for improving answer quality." }
      },
      required: ["score", "analysis", "suggestions"]
    },
    communicationSkills: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER, description: "A score from 0-100 for communication skills." },
        analysis: { type: Type.STRING, description: "Analysis of clarity, articulation, and response structure." },
        suggestions: { type: Type.STRING, description: "Tips for better communication." }
      },
      required: ["score", "analysis", "suggestions"]
    },
    contentAndStrategy: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER, description: "A score from 0-100 for content and strategy." },
        analysis: { type: Type.STRING, description: "Analysis of alignment with job description and resume, and STAR method usage." },
        suggestions: { type: Type.STRING, description: "Suggest specific skills or projects to highlight and provide a better answer example." }
      },
      required: ["score", "analysis", "suggestions"]
    },
  },
  required: ["overallScore", "answerQuality", "communicationSkills", "contentAndStrategy"]
};


export const generateFeedbackReport = async (resume: string, jd: string, transcript: InterviewMessage[]): Promise<FeedbackReport> => {
  const prompt = `
    System Instruction: You are an expert career coach and interview analyst. Your task is to provide a comprehensive, constructive, and detailed feedback report on the following job interview transcript. Be critical but encouraging. Provide specific examples from the transcript to support your analysis.
    User's Resume:
    ---
    ${resume}
    ---
    Job Description:
    ---
    ${jd}
    ---
    Full Interview Transcript:
    ---
    ${formatTranscript(transcript)}
    ---
    Task: Analyze the transcript and provide feedback in the specified JSON format.
  `;
  
  const response = await model.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: feedbackSchema
    }
  });
  
  const jsonText = response.text.trim();
  try {
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Failed to parse feedback JSON:", error);
    console.error("Received text:", jsonText);
    throw new Error("The AI returned an invalid feedback format. Please try again.");
  }
};
