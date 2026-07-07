import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from google.genai import types

# 1. Load environment variables
# Look for .env in the parent directory (project root) or current directory
BASE_DIR = Path(__file__).resolve().parent
parent_env = BASE_DIR.parent / ".env"
local_env = BASE_DIR / ".env"

if parent_env.exists():
    load_dotenv(parent_env)
elif local_env.exists():
    load_dotenv(local_env)
else:
    load_dotenv()  # Fallback to default behavior

# Retrieve Gemini API Key from environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Initialize FastAPI App
app = FastAPI(title="Radiology Report Generator API", version="1.0.0")

# 2. Configure CORS
# Allow frontend origins to communicate with this backend API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual frontend URL (e.g., http://localhost:5173)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Read LLM prompt instructions
# Locate prompts/report_prompt.txt
PROMPT_PATH = BASE_DIR.parent / "prompts" / "report_prompt.txt"
if not PROMPT_PATH.exists():
    # Fallback to local prompt if parent folder not structured
    PROMPT_PATH = BASE_DIR / "report_prompt.txt"

try:
    with open(PROMPT_PATH, "r", encoding="utf-8") as f:
        SYSTEM_PROMPT = f.read().strip()
except Exception as e:
    # Safe default in case prompt file is missing
    SYSTEM_PROMPT = (
        "You are an experienced radiologist. Convert the dictated findings into a "
        "professional radiology report. Return only: Examination, Findings, Impression."
    )

# 4. Initialize Gemini Client
# The SDK automatically handles the api_key if GEMINI_API_KEY is in the env.
# We pass it explicitly to prevent issues if dotenv load was delayed.
try:
    if GEMINI_API_KEY:
        client = genai.Client(api_key=GEMINI_API_KEY)
    else:
        # Fallback to default client setup (checks environment variable)
        client = genai.Client()
except Exception as e:
    print(f"Warning: Failed to initialize Gemini Client: {e}")
    client = None


# Define Request & Response Models
class ReportRequest(BaseModel):
    transcript: str


class ReportResponse(BaseModel):
    report: str


@app.get("/")
def read_root():
    """Health check endpoint to ensure API is online."""
    return {
        "status": "online",
        "message": "Simple AI Radiology Report Generator API is active",
        "api_key_configured": GEMINI_API_KEY is not None,
    }


@app.post("/generate-report", response_model=ReportResponse)
def generate_report(request: ReportRequest):
    """
    Receives dictation transcript, applies clinical report guidelines,
    and returns a structured radiology report from Gemini.
    """
    if not client:
        raise HTTPException(
            status_code=500,
            detail="Gemini API Client is not configured. Please check your GEMINI_API_KEY.",
        )

    if not request.transcript.strip():
        return ReportResponse(report="")

    try:
        # We use gemini-2.5-flash which is ideal for real-time, low-latency tasks.
        # System instructions enforce formatting guidelines and professional style constraints.
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=request.transcript,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.1,  # Low temperature for objective clinical report formatting
            ),
        )

        generated_text = response.text or ""
        return ReportResponse(report=generated_text.strip())

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating report from Gemini: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    # Start server locally on port 8000
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
