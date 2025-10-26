import React from 'react';
import { FeedbackReport, FeedbackSection } from '../types';

interface FeedbackScreenProps {
  report: FeedbackReport;
  onStartNew: () => void;
}

const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
  const getColor = (s: number) => {
    if (s >= 85) return 'text-green-600';
    if (s >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`relative w-24 h-24 flex-shrink-0`}>
      <svg className="w-full h-full" viewBox="0 0 36 36">
        <path
          className="text-gray-200"
          d="M18 2.0845
             a 15.9155 15.9155 0 0 1 0 31.831
             a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className={`${getColor(score)}`}
          d="M18 2.0845
             a 15.9155 15.9155 0 0 1 0 31.831
             a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={`${score}, 100`}
          strokeLinecap="round"
          transform="rotate(90 18 18)"
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center text-2xl font-bold ${getColor(score)}`}>
        {score}
      </div>
    </div>
  );
};

const FeedbackCard: React.FC<{ title: string; data: FeedbackSection }> = ({ title, data }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md">
    <div className="flex items-center gap-4 mb-4">
      <ScoreCircle score={data.score} />
      <h3 className="text-2xl font-bold text-teal-700">{title}</h3>
    </div>
    <div>
      <h4 className="font-semibold text-lg text-gray-800 mb-2">Analysis:</h4>
      <p className="text-gray-600 whitespace-pre-wrap mb-4">{data.analysis}</p>
      <h4 className="font-semibold text-lg text-gray-800 mb-2">Suggestions:</h4>
      <p className="text-gray-600 whitespace-pre-wrap">{data.suggestions}</p>
    </div>
  </div>
);


const FeedbackScreen: React.FC<FeedbackScreenProps> = ({ report, onStartNew }) => {
  return (
    <div className="flex flex-col gap-8 animate-fade-in overflow-y-auto max-h-[75vh] p-2">
      <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200">
        <h2 className="text-3xl font-bold text-blue-700 mb-2">Interview Readiness Score</h2>
        <div className="flex justify-center my-4">
            <ScoreCircle score={report.overallScore.score} />
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">{report.overallScore.summary}</p>
      </div>

      <div className="grid md:grid-cols-1 lg:grid-cols-1 gap-6">
        <FeedbackCard title="Answer Quality" data={report.answerQuality} />
        <FeedbackCard title="Communication Skills" data={report.communicationSkills} />
        <FeedbackCard title="Content & Strategy" data={report.contentAndStrategy} />
      </div>

      <button
        onClick={onStartNew}
        className="w-full sm:w-1/2 mx-auto mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-bold rounded-lg shadow-lg hover:scale-105 transform transition duration-300 ease-in-out"
      >
        Practice Again
      </button>
    </div>
  );
};

export default FeedbackScreen;
