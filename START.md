# How to Start NutriMedAI

## Backend (FastAPI)

From the **project root**:

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Or in one line from project root:

```bash
cd backend && pip install -r requirements.txt && python -m uvicorn main:app --reload --port 8000
```

- Backend runs at: **http://localhost:8000**
- API docs: **http://localhost:8000/docs**

---

## Frontend (Vite + React)

From the **project root**:

```bash
cd frontend
npm install
npm run dev
```

Or in one line from project root:

```bash
cd frontend && npm install && npm run dev
```

- Frontend runs at: **http://localhost:5173**
- It proxies `/api` to the backend when both are running.

---

## Run both (two terminals)

**Terminal 1 – Backend:**

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

**Terminal 2 – Frontend:**

```bash
cd frontend
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## Environment

- **Backend:** Copy `backend/.env.example` to `backend/.env` and set:
  - `OPENAI_API_KEY` – your OpenAI API key
  - `SECRET_KEY` – long random string (for user auth, production only)
- **Frontend:** No `.env` required for local dev (uses `/api` proxy to backend).
