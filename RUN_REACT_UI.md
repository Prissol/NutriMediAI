# Run NutriMedAI React UI

## 0. Configure OpenAI API key

**Option A – use a .env file (recommended)**

1. In the `backend` folder, copy the example env file:
   - **Windows:** `copy .env.example .env`
   - **Mac/Linux:** `cp .env.example .env`
2. Open `backend\.env` and set your key:
   ```
   OPENAI_API_KEY=sk-your-actual-key-here
   ```
3. Save the file. The backend will load it automatically. Do not commit `.env`.

**Option B – set in terminal before starting backend**

- **Windows:** `set OPENAI_API_KEY=sk-your-key-here`
- **Mac/Linux:** `export OPENAI_API_KEY=sk-your-key-here`

Get a key at: https://platform.openai.com/api-keys

## 1. Backend (API)

Open a terminal:

```bash
cd C:\Users\user\Desktop\NutriMedAI\backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Leave this running. API will be at http://localhost:8000

## 2. Frontend (React UI)

Open another terminal:

```bash
cd C:\Users\user\Desktop\NutriMedAI\frontend
npm install
npm run dev
```

Browser will open at http://localhost:5173

## 3. Use the app

- Set **Medical profile** (Current / Concerned conditions) with the purple chips.
- **Upload** a food image (tap the upload area).
- Optionally type **Describe or ask** (e.g. "This is biryani. Is it okay for diabetes?").
- Click **Analyze**.
- Read **Insights** in the same view (minimal scroll).

## Theme

- iOS-inspired transparent (glass) panels.
- Purplish shade (blur + purple tint).
- Compact layout so you don’t need to scroll much.
- React 18 + Vite + TypeScript + Tailwind (latest stack).

## If API key is not set

1. Create `backend\.env` from `backend\.env.example` and add: `OPENAI_API_KEY=sk-...`
2. Restart the backend (stop uvicorn, then run it again).
