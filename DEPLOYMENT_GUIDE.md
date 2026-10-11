# Deployment Guide: Render (Backend) + Vercel (Frontend) + FastCron 🚀

This guide walks you through hosting:
1. **Backend** on **Render** (Node.js + WebSockets / Socket.io)
2. **Cron Ping** on **FastCron** to hit `/health` and keep Render awake 24/7
3. **Frontend** on **Vercel** (Vite + React)

---

## Part 1: Deploy Backend on Render

1. Go to [dashboard.render.com](https://dashboard.render.com/) and click **"New +"** → **"Web Service"**.
2. Connect your GitHub repository: `SANDEEP-67/Meteor`.
3. Configure the Web Service settings:
   * **Name**: `meteor-backend` (or your choice)
   * **Region**: Choose the region closest to you (e.g. Frankfurt, Oregon, Singapore)
   * **Root Directory**: **`backend-meteor`** *(Important!)*
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start` (or `node server.js`)
   * **Instance Type**: `Free`
4. Under **Environment Variables**, add:
   * `MONGO_URI`: Your MongoDB Atlas connection string
   * `JWT_SECRET`: Any secret string (e.g. `meteor_production_secret_key_123`)
5. Click **"Deploy Web Service"**.
6. Once deployed, copy your backend URL:
   * Example: `https://meteor-backend-xxxx.onrender.com`

---

## Part 2: Keep Render Awake 24/7 with FastCron

Render free tier services spin down after 15 minutes of inactivity. Use **FastCron** to ping the health endpoint so your backend stays warm 24/7 with zero cold starts!

1. Go to [fastcron.com](https://www.fastcron.com/) and create a free account (or log in).
2. Click **"Create Cron Job"**.
3. Fill in the details:
   * **URL to call**: `https://your-backend.onrender.com/health` (replace with your Render URL)
   * **When to execute**: Every **10 minutes** (e.g. `*/10 * * * *`)
   * **HTTP Method**: `GET`
4. Click **"Save"**.
5. FastCron will now ping `/health` every 10 minutes, keeping your server awake 24/7!

---

## Part 3: Deploy Frontend on Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard) and click **"Add New..."** → **"Project"**.
2. Select your `Meteor` repository.
3. Configure the project:
   * **Project Name**: `meteor-frontend` (or your choice)
   * **Root Directory**: Click *Edit* and select **`frontend-meteor`** *(Important!)*
   * **Framework Preset**: `Vite` (detected automatically)
4. Under **Environment Variables**, add:
   * **Key**: `VITE_API_URL`
   * **Value**: Your Render Backend URL from Part 1 *(e.g. `https://meteor-backend-xxxx.onrender.com` without trailing slash)*
5. Click **"Deploy"**.
6. Your chat app frontend is now live on Vercel with real-time Socket.io connected to Render!

---

## Summary of URLs & Endpoints
* **Backend Health Check**: `https://your-backend.onrender.com/health`
* **Backend API Base**: `https://your-backend.onrender.com/api`
* **Frontend App**: `https://your-frontend.vercel.app`
