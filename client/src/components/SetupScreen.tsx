import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker source for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@^4.6.0/build/pdf.worker.mjs`;


interface SetupScreenProps {
  onStart: (resume: string, jd: string) => void;
  isLoading: boolean;
  initialJobDescription: string;
}

const parsePdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = '';
  
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
      fullText += pageText + '\n';
    }
  
    return fullText;
};


const SetupScreen: React.FC<SetupScreenProps> = ({ onStart, isLoading, initialJobDescription }) => {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jd, setJd] = useState(initialJobDescription);
  const [error, setError] = useState('');
  const [parsingPdf, setParsingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setResumeFile(file);
        setError('');
      } else {
        setResumeFile(null);
        setError('Please upload a valid PDF file.');
      }
    }
  };

  const handleSubmit = async () => {
    if (!resumeFile || !jd.trim()) {
      setError('Please upload a resume and provide the job description.');
      return;
    }
    setError('');
    setParsingPdf(true);
    try {
      const resumeText = await parsePdf(resumeFile);
      onStart(resumeText, jd);
    } catch (e) {
        console.error("Failed to parse PDF:", e);
        setError("Could not read the provided PDF file. Please try another file.");
    } finally {
        setParsingPdf(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-teal-700 mb-2">1. Upload Your Resume</h2>
        <p className="text-gray-600 mb-3">
          Upload your resume in PDF format. The content will be extracted locally in your browser.
        </p>
        <div className="w-full h-48 p-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
            <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
                disabled={isLoading}
            />
            {!resumeFile ? (
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-semibold transition-colors"
                >
                    <svg className="w-6 h-6 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    Select PDF
                </button>
            ) : (
                <div className="text-center">
                    <p className="font-semibold text-green-700">
                        <svg className="w-6 h-6 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {resumeFile.name}
                    </p>
                    <button 
                        onClick={() => {
                            setResumeFile(null);
                            if(fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        disabled={isLoading}
                        className="mt-2 text-sm text-red-600 hover:text-red-700"
                    >
                        Remove
                    </button>
                </div>
            )}
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-blue-700 mb-2">2. Job Description</h2>
        <p className="text-gray-600 mb-3">
          Paste the description of the job you're targeting.
        </p>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the job description here..."
          className="w-full h-48 p-3 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200"
          disabled={isLoading}
        />
      </div>
      {error && <p className="text-red-600 text-center">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={isLoading || parsingPdf}
        className="w-full sm:w-1/2 mx-auto mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-bold rounded-lg shadow-lg hover:scale-105 transform transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading || parsingPdf ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>{parsingPdf ? 'Parsing Resume...' : 'Starting...'}</span>
          </>
        ) : (
          'Start Mock Interview'
        )}
      </button>
    </div>
  );
};

export default SetupScreen;
