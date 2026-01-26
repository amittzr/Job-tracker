# JobTrack - Intelligent Job Application Tracker 🚀

JobTrack is a full-stack mobile application designed to streamline the job search process. It allows users to document every job application, track statuses (Interviews, Offers, Rejections), store job links and personal notes, and view real-time statistical insights.

---

## ✨ Key Features
- **Full Job Management (CRUD):** Add, edit, view, and delete job applications.
- **Status Tracking:** Interactive interface to update application stages (Applied, Interview, Offer, Rejected).
- **Statistical Dashboard:** View application counts and filter specific job lists by status with a single tap.
- **Smart Search:** Real-time filtering by company name or job title on the main screen.
- **Extended Job Details:** Store external job links (open in browser), job descriptions, and private notes.

---

## 🛠 Tech Stack
### Client (Frontend)
- **React Native (Expo)**
- **Expo Router** (File-based Navigation)
- **TypeScript**
- **Async Storage** (Local session management)

### Server (Backend)
- **Node.js & Express**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL**

### Infrastructure
- **Docker & Docker Compose**

---

## 🚀 Getting Started

### 1. Run with Docker (Backend + Database)
The fastest way to spin up the server and database without local installations:

1. Ensure **Docker Desktop** is running.
2. In the **root directory**, run the following command in your terminal:
   ```bash
   docker-compose up --build
3. The server will be available at: http://localhost:3000.

2. Manual Setup (For Development)
Server Setup:
1. Navigate to the server folder:

Bash
cd server
npm install
Create a .env file and configure your DATABASE_URL.

Run Prisma migrations to initialize the database:

Bash
npx prisma migrate dev
Start the server:

Bash
npm run dev
Client Setup:
Navigate to the client folder:

Bash
cd client
npm install
Important: Open services/api.ts and update the baseURL to your computer's Local IP Address to allow the mobile app to communicate with the server.

Start the application:

Bash
npx expo start
📂 Project Structure
Plaintext
├── client/             # Mobile Application (React Native + Expo)
├── server/             # REST API Server (Node.js + Prisma)
├── .gitignore          # Centralized git ignore file
├── docker-compose.yml  # Docker infrastructure configuration
└── README.md           # Project documentation
📝 Roadmap
[ ] Push Notifications for upcoming interviews.

[ ] Resume file upload per job application.

[ ] LinkedIn integration for automatic data fetching.