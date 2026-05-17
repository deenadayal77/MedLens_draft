# MedLens

MedLens is an AI-powered medical report assistant that helps users understand radiology and clinical PDF reports in plain language. It extracts report text, summarizes key findings, estimates urgency, supports follow-up questions grounded in the report, translates summaries, generates speech audio, and can create emergency-card style information from analyzed reports.

> MedLens is an assistance tool only. It does not diagnose, prescribe, or replace advice from a qualified medical professional.

## Features

- Upload PDF medical reports and extract text with PyMuPDF
- Generate patient-friendly summaries using Gemini
- Classify urgency with confidence and rule-based overrides
- Ask report-grounded follow-up questions through chat
- Translate summaries into supported languages
- Convert summary text to MP3 audio with text-to-speech
- Verify previously analyzed report hashes
- Generate emergency health-card data from report context
- Use a responsive React, Vite, and Tailwind frontend
- Run an optional Tampermonkey helper for analyzing PDF links in the browser
- Keep the original Streamlit implementation in `medlens_app/`

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Zustand, Axios, Framer Motion
- Backend: FastAPI, Pydantic, Uvicorn
- AI and processing: Gemini, LangChain, ChromaDB, PyMuPDF
- Utilities: deep-translator, gTTS, python-dotenv
- Deployment: Railway for backend, Vercel for frontend

## Project Structure

```text
.
|-- backend/          FastAPI API, routers, AI pipeline, session store
|-- frontend/         React + Vite + Tailwind dashboard
|-- medlens_app/      Original Streamlit app
|-- tampermonkey/     Browser userscript helper
|-- railway.json      Railway backend deployment config
|-- vercel.json       Root deployment helper config
`-- README.md
```

## API Overview

The FastAPI backend exposes these main endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Backend health check |
| `POST` | `/api/analyze` | Upload a PDF and receive summary, urgency, hash, and session ID |
| `POST` | `/api/analyze-text` | Analyze raw report text |
| `POST` | `/api/chat` | Ask follow-up questions for an analyzed report session |
| `POST` | `/api/translate` | Translate summary text |
| `POST` | `/api/tts` | Stream generated MP3 audio |
| `POST` | `/api/verify` | Verify whether a report hash was analyzed |
| `POST` | `/api/emergency-card` | Generate structured emergency health-card data |

## Environment Variables

Create a backend environment file:

```powershell
cd backend
copy .env.example .env
```

Set your Gemini key and model settings in `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
MEDLENS_GEMINI_MODEL=gemini-2.5-flash
MEDLENS_GEMINI_CHAT_MODEL=gemini-2.5-flash
MEDLENS_GEMINI_EMBEDDING_MODEL=models/gemini-embedding-001
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Create a frontend environment file:

```powershell
cd frontend
copy .env.example .env
```

For local development, keep:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Real `.env` files are ignored by Git so API keys and local secrets are not committed.

## Backend Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Health check:

```powershell
curl http://127.0.0.1:8000/health
```

Expected response:

```json
{"status":"ok"}
```

## Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

Open the app at:

```text
http://127.0.0.1:5173
```

Production build:

```powershell
npm run build
```

## Original Streamlit App

The repository also includes the earlier Streamlit implementation:

```powershell
pip install -r requirements.txt
streamlit run app.py
```

## Tampermonkey Helper

1. Install the Tampermonkey browser extension.
2. Create a new userscript.
3. Paste the contents of `tampermonkey/medlens_extension.user.js`.
4. Keep the backend running on port `8000`.
5. Open a page with a PDF link and use the MedLens floating action.

## Deployment

### Backend on Railway

Deploy the repository root to Railway. Railway uses `railway.json` and the root `requirements.txt` to install backend dependencies and run:

```bash
uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

Set these Railway variables:

```env
GEMINI_API_KEY=your_gemini_api_key_here
MEDLENS_GEMINI_MODEL=gemini-2.5-flash
MEDLENS_GEMINI_CHAT_MODEL=gemini-2.5-flash
MEDLENS_GEMINI_EMBEDDING_MODEL=models/gemini-embedding-001
CORS_ORIGINS=https://your-vercel-app.vercel.app
```

After deployment, test:

```text
https://your-railway-backend.up.railway.app/health
```

### Frontend on Vercel

Create the Vercel project from the same GitHub repository and set the project root to:

```text
frontend
```

Use these settings:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

Set this Vercel environment variable:

```env
VITE_API_BASE_URL=https://your-railway-backend.up.railway.app/api
```

After Vercel gives you the frontend URL, add that exact URL to Railway `CORS_ORIGINS`.

## Safety

MedLens generates AI-assisted explanations from medical reports. Users should confirm findings and next steps with a licensed clinician, especially for urgent, severe, unclear, or worsening symptoms.
