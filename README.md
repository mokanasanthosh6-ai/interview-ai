# InterviewMate AI – Your Personal AI Interview Coach

An AI-powered mock interview platform built with React, TypeScript, Express, Tailwind CSS, and the Google Gemini AI SDK (`@google/genai`).

## Features

1. **Candidate Setup & Validation**: Enter student name, select a target job role (`Python Developer`, `Java Developer`, `Web Developer`, `Data Analyst`, `AI Engineer`, or a custom role), and choose an experience level (`Fresher` or `Experienced`).
2. **Dynamic 5-Question Generation**: Uses Google Gemini on the server side to generate 5 unique Technical and HR questions tailored to the candidate's job role and experience level.
3. **Real-Time Answer Evaluation**: Evaluates each submitted answer with a strict scoring rubric (0–10), scoring rationale, strengths, missing points, improvement suggestions, and a realistic sample improved answer without fabricated achievements.
4. **Final Performance Report**: Calculates total score out of 50, average score out of 10, readiness tier, overall strengths, improvement areas, and personalized future recommendations.

## Project Structure

```text
├── api/                       # Vercel Serverless Functions (/api/health, /api/interview/*)
├── server.ts                  # Express server + Vite middleware (local / full-stack dev)
├── server/
│   ├── gemini.ts              # Server-side @google/genai client & structured JSON prompts
│   └── interviewHandlers.ts   # Shared validation & route handlers (Express + Vercel)
├── src/
│   ├── App.tsx                # Main state flow (setup -> interview -> report)
│   ├── types/interview.ts     # Shared TypeScript interfaces
│   ├── services/interviewApi.ts # Client-side fetch wrappers for /api/interview/*
│   └── components/
│       ├── BrandLogo.tsx
│       ├── WelcomeSetup.tsx
│       ├── InterviewWorkspace.tsx
│       ├── EvaluationPanel.tsx
│       └── ResultsDashboard.tsx
├── vercel.json                # Vercel build output, function timeout, and SPA rewrites
├── index.html
└── package.json
```

## Running the Project Locally

### Prerequisites
- Node.js 20+ (tested on Node 22)
- A Google Gemini API key

### Setup & Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure your environment variable (create a `.env` file in the project root):
   ```env
   GEMINI_API_KEY="your_actual_gemini_api_key"
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. Build and run in production mode:
   ```bash
   npm run build
   npm start
   ```

## Deploying to Vercel

This project is preconfigured for Vercel (`vercel.json` + `/api/*.ts` serverless functions).

### Option 1: Deploy via GitHub + Vercel Dashboard (Recommended)
1. Export or push this repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repository.
3. Keep the default **Build Command** (`npm run build`) and **Output Directory** (`dist`) from `vercel.json`.
4. Under **Environment Variables**, add:
   - Name: `GEMINI_API_KEY`
   - Value: your Gemini API key
5. Click **Deploy**.

### Option 2: Deploy via Vercel CLI
1. Export/download the project ZIP and extract it locally.
2. Install Vercel CLI and deploy:
   ```bash
   npm install
   npx vercel
   ```
3. Add your Gemini API key to Vercel and redeploy to production:
   ```bash
   npx vercel env add GEMINI_API_KEY
   npx vercel --prod
   ```

## Exporting the Source Code

- In Google AI Studio, use the **Download / Export** option in the top toolbar to download the project as a ZIP archive (or push directly to GitHub).
- Extract the archive locally, create a `.env` file with your `GEMINI_API_KEY`, run `npm install`, and run `npm run dev`.
