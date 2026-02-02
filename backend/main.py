"""
NutriMedAI Backend API
FastAPI server for food image analysis (OpenAI GPT-4 Vision)
"""

import os
import base64
from pathlib import Path
from io import BytesIO
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from openai import OpenAI

# Load .env from backend folder or project root
try:
    from dotenv import load_dotenv
    _env_path = Path(__file__).resolve().parent / ".env"
    if _env_path.exists():
        load_dotenv(_env_path)
    else:
        load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass

app = FastAPI(title="NutriMedAI API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
# Optional: paste key here for local dev only (do not commit)
if not OPENAI_API_KEY:
    OPENAI_API_KEY = ""

CONDITION_OPTIONS = [
    "Diabetes", "Hypertension (High BP)", "Heart disease", "Kidney disease",
    "Obesity / Weight management", "Celiac disease", "Lactose intolerance",
    "GERD / Acid reflux", "High cholesterol", "Thyroid disorder",
    "None / No current conditions",
]


def build_prompt(current_conditions: str, concerned_conditions: str, has_current: bool, has_concerned: bool) -> str:
    current_ins = (
        "Write a short condition-based summary: how does this food affect the user's current conditions? Is it safe or should they limit/avoid? Be specific (e.g. sodium for hypertension, sugar for diabetes)."
        if has_current else "User has no current conditions. Write 1–2 sentences of general health advice for this food."
    )
    concerned_ins = (
        "Write a short condition-based summary: for each condition they are concerned about, what should they watch or reduce with this food? Prevention-focused."
        if has_concerned else "No specific concerns. Write 1–2 sentences of brief preventive tips for this food."
    )
    return f"""You are a nutrition expert. Analyze this food image. Use plain text only. No markdown, asterisks, or bold.

USER'S MEDICAL PROFILE:
- Current medical condition: {current_conditions}
- Concerned conditions: {concerned_conditions}

Respond with exactly these parts. Use the exact headers below.

---
DISH:
First line only: name the food/dish in the image in a short, clear way (e.g. "Grilled chicken salad", "Margherita pizza", "Bowl of oatmeal with berries"). One line, no period.

---
KEY METRICS:
Give one short line with estimated values, in this format (use | as separator):
Calories: X-X kcal | Protein: Xg | Carbs: Xg | Fat: Xg | Fiber: Xg | Sugar: Xg | Sodium: Xmg
Example: Calories: 400-500 kcal | Protein: 25g | Carbs: 45g | Fat: 15g | Fiber: 5g | Sugar: 12g | Sodium: 800mg

---
CURRENT CONDITION SUMMARY:
{current_ins}
Give 2–4 bullet points. One point per line. No asterisks, no bold.

---
CONCERNED CONDITION SUMMARY:
{concerned_ins}
Give 2–4 bullet points. One point per line. No asterisks, no numbers, no bold.

---
Optional: one line "Health score: X/10" somewhere if you want."""


@app.get("/")
def root():
    return {"message": "NutriMedAI API", "status": "ok"}


@app.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    current_conditions: str = Form("No current medical conditions"),
    concerned_conditions: str = Form("None specified"),
    user_description: Optional[str] = Form(""),
):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured. Set OPENAI_API_KEY.")
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (jpg, png, webp).")

    contents = await file.read()
    img_base64 = base64.b64encode(contents).decode()

    has_current = current_conditions and "no current" not in current_conditions.lower() and "none" not in current_conditions.lower()
    has_concerned = concerned_conditions and "none" not in concerned_conditions.lower()
    prompt = build_prompt(current_conditions, concerned_conditions, has_current, has_concerned)

    if user_description and user_description.strip():
        prompt = f"""USER'S DESCRIPTION OR QUESTION:
"{user_description.strip()}"

---
Use the above to tailor your analysis. Then provide the full assessment below.

{prompt}"""

    client = OpenAI(api_key=OPENAI_API_KEY)
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_base64}"}},
                ],
            }
        ],
        max_tokens=1500,
    )
    result = response.choices[0].message.content
    return {"analysis": result}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
