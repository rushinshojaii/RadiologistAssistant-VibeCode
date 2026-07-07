# Simple AI Radiology Report Generator

A proof-of-concept web application that listens to voice dictation using the browser's microphone, displays a live transcript, and uses Google Gemini to generate a professional radiology report in real-time.

## Features
- **Real-Time Dictation**: Uses the native browser Web Speech API for real-time speech-to-text.
- **AI Report Generation**: Sends live transcript updates to a FastAPI backend which formats it into a professional radiology report using Gemini (`gemini-2.5-flash`).
- **Structured Sections**: The generated report strictly follows the standard format:
  1. Examination
  2. Findings
  3. Impression
- **Privacy First**: No databases, no patient details stored, no cloud logins.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- A Gemini API Key from Google AI Studio.

### 1. Environment Setup
1. Copy `.env.example` to `.env` in the `radiology-report-ai/` root folder:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your `GEMINI_API_KEY`:
   ```env
   GEMINI_API_KEY=your-actual-api-key
   ```

### 2. Backend Setup
1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - **Windows**: `venv\Scripts\activate`
   - **macOS/Linux**: `source venv/bin/activate`
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open the application in Google Chrome, Microsoft Edge, or Safari at the address shown (usually `http://localhost:5173`).
