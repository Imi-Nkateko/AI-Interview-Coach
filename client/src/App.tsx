import React, { useState, useCallback } from 'react';
import { GameState, InterviewMessage, FeedbackReport } from './types';
import SetupScreen from './components/SetupScreen';
import InterviewScreen from './components/InterviewScreen';
import FeedbackScreen from './components/FeedbackScreen';
import { generateFirstQuestion, generateNextQuestion, generateFeedbackReport } from './services/geminiService';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.Setup);
  const [resumeText, setResumeText] = useState<string>('');
  const [jobDescriptionText, setJobDescriptionText] = useState<string>('');
  const [interviewTranscript, setInterviewTranscript] = useState<InterviewMessage[]>([]);
  const [feedbackReport, setFeedbackReport] = useState<FeedbackReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartInterview = useCallback(async (resume: string, jd: string) => {
    setIsLoading(true);
    setError(null);
    setResumeText(resume);
    setJobDescriptionText(jd);
    setInterviewTranscript([]);
    setFeedbackReport(null);

    try {
      const firstQuestion = await generateFirstQuestion(resume, jd);
      setInterviewTranscript([{ speaker: 'ai', text: firstQuestion }]);
      setGameState(GameState.Interview);
    } catch (e) {
      console.error(e);
      setError('Failed to start the interview. Please check your API key and try again.');
      setGameState(GameState.Setup);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleUserResponse = useCallback(async (responseText: string) => {
    const updatedTranscript: InterviewMessage[] = [
      ...interviewTranscript,
      { speaker: 'user', text: responseText },
    ];
    setInterviewTranscript(updatedTranscript);
    setIsLoading(true);
    setError(null);

    try {
      const nextQuestion = await generateNextQuestion(resumeText, jobDescriptionText, updatedTranscript);
      setInterviewTranscript(prev => [...prev, { speaker: 'ai', text: nextQuestion }]);
    } catch (e) {
      console.error(e);
      setError('Failed to get the next question. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [interviewTranscript, resumeText, jobDescriptionText]);
  
  const handleEndInterview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setGameState(GameState.Loading);
    
    try {
      const report = await generateFeedbackReport(resumeText, jobDescriptionText, interviewTranscript);
      setFeedbackReport(report);
      setGameState(GameState.Feedback);
    } catch (e) {
      console.error(e);
      setError('Failed to generate feedback report. Please try starting a new interview.');
      setGameState(GameState.Interview);
    } finally {
      setIsLoading(false);
    }
  }, [resumeText, jobDescriptionText, interviewTranscript]);

  const handleStartNew = useCallback(() => {
    setGameState(GameState.Setup);
    setInterviewTranscript([]);
    setFeedbackReport(null);
    setError(null);
    setResumeText(''); // Clear resume text for new upload
    // Keep JD for convenience
  }, []);

  const renderContent = () => {
    switch (gameState) {
      case GameState.Setup:
        return (
          <SetupScreen
            onStart={handleStartInterview}
            isLoading={isLoading}
            initialJobDescription={jobDescriptionText}
          />
        );
      case GameState.Interview:
        return (
          <InterviewScreen
            transcript={interviewTranscript}
            onUserResponse={handleUserResponse}
            onEndInterview={handleEndInterview}
            isLoading={isLoading}
          />
        );
      case GameState.Feedback:
        return feedbackReport ? (
          <FeedbackScreen report={feedbackReport} onStartNew={handleStartNew} />
        ) : null;
      case GameState.Loading:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
             <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-600"></div>
             <p className="mt-4 text-lg text-gray-600">Generating your comprehensive feedback report... This may take a moment.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600">
            AI Interview Coach
          </h1>
          <p className="mt-2 text-gray-600">Your personal career trainer, available 24/7.</p>
        </header>
        <main className="bg-white rounded-2xl shadow-xl p-6 min-h-[60vh] flex flex-col">
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-800 p-3 rounded-lg mb-4 text-center">
              <strong>Error:</strong> {error}
            </div>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
