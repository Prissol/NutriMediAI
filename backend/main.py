"""
NutriMedAI Backend API
FastAPI server for food image analysis (OpenAI GPT-4 Vision) + user auth and per-user analyses.
"""

import os
import base64
import sqlite3
import uuid
from pathlib import Path
from datetime import datetime, timedelta
from contextlib import contextmanager
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
from openai import OpenAI
from jose import JWTError, jwt
from passlib.context import CryptContext

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

_cors_origins = [
    "http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173",
    "https://nutri-medi-ai.vercel.app",  # production frontend on Vercel
]
if os.environ.get("CORS_ORIGINS"):
    _cors_origins.extend(o.strip() for o in os.environ["CORS_ORIGINS"].split(",") if o.strip())
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=r"^https://[a-zA-Z0-9-]+\.vercel\.app$",  # any Vercel deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()

# Auth & DB
DB_PATH = Path(__file__).resolve().parent / "data" / "nutrimedai.db"
SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-production-use-env")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)


def _ensure_db_dir():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)


@contextmanager
def get_db():
    _ensure_db_dir()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS analyses (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                dish_name TEXT NOT NULL,
                analysis_text TEXT NOT NULL,
                preview TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        conn.commit()
        yield conn
    finally:
        conn.close()


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def get_current_user_id(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[str]:
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if payload is None:
        return None
    return payload.get("sub")


def require_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> str:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token")
    return sub


CONDITION_OPTIONS = [
    "Diabetes", "Hypertension (High BP)", "Heart disease", "Kidney disease",
    "Obesity / Weight management", "Celiac disease", "Lactose intolerance",
    "GERD / Acid reflux", "High cholesterol", "Thyroid disorder",
    "None / No current conditions",
]


def build_prompt(current_conditions: str, concerned_conditions: str, has_current: bool, has_concerned: bool) -> str:
    current_ins = (
        "For the user's current condition(s), include: (1) REASONING: why this food is problematic or beneficial. (2) If NOT ideal: what they can do to make it safer (use action verbs: Use less sauce, Stick to one fillet, Skip the salt). Add portion when relevant (e.g. Stick to 1 small portion). (3) If good: what specifically is good for their condition. For serious conditions (heart disease, kidney disease, diabetes on medication), if the food is high-impact add one point starting with [Ask your doctor]. Mark the single most critical point with [Important] at the start. One idea per point."
        if has_current else "User has no current conditions. Write 1–2 sentences of general health advice for this food."
    )
    concerned_ins = (
        "For prevention: (1) REASONING: why this food could be a concern or why it's okay. (2) If concerns: what to do (action verbs: Use less sauce, Choose grilled not fried). Add portion when relevant. (3) If good for prevention: what helps. Add [Ask your doctor] for high-impact cases when relevant. Mark the most critical point with [Important]. One idea per point."
        if has_concerned else "No specific concerns. Write 1–2 sentences of brief preventive tips for this food."
    )
    return f"""You are a nutrition expert. Analyze this food image. Use plain text only. No markdown, asterisks, or bold.

USER'S MEDICAL PROFILE:
- Current medical condition: {current_conditions}
- Concerned conditions: {concerned_conditions}

Respond with exactly these parts. Use the exact headers below.

---
DISH:
First line only: name the food/dish in the image in a short, clear way (e.g. "Grilled chicken salad", "Margherita pizza"). One line, no period.

---
FOOD SUMMARY:
One to two sentences describing this food overall: main ingredients, portion sense, and a brief takeaway. Max two lines.

---
KEY METRICS:
One short line, this format (use | as separator):
Calories: X-X kcal | Protein: Xg | Carbs: Xg | Fat: Xg | Fiber: Xg | Sugar: Xg | Sodium: Xmg

---
CURRENT CONDITION SUMMARY:
{current_ins}
First block = TL;DR (ingredient-wise): For each main ingredient or component of the dish (e.g. rice, meat, sauce, spices, vegetables), give one short line: ingredient name followed by takeaway for their condition (e.g. "Rice: okay in moderate portion." "Sauce: high sodium – use less." "Chicken: good protein."). One line per ingredient, 3–6 lines total. Then 3–6 detailed points. Prefix each of those with exactly one of: [Reasoning] [Action] [Benefit] [Ask your doctor] [Important]. One idea per point. No asterisks, no bold.

---
CONCERNED CONDITION SUMMARY:
{concerned_ins}
First block = TL;DR (ingredient-wise): Same format – one line per main ingredient with takeaway for prevention (e.g. "Oil: moderate; choose less if possible." "Fish: beneficial."). 3–6 lines. Then 3–6 detailed points with prefixes [Reasoning] [Action] [Benefit] [Ask your doctor] [Important]. No asterisks, no bold.

---
ALTERNATIVES:
1–2 short suggestions for a similar but safer option. One per line. Examples: "Grilled instead of fried." "Request sauce on the side." "Try half portion with a side salad."

---
Optional: one line "Health score: X/10" somewhere if you want."""


@app.get("/")
def root():
    return {"message": "NutriMedAI API", "status": "ok"}


# ----- Auth & user dashboard (per-user analyses) -----
class RegisterBody(BaseModel):
    email: str
    password: str


class LoginBody(BaseModel):
    email: str
    password: str


class AnalysisCreate(BaseModel):
    dish_name: str
    analysis: str
    preview: Optional[str] = None


class AnalysisPatch(BaseModel):
    dish_name: Optional[str] = None


@app.post("/auth/register")
def register(body: RegisterBody):
    email = body.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email required")
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    user_id = str(uuid.uuid4())
    password_hash = pwd_context.hash(body.password)
    created = datetime.utcnow().isoformat()
    with get_db() as conn:
        try:
            conn.execute(
                "INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
                (user_id, email, password_hash, created),
            )
            conn.commit()
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=400, detail="Email already registered")
    token = create_access_token({"sub": user_id})
    return {"access_token": token, "user": {"id": user_id, "email": email}}


@app.post("/auth/login")
def login(body: LoginBody):
    email = body.email.strip().lower()
    with get_db() as conn:
        row = conn.execute(
            "SELECT id, password_hash FROM users WHERE email = ?", (email,)
        ).fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user_id = row["id"]
    if not pwd_context.verify(body.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": user_id})
    return {"access_token": token, "user": {"id": user_id, "email": email}}


@app.get("/auth/me")
def auth_me(user_id: str = Depends(require_user)):
    with get_db() as conn:
        row = conn.execute("SELECT id, email FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="User not found")
    return {"id": row["id"], "email": row["email"]}


@app.get("/analyses", response_model=List[dict])
def list_analyses(user_id: str = Depends(require_user)):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, dish_name, analysis_text, preview, created_at FROM analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
            (user_id,),
        ).fetchall()
    return [
        {
            "id": r["id"],
            "dishName": r["dish_name"],
            "analysis": r["analysis_text"],
            "preview": r["preview"],
            "date": r["created_at"],
        }
        for r in rows
    ]


@app.post("/analyses")
def create_analysis(body: AnalysisCreate, user_id: str = Depends(require_user)):
    aid = str(uuid.uuid4())
    created = datetime.utcnow().isoformat()
    with get_db() as conn:
        conn.execute(
            "INSERT INTO analyses (id, user_id, dish_name, analysis_text, preview, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (aid, user_id, body.dish_name, body.analysis, body.preview, created),
        )
        conn.commit()
    return {"id": aid, "dishName": body.dish_name, "analysis": body.analysis, "preview": body.preview, "date": created}


@app.delete("/analyses/{analysis_id}")
def delete_analysis(analysis_id: str, user_id: str = Depends(require_user)):
    with get_db() as conn:
        cur = conn.execute("DELETE FROM analyses WHERE id = ? AND user_id = ?", (analysis_id, user_id))
        conn.commit()
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {"ok": True}


@app.patch("/analyses/{analysis_id}")
def patch_analysis(analysis_id: str, body: AnalysisPatch, user_id: str = Depends(require_user)):
    if body.dish_name is None:
        return {"ok": True}
    with get_db() as conn:
        cur = conn.execute(
            "UPDATE analyses SET dish_name = ? WHERE id = ? AND user_id = ?",
            (body.dish_name.strip(), analysis_id, user_id),
        )
        conn.commit()
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {"ok": True}


@app.delete("/analyses")
def delete_all_analyses(user_id: str = Depends(require_user)):
    with get_db() as conn:
        conn.execute("DELETE FROM analyses WHERE user_id = ?", (user_id,))
        conn.commit()
    return {"ok": True}


# ----- Analyze (no auth required; frontend can call with or without user) -----
@app.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    current_conditions: str = Form("No current medical conditions"),
    concerned_conditions: str = Form("None specified"),
    user_description: Optional[str] = Form(""),
):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured. Set OPENAI_API_KEY.")
    # OpenAI accepts only png, jpeg, gif, webp
    allowed_types = {"image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"}
    ct = (file.content_type or "").strip().lower()
    if ct not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Image must be PNG, JPEG, GIF, or WebP. Other formats (e.g. HEIC) are not supported.",
        )

    contents = await file.read()
    img_base64 = base64.b64encode(contents).decode()
    # Use correct MIME type in data URL (OpenAI rejects wrong type)
    mime = "image/jpeg" if ct == "image/jpg" else ct

    has_current = current_conditions and "no current" not in current_conditions.lower() and "none" not in current_conditions.lower()
    has_concerned = concerned_conditions and "none" not in concerned_conditions.lower()
    prompt = build_prompt(current_conditions, concerned_conditions, has_current, has_concerned)

    if user_description and user_description.strip():
        prompt = f"""USER'S DESCRIPTION OR QUESTION:
"{user_description.strip()}"

---
Use the above to tailor your analysis. Then provide the full assessment below.

{prompt}"""

    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{img_base64}"}},
                    ],
                }
            ],
            max_tokens=1500,
        )
        result = response.choices[0].message.content
        return {"analysis": result}
    except Exception as e:
        err_msg = str(e)
        if "api_key" in err_msg.lower() or "authentication" in err_msg.lower():
            raise HTTPException(status_code=500, detail="OpenAI API key invalid or missing. Check OPENAI_API_KEY.")
        if "rate" in err_msg.lower() or "quota" in err_msg.lower():
            raise HTTPException(status_code=429, detail="OpenAI rate limit or quota exceeded. Try again later.")
        raise HTTPException(status_code=502, detail=f"OpenAI API error: {err_msg[:200]}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
