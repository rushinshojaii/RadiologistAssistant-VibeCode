import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  // App States
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [generatedReport, setGeneratedReport] = useState('');
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Web Speech API Reference
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition on Mount
  useEffect(() => {
    // Standard SpeechRecognition or webkitSpeechRecognition for Safari/Chrome/Edge
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // Handle Start Event
    recognition.onstart = () => {
      setIsRecording(true);
      setError(null);
    };

    // Handle Error Event
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'not-allowed') {
        setError("Microphone access denied. Please enable microphone permissions in your browser settings.");
      } else {
        setError(`Microphone error: ${event.error}`);
      }
      setIsRecording(false);
    };

    // Handle End Event
    recognition.onend = () => {
      setIsRecording(false);
    };

    // Handle Real-Time Results
    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript + ' ';
      }
      setLiveTranscript(finalTranscript.trim());
    };

    recognitionRef.current = recognition;
  }, []);

  // API Call to FastAPI Backend
  const generateReport = async (text) => {
    if (!text.trim()) {
      setGeneratedReport('');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: text }),
      });

      if (!response.ok) {
        const errDetail = await response.json();
        throw new Error(errDetail.detail || `Server error: ${response.statusText}`);
      }

      const data = await response.json();
      setGeneratedReport(data.report);
      setError(null);
    } catch (err) {
      console.error("Error fetching report:", err);
      setError(`Backend Error: ${err.message}. Make sure the backend server is running.`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Debounce API calls: Wait 1.5s after user stops speaking to update report
  useEffect(() => {
    if (!isRecording && !liveTranscript) {
      return;
    }

    const handler = setTimeout(() => {
      if (liveTranscript) {
        generateReport(liveTranscript);
      }
    }, 1500);

    return () => {
      clearTimeout(handler);
    };
  }, [liveTranscript]);

  // Action Controllers
  const startRecording = () => {
    if (!recognitionRef.current) return;
    setError(null);
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setError("Failed to start speech recognition. Try refreshing the page.");
    }
  };

  const stopRecording = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      // Immediately request final report without waiting for debounce
      if (liveTranscript) {
        generateReport(liveTranscript);
      }
    } catch (err) {
      console.error("Failed to stop speech recognition:", err);
    }
  };

  const clearAll = () => {
    stopRecording();
    setLiveTranscript('');
    setGeneratedReport('');
    setError(null);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="logo-icon">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <h1 className="app-title">Radiology Assistant AI</h1>
        <p className="app-subtitle">
          Real-time, voice-dictated professional radiology report generator. Dictate findings, and watch them organize into structured clinical documentation.
        </p>
      </header>

      {/* Control Panel */}
      <div className="controls-panel">
        <button
          onClick={startRecording}
          disabled={isRecording}
          className="btn btn-start"
          id="btn-start-recording"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
          </svg>
          Start Recording
        </button>

        <button
          onClick={stopRecording}
          disabled={!isRecording}
          className="btn btn-stop"
          id="btn-stop-recording"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
          </svg>
          Stop Recording
        </button>

        <button
          onClick={clearAll}
          disabled={!liveTranscript && !generatedReport && !error}
          className="btn btn-clear"
          id="btn-clear-fields"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            <line x1="10" x2="10" y1="11" y2="17"/>
            <line x1="14" x2="14" y1="11" y2="17"/>
          </svg>
          Clear
        </button>
      </div>

      {/* Errors (if any) */}
      {error && (
        <div className="error-message">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="error-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Main Workspace Grid */}
      <main className="dashboard-grid">
        {/* Left Side: Live Transcript */}
        <section className={`glass-card ${isRecording ? 'active-card' : ''}`}>
          <div className="card-header">
            <h2 className="card-title">
              Live Transcript
            </h2>
            <div className="status-badge">
              <span className={`status-dot ${isRecording ? 'recording' : ''}`}></span>
              {isRecording ? 'Listening...' : 'Idle'}
            </div>
          </div>
          
          <div className="display-box" id="transcript-box">
            {liveTranscript ? (
              <span>{liveTranscript}</span>
            ) : (
              <div className="transcript-placeholder">
                Click "Start Recording" and speak to dictate clinical findings.
              </div>
            )}
          </div>
        </section>

        {/* Right Side: Generated Report */}
        <section className={`glass-card ${isGenerating ? 'active-card' : ''}`}>
          <div className="card-header">
            <h2 className="card-title">
              Generated Report
            </h2>
            <div className="status-badge">
              {isGenerating ? (
                <>
                  <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>LLM Generating...</span>
                </>
              ) : (
                <>
                  <span className={`status-dot ${generatedReport ? 'active' : ''}`}></span>
                  <span>{generatedReport ? 'Ready' : 'Pending'}</span>
                </>
              )}
            </div>
          </div>

          <div className="display-box" id="report-box">
            {generatedReport ? (
              <div className="report-paper">
                {generatedReport}
              </div>
            ) : (
              <div className="transcript-placeholder">
                The formatted radiology report will appear here in real-time as you dictate.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
