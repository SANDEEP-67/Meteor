# Deploying Meteor on Vercel 🚀

**Yes! You can deploy BOTH frontend and backend at the same time in ONE single Vercel project**, or as two separate projects if you prefer.

---

## Option 1: Deploy Both at the Same Time in ONE Project (Easiest & Recommended)

This repository is pre-configured with a root `vercel.json`, `api/index.js`, and npm workspaces. When deployed together:
- Both Frontend and Backend share the **exact same URL** (e.g. `https://your-app.vercel.app`).
- **Zero CORS issues** because both run under the same origin.
- No need to configure `VITE_API_URL` — the frontend automatically routes `/api/...` to the backend.

### Steps to Deploy Together:
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..."** → **"Project"**.
2. Select your `Meteor` repository.
3. Keep the **Root Directory** as `./` (do not change it).
4. Vercel automatically detects the build command (`npm run build`) and output directory (`frontend-meteor/dist`).
5. Under **Environment Variables**, add:
   - `MONGO_URI`: Your MongoDB Atlas connection string (or use the one in `.env.example`).
   - `JWT_SECRET`: A secure secret string (e.g. `meteor_production_jwt_secret_123`).
6. Click **Deploy**.
7. Both your frontend UI and backend API are live under a single URL!

---

## Option 2: Deploy as Two Separate Vercel Projects (Alternative)

If you prefer two separate Vercel projects (e.g. `meteor-frontend.vercel.app` and `meteor-backend.vercel.app`):

### 1. Backend Project:
- Import `Meteor` repo.
- Set **Root Directory** to `backend-meteor`.
- Add environment variables: `MONGO_URI` and `JWT_SECRET`.
- Deploy and copy the URL (e.g. `https://meteor-backend.vercel.app`).

### 2. Frontend Project:
- Import `Meteor` repo again.
- Set **Root Directory** to `frontend-meteor`.
- Add environment variable `VITE_API_URL` set to the backend URL above.
- Deploy.

---

## Local Development

To run locally on your computer:

```bash
# Start Backend (runs on http://localhost:8080 with WebSockets)
npm run dev:backend

# Start Frontend in another terminal (runs on http://localhost:5173)
npm run dev:frontend
```
