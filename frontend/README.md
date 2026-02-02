# NutriMedAI – React UI

iOS-style transparent theme with a purplish shade. Built with React 18, Vite, TypeScript, and Tailwind.

## Run (with backend)

1. **Backend** (from project root):
   ```bash
   cd backend
   pip install -r requirements.txt
   set OPENAI_API_KEY=sk-your-key
   uvicorn main:app --reload --port 8000
   ```

2. **Frontend** (from project root):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. Open **http://localhost:5173**. The app talks to the API at `http://localhost:8000` (Vite proxy in dev).

## Build for production

```bash
cd frontend
npm run build
```
Output is in `dist/`. Serve it with any static host. Point the app to your API URL (e.g. set in env or config).

## Tech

- React 18
- Vite 5
- TypeScript
- Tailwind CSS
- iOS-inspired glassmorphism, purple tint, compact layout
