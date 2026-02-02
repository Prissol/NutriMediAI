# NutriMedAI

AI-powered nutrition analysis for food images. Set your medical profile, upload a photo, and get personalized insights (key metrics, condition summaries, PDF report) powered by OpenAI GPT-4 Vision.

## Stack

- **Frontend:** React (Vite) + TypeScript + Tailwind CSS
- **Backend:** FastAPI + OpenAI GPT-4 Vision API

## Quick start

1. **API key** – In `backend`, copy `.env.example` to `.env` and set `OPENAI_API_KEY=sk-...`  
   Get a key: https://platform.openai.com/api-keys

2. **Backend**
   ```cmd
   cd backend
   python -m pip install -r requirements.txt
   python -m uvicorn main:app --reload --port 8000
   ```

3. **Frontend** (new terminal)
   ```cmd
   cd frontend
   npm install
   npm run dev
   ```

4. Open **http://localhost:5173** – set medical profile, upload a food image, then **Analyze food**.

See **RUN_REACT_UI.md** for detailed setup and **TECHNICAL_ARCHITECTURE.md** for design.

## Features

- Medical profile (current conditions, conditions to monitor)
- Food image upload + optional description
- Nutrition score, key metrics (calories, protein, carbs, etc.)
- Current & concerned condition summaries (petal-style infographic)
- Identified dish name from the image
- Download report as PDF (with food thumbnail and infographic layout)

## Project layout

```
NutriMedAI/
├── backend/          # FastAPI API (main.py)
├── frontend/         # React app (Vite + Tailwind)
├── RUN_REACT_UI.md   # Setup & run instructions
└── TECHNICAL_ARCHITECTURE.md
```

## License

NutriMedAI project.
