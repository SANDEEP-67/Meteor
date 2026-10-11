# Deploying Meteor on Vercel 🚀

This repository is optimized for hosting on **Vercel**. You can deploy both the frontend and backend in just a few minutes.

---

## Architecture Overview

- **Frontend (`frontend-meteor`)**: React + Vite SPA. Built to static HTML/JS/CSS with client-side SPA routing (`vercel.json` rewrites).
- **Backend (`backend-meteor`)**: Node.js + Express API. Optimized for Vercel Serverless Functions (`api/index.js` + `vercel.json`), with connection pooling for MongoDB and fallback polling for chat messages.

---

## Option 1: Deploying as Two Vercel Projects (Recommended)

This is the standard and cleanest way to deploy a decoupled Vite + Express application on Vercel.

### Step 1: Deploy Backend (`backend-meteor`)
1. In your [Vercel Dashboard](https://vercel.com/dashboard), click **"Add New..."** → **"Project"**.
2. Select your `Meteor` repository.
3. In the project configuration:
   - **Project Name**: `meteor-backend` (or your choice)
   - **Root Directory**: Click *Edit* and select **`backend-meteor`**
4. Under **Environment Variables**, add:
   - `MONGO_URI`: Your MongoDB Atlas connection string (or use the existing default).
   - `JWT_SECRET`: A secure random string (e.g. `meteor_production_secret_key_99`).
   - `FRONTEND_URLS`: (Optional) Comma-separated allowed URLs. *Note: All `*.vercel.app` domains are already automatically allowed by default.*
5. Click **Deploy**.
6. Note down your backend URL (e.g., `https://meteor-backend.vercel.app`).

---

### Step 2: Deploy Frontend (`frontend-meteor`)
1. In the Vercel Dashboard, click **"Add New..."** → **"Project"**.
2. Select the same `Meteor` repository again.
3. In the project configuration:
   - **Project Name**: `meteor-frontend` (or your choice)
   - **Root Directory**: Click *Edit* and select **`frontend-meteor`**
   - **Framework Preset**: Vite (detected automatically)
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: The URL of your deployed backend from Step 1 (e.g., `https://meteor-backend.vercel.app` without trailing slash).
5. Click **Deploy**.
6. Your Meteor chat app is live!

---

## Option 2: Deploying from Monorepo Root

If you deploy the repository root directly to Vercel:
- Vercel will run `npm run build` from the root, which runs `npm --prefix frontend-meteor run build` and outputs the frontend bundle.
- Configure `VITE_API_URL` in project settings to point to your backend.

---

## Local Development

To run locally on your computer:

```bash
# 1. Start the Backend (Runs on http://localhost:8080 with WebSockets)
npm run dev:backend

# 2. In another terminal, start the Frontend (Runs on http://localhost:5173)
npm run dev:frontend
```
