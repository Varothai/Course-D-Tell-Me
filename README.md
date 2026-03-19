# Course D Tell Me 🎓

Course D Tell Me is a web-based platform designed to help university students make informed course selection decisions through real peer experiences. The system provides a centralized space for course reviews, ratings, and discussions, allowing students to better understand courses before enrolling.

---

## 📌 Overview

Students often rely on scattered and inconsistent sources when choosing courses. Course D Tell Me addresses this problem by organizing authentic student feedback into a structured, searchable, and interactive platform.

Users can explore course insights, share their experiences, and engage with others to support more confident academic planning.

---

## 🚀 Features

- 🔐 **Authentication & Access Control**
  - CMU OAuth login (Microsoft Entra ID) for verified students
  - Google Sign-In for general users
  - Role-based permissions for review posting

- 📝 **Course Reviews & Ratings**
  - Submit reviews with ratings and comments
  - Anonymous posting option
  - Edit and manage reviews

- 💬 **Q&A & Discussions**
  - Comment system under reviews
  - Ask and answer course-related questions

- 🔍 **Search & Filtering**
  - Search by course name or course ID
  - Filter by faculty, program, and course type
  - Sort by newest, highest rated, and most popular

- 📊 **Course Insights**
  - Average ratings and review counts
  - Keyword-based feedback trends

- 🌐 **Multilingual Support**
  - Thai and English language switching
  - Review translation for accessibility

- 🤖 **Review Writing Assistant**
  - Structured prompts for writing reviews
  - Real-time suggestions

- 🛡 **Content Moderation**
  - Bad word detection (Thai & English)
  - Submission blocking for inappropriate content

- 🎨 **User Experience**
  - Dark / Light mode
  - Responsive design for desktop and mobile

---

## Tech Stack

**Frontend**
- Next.js 14 (React + TypeScript)
- Tailwind CSS
- UI Libraries (shadcn/ui, MUI)

**Backend**
- Next.js API Routes (Node.js environment)

**Database**
- MongoDB
  
**Authentication**
- NextAuth.js
- Google OAuth
- CMU OAuth (Microsoft Entra ID)

**Infrastructure & Tools**
- Docker & Docker Compose
- Vercel (testing)
- Faculty-hosted server (production)
- GitHub (version control)

---

## Getting Started (Local Development)

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env.local` file in the project root:

```env
MONGODB_URI=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CMU_ENTRAID_CLIENT_ID=
CMU_ENTRAID_CLIENT_SECRET=
CMU_ENTRAID_REDIRECT_URL=
CMU_ENTRAID_GET_TOKEN_URL=
CMU_ENTRAID_GET_BASIC_INFO=
SCOPE=
CMU_ENTRAID_URL=
CMU_ENTRAID_LOGOUT_URL=
JWT_SECRET=
```

### Run MongoDB

Using Docker:

```bash
docker run --name mongo -p 27017:27017 -d mongo:7
```

### Start the development server

```bash
npm run dev
```

---

## Docker / Faculty VM deployment

This repo includes a `docker-compose.yml` that runs **two containers**:

- `app`: Next.js app on port **3000**
- `mongo`: MongoDB 7 with a persistent Docker volume

### Create the VM env file

`docker-compose.yml` is configured to load environment variables from **`.env.vm`**.

Create `.env.vm` in the project root with (at minimum):
> Important: for Docker Compose on the VM, `MONGODB_URI` must use the hostname `mongo` (not `localhost`).

### Build and run containers

```bash
docker compose build
docker compose up -d
```

### Useful commands

```bash
docker compose ps
docker compose logs -f app
docker compose logs -f mongo
```

## Deployment

- **Vercel** (testing / user testing environment)
- **Faculty-hosted server** (production deployment via Docker Compose)

---

## Notes

- Do not commit `.env*` files or secrets to GitHub.
- Ensure OAuth redirect URLs match your deployment domain.
- MongoDB can be run locally, via Docker, or using MongoDB Atlas.  
- **Note:** When deploying on the faculty-hosted VM, MongoDB Atlas cannot be used due to network restrictions. In this case, you must run MongoDB locally on the VM (e.g., using Docker).

