# TAXA Sovereign Workspace: GitHub & Web Deployment Guide

This guide outlines exactly how to upload your sovereign **TAXA** workspace to GitHub, deploy the frontend and backend to the web for **free**, configure a dynamic database, and access it across any mobile, tablet, or desktop device.

---

## 🐙 Part 1: Putting Your Project on GitHub

We have already initialized a local Git repository in your root `OmniMind` folder and committed all changes securely. None of your local credentials, SQLite database files, or temporary cache files will be uploaded, keeping your secrets perfectly secure.

To push this repository to GitHub under your account `https://github.com/PranavBhosale26`:

1. **Log in to GitHub**: Go to [github.com](https://github.com/PranavBhosale26) and log in.
2. **Create a New Repository**:
   - Click the **New** button (or go to `github.com/new`).
   - Name your repository (e.g., `TAXA`).
   - Keep it **Private** (recommended to keep your work private) or **Public**.
   - **Do NOT** check "Add a README", "Add .gitignore", or "Choose a license" (we already have these configured).
   - Click **Create repository**.
3. **Link Your Local Code to GitHub**:
   - Open your Mac terminal, navigate to the `OmniMind` directory, and run:
     ```bash
     # Add the remote repository url
     git remote add origin https://github.com/PranavBhosale26/TAXA.git
     
     # Rename the default branch to main
     git branch -M main
     
     # Push your code to GitHub
     git push -u origin main
     ```
   - *Note: If you have configured a different name for the repository, replace `TAXA` with your repository name.*

---

## 🔄 Part 2: Automatic Deployments & Free SSL/TLS

We have configured a GitHub Actions workflow in `.github/workflows/deploy.yml` which automatically tests your backend and frontend compile builds on every git push to GitHub!

To make your web app launch on the internet with **automatic redeploys whenever you push changes** and **100% free SSL/TLS security certificates** (so the green lock icon shows and your Voice Assistant microphone works flawlessly), link Vercel and Render:

### 1. Frontend (Next.js) -> Deploy on **Vercel** (100% Free)
Vercel is the creator of Next.js and offers a massive, lightning-fast free hosting tier that redeploys automatically whenever you push changes to GitHub.
- Go to [vercel.com](https://vercel.com) and sign up using your GitHub account.
- Click **Add New** -> **Project**.
- Import your `TAXA` repository.
- Under **Root Directory**, click edit and select **`frontend`**.
- Under **Environment Variables**, add:
  - `NEXT_PUBLIC_API_URL` = `https://your-backend-url.onrender.com` *(You will get this from the backend step below)*.
- Click **Deploy**. Vercel will build and launch your responsive landing and chat workspace in under a minute!
- **Auto-Update**: Any time you commit and push new code to GitHub, Vercel will automatically trigger a new deployment in the background and update the site instantly!

### 2. Backend (FastAPI + LangGraph) -> Deploy on **Render** (100% Free)
Render offers a generous free tier for web applications that handles Python/Uvicorn servers effortlessly.
- Go to [dashboard.render.com](https://dashboard.render.com) and sign up using GitHub.
- Click **New** -> **Web Service**.
- Select your `TAXA` repository.
- Configure the Web Service:
  - **Name**: `taxa-backend`
  - **Root Directory**: `backend`
  - **Runtime**: `Python 3`
  - **Build Command**: `pip install -r requirements.txt`
  - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
  - **Instance Type**: Select **Free**.
- Under **Environment Variables**, add your keys:
  - `OPENROUTER_API_KEY` = `your_actual_openrouter_api_key`
  - `DATABASE_URL` = `postgresql://your-neon-or-supabase-uri` *(See Database section below for persistent cloud db)*
  - `ALLOWED_USERS` = `pranav,Pranav`
- Click **Create Web Service**. Once active, copy the Render URL (e.g., `https://taxa-backend.onrender.com`) and paste it into your Vercel frontend environment variable `NEXT_PUBLIC_API_URL`!
- **Auto-Update**: Whenever you make changes and push them to your repository on GitHub, Render will automatically detect the push, rebuild your backend project, and redeploy it seamlessly without any downtime!

---

## 💾 Part 3: Persistent Database Storage (Free Cloud Postgres)

Render's free tier resets local files on restart, meaning the SQLite database `/backend/omnimind.db` gets wiped. To keep all your users, session history, and **dynamic self-training memory profiles** permanently secured in the cloud:

1. **Get a Free Postgres DB**: Go to [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com) and sign up.
2. **Create a Database**: Spin up a free database instance.
3. **Copy Connection URI**: Copy the connection string (URI) provided. It will look like:
   `postgresql://alex:password@ep-cool-water-12345.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. **Link to Render**: In your Render dashboard, edit your backend service environment variables and set `DATABASE_URL` to this URI.
5. **Auto Migration**: FastAPI and SQLAlchemy will detect the PostgreSQL database and automatically migrate all tables (`users`, `sessions`, `messages`, and `user_memory`) upon boot! No manual SQL commands required.

---

## 🧠 Part 4: Dynamic Self-Training Memory Profiles

We have built a state-of-the-art **dynamic memory system** into TAXA. Here is how it functions:
- **No Latency**: Memory summarization runs completely in the background via FastAPI's `BackgroundTasks`, meaning the chat response is returned to you instantly without any speed bottleneck.
- **Teaches Itself**: After each response, a background model reads the user's latest query, extracts names, favorite languages, tech stack preferences, hobbies, and style of speaking, and merges them into a highly compact profile (capped at 10 items).
- **Persistent & Session-Independent**: This profile is saved directly in the `user_memory` database table. Whenever you start a new conversation or log in from a different device, the bot loads this memory and injects it into its system prompt, remembering you perfectly!

---

## 📱 Part 5: Responsive Multi-Device Design & Local Security

* **Responsive Layouts**: Designed using mobile-first Tailwind constraints. The dashboard sidebar collapses into gesture-sensitive overlays on tablets and mobiles, making it fully usable on your iPhone, iPad, or Android device.
* **Microphone Access locally**: If you want to test the voice capabilities on your mobile phone or local network without deploying to HTTPS first, you can use the secure tunnel:
  ```bash
  # Start a secure HTTPS tunnel to your Next.js frontend port
  npx ngrok http 3001
  ```
  Open the provided `https://...` link on your phone. Because of ngrok's secure context, the microphone will work perfectly!
