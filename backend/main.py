"""
FastAPI server. Single endpoint: POST /api/analyze
Returns the full report JSON for the frontend to render.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import traceback

from backend.report_generator import generate_report

app = FastAPI(title="GutGutGoose Report API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    profile_path: str | None = None


@app.post("/api/analyze")
async def analyze(request: AnalyzeRequest = AnalyzeRequest()):
    try:
        report = generate_report(request.profile_path)
        return report
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=f"Profile not found: {e}")
    except KeyError as e:
        raise HTTPException(status_code=500, detail=f"Data error: {e}\n{traceback.format_exc()}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {e}\n{traceback.format_exc()}")


@app.get("/health")
async def health():
    return {"status": "ok"}
