# סיכום פרויקט Job Tracker AI

## מה זה?
אפליקציית מעקב משרות עם יכולות AI — מאפשרת למשתמש להוסיף משרות ידנית או אוטומטית (ע"י הדבקת URL), לנהל פרופיל + קורות חיים, ולקבל ניתוח התאמה בין ה-CV למשרה.

---

## ארכיטקטורה

```
┌─────────────────┐       ┌─────────────────┐       ┌──────────────┐
│  Client (Expo)  │──────▶│  Server (Express)│──────▶│  PostgreSQL  │
│  React Native   │  API  │  TypeScript      │Prisma │  (Docker)    │
│  Port: 8081     │       │  Port: 3000      │       │  Port: 5433  │
└─────────────────┘       └─────────────────┘       └──────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │  Groq API (AI)  │
                          │  Cheerio (Scrape)│
                          └─────────────────┘
```

---

## טכנולוגיות

| שכבה | טכנולוגיה |
|------|-----------|
| Client | Expo 54, React Native 0.81, expo-router, TypeScript |
| Server | Express 5, TypeScript, tsx (dev runner) |
| DB | PostgreSQL 15 (Docker), Prisma ORM |
| AI | Groq API (Mixtral-8x7b), Cheerio (scraping) |
| Storage | Multer (file upload), local disk (`server/uploads/`) |

---

## מודלים (Prisma Schema)

- **User** — `id`, `email` (unique)
- **UserProfile** — `fullName`, `professionalTitle`, `contactInfo`, `skills`, `cvFilePath`, `cvParsedText`, `cvFileName`
- **JobApplication** — `companyName`, `jobTitle`, `status`, `jobDescription`, `link`, `notes`, `userId`

---

## מסכי הלקוח (Tabs)

1. **המשרות שלי** — רשימת משרות + חיפוש + כפתור FAB להוספה חכמה (AI)
2. **Profile** — ניהול פרופיל + העלאת CV
3. **Dashboard** — סטטיסטיקות לפי סטטוס + סינון

מסכים נוספים: Login, Modal (הוספה ידנית), Job Detail (`/job/[id]`), Job Analysis

---

## API Endpoints עיקריים

| Method | Route | תיאור |
|--------|-------|--------|
| POST | `/api/users/signup` | הרשמה/כניסה לפי email |
| GET/PATCH | `/api/users/:userId/profile` | פרופיל משתמש |
| POST | `/api/users/:userId/cv/upload` | העלאת CV |
| GET | `/api/users/:userId/cv/download` | הורדת CV |
| POST | `/api/jobs` | הוספת משרה ידנית |
| POST | `/api/jobs/auto-add` | הוספה חכמה (AI scrape + extract) |
| GET | `/api/jobs/:userId` | כל המשרות של משתמש |
| GET | `/api/jobs/detail/:id` | פרטי משרה |
| PATCH | `/api/jobs/:id/status` | עדכון סטטוס |
| DELETE | `/api/jobs/:id` | מחיקת משרה |
| POST | `/api/jobs/:userId/analyze-cv` | ניתוח התאמת CV למשרה |

---

## הרצת הפרויקט

**1. הרמת DB (Docker):**
```bash
cd job-tracker-ai
docker-compose up -d
```
PostgreSQL ירוץ על `localhost:5433` (user/password/job_tracker_db)

**2. הרצת השרת:**
```bash
cd server
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```
השרת ירוץ על `http://localhost:3000`

**3. הרצת הלקוח:**
```bash
cd client
npm install
npx expo start
```
ייפתח Expo DevTools — ניתן להריץ על Web, Android Emulator, או מכשיר פיזי.

**4. צפייה ב-DB בדפדפן (Prisma Studio):**
```bash
cd server
npx prisma studio
```
ייפתח ממשק ויזואלי ב-`http://localhost:5555` — מאפשר לצפות, לערוך ולמחוק רשומות בכל הטבלאות.

**5. כיבוי (סגירת הפרויקט):**
```bash
cd job-tracker-ai
docker-compose down
```
זה יכבה את ה-DB container. הנתונים נשמרים ב-volume ולא יימחקו.
אם רוצים למחוק גם את הנתונים:
```bash
docker-compose down -v
```

**6. חיבור מכשיר פיזי:**
בקובץ `client/services/api.ts` — לעדכן את `DEV_MACHINE_IP` ל-IP של המחשב ברשת המקומית.

---

## משתני סביבה (server/.env)

```
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5433/job_tracker_db?schema=public"
GROQ_API_KEY=<your_key>
```

---

## תהליך AI — הוספה חכמה

1. המשתמש מדביק URL של משרה
2. השרת מבצע scraping עם Cheerio (מוציא טקסט + title)
3. שולח ל-Groq API לחילוץ: שם חברה, תפקיד, תיאור
4. אם Groq נכשל — fallback חכם מבוסס regex + URL parsing
5. יוצר רשומת `JobApplication` ב-DB

---

## אבטחה (Authentication & Authorization)

- **SSO**: Google Sign-In דרך Firebase Auth
- **Token**: כל בקשה לשרת שולחת JWT token ב-header
- **Middleware**: השרת מוודא token עם `firebase-admin`
- **Ownership**: משתמש יכול לגשת רק לנתונים שלו (403 אם מנסה לגשת לנתונים של אחר)
- **Session**: Firebase מנהל refresh token אוטומטית — כניסה חוזרת בלי login מחדש




npm install firebase

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMGMPprdQKMCp0StHNpCIOGgxEnl0JDe8",
  authDomain: "job-tracker-ai-2245d.firebaseapp.com",
  projectId: "job-tracker-ai-2245d",
  storageBucket: "job-tracker-ai-2245d.firebasestorage.app",
  messagingSenderId: "535026496866",
  appId: "1:535026496866:web:0d8ba9feb16e2cfb2aa83b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


clientID
535026496866-bjpihhkv0o1k5f1rn0oslmkc26aavo1o.apps.googleusercontent.com