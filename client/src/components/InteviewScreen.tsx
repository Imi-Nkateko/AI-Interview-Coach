import React, { useState, useRef, useEffect } from 'react';
import { InterviewMessage } from '../types';

// For SpeechRecognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface InterviewScreenProps {
  transcript: InterviewMessage[];
  onUserResponse: (response: string) => void;
  onEndInterview: () => void;
  isLoading: boolean;
}

const ChatBubble: React.FC<{ message: InterviewMessage }> = ({ message }) => {
  const isAI = message.speaker === 'ai';
  return (
    <div className={`flex items-start gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}>
      {isAI && (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center font-bold text-white shadow-md flex-shrink-0">
          AI
        </div>
      )}
      <div className={`max-w-md p-4 rounded-2xl shadow-lg ${isAI ? 'bg-gray-200 text-gray-800 rounded-tl-none' : 'bg-blue-600 text-white rounded-br-none'}`}>
        <p className="whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
};


const InterviewScreen: React.FC<InterviewScreenProps> = ({ transcript, onUserResponse, onEndInterview, isLoading }) => {
  const [userResponse, setUserResponse] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [paceFeedback, setPaceFeedback] = useState<string>('');
  const [paceColor, setPaceColor] = useState<string>('text-gray-500');

  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const speechStartTimeRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Continuous lets us control when to stop
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        speechStartTimeRef.current = Date.now();
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        setPaceFeedback('Pace: ...');
        setPaceColor('text-gray-500');
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');
        setUserResponse(transcript);
        
        if (speechStartTimeRef.current) {
            const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
            const elapsedTimeInSeconds = (Date.now() - speechStartTimeRef.current) / 1000;

            if (elapsedTimeInSeconds > 2 && wordCount > 5) {
                const wpm = Math.round((wordCount / elapsedTimeInSeconds) * 60);
                
                if (wpm < 110) {
                    setPaceFeedback(`Pace: ${wpm} WPM (A bit slow)`);
                    setPaceColor('text-yellow-600');
                } else if (wpm > 160) {
                    setPaceFeedback(`Pace: ${wpm} WPM (A bit fast)`);
                    setPaceColor('text-yellow-600');
                } else {
                    setPaceFeedback(`Pace: ${wpm} WPM (Good pace)`);
                    setPaceColor('text-green-600');
                }
            }
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        speechStartTimeRef.current = null;
        feedbackTimeoutRef.current = window.setTimeout(() => {
            setPaceFeedback('');
        }, 4000);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        speechStartTimeRef.current = null;
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setPaceFeedback('Microphone access denied.');
            setPaceColor('text-red-600');
        } else {
            setPaceFeedback('Speech recognition error.');
            setPaceColor('text-red-600');
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userResponse.trim() && !isLoading) {
      if (isRecording) {
        recognitionRef.current?.stop();
      }
      onUserResponse(userResponse);
      setUserResponse('');
      setPaceFeedback('');
    }
  };
  
  const handleToggleRecording = () => {
    if (!recognitionRef.current || isLoading) return;

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setUserResponse('');
      setPaceFeedback('');
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Error starting speech recognition:", e);
        setIsRecording(false);
        setPaceFeedback('Could not start recording.');
        setPaceColor('text-red-600');
      }
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[75vh]">
      <div className="flex-grow p-4 space-y-6 overflow-y-auto">
        {transcript.map((msg, index) => (
          <ChatBubble key={index} message={msg} />
        ))}
         {isLoading && transcript[transcript.length-1].speaker === 'user' && (
          <div className="flex items-start gap-3 justify-start">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center font-bold text-white shadow-md flex-shrink-0">AI</div>
            <div className="max-w-md p-4 rounded-2xl shadow-lg bg-gray-200 rounded-tl-none flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse delay-0"></span>
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse delay-200"></span>
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse delay-400"></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 border-t-2 border-gray-200">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full">
            <input
              type="text"
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              placeholder={isRecording ? "Listening..." : "Type or speak your answer..."}
              className="w-full p-3 pl-4 pr-12 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200 disabled:opacity-50"
              disabled={isLoading}
            />
            {isSpeechSupported && (
              <button
                type="button"
                onClick={handleToggleRecording}
                disabled={isLoading}
                className={`absolute inset-y-0 right-0 flex items-center px-3 rounded-r-lg transition-colors duration-200 focus:outline-none ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-gray-800'}`}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7v1h6v-1h-2v-2.07z" clipRule="evenodd"></path></svg>
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || !userResponse.trim()}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            Send
          </button>
        </form>
        <div className="h-6 mt-2 text-center">
            {paceFeedback && (
                <p className={`text-sm font-medium transition-opacity duration-300 ${paceColor}`}>
                    {paceFeedback}
                </p>
            )}
        </div>
         <button
            onClick={onEndInterview}
            disabled={isLoading}
            className="w-full px-6 py-2 mt-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            End Interview & Get Feedback
          </button>
      </div>
    </div>
  );
};

export default InterviewScreen;
