# Quick Start Guide: User Profile & CV Analysis Feature

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- PostgreSQL running on localhost:5433
- Groq API key configured

### Step 1: Setup Database (1 minute)

```bash
cd server

# Apply the migration
npx prisma migrate deploy

# Verify schema
npx prisma db push
```

### Step 2: Start Backend (1 minute)

```bash
cd server
npm run dev
# Expected output: "🚀 Server ready at http://localhost:3000"
```

### Step 3: Start Frontend (1 minute)

```bash
cd client
npm start
# Or: npx expo start
```

### Step 4: Test Features (2 minutes)

#### Test 1: Create Profile
```bash
# Via API
curl -X PATCH http://localhost:3000/api/users/YOUR_USER_ID/profile \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "professionalTitle": "Software Engineer",
    "skills": ["React", "Node.js", "PostgreSQL"]
  }'
```

#### Test 2: Upload CV
```bash
# Via API
curl -X POST http://localhost:3000/api/users/YOUR_USER_ID/cv/upload \
  -F "cv=@/path/to/your/cv.pdf"
```

#### Test 3: Job Analysis
```bash
# Via API
curl -X POST http://localhost:3000/api/jobs/YOUR_USER_ID/analyze-cv \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescriptionUrl": "https://www.google.com/careers/jobs/123",
    "jobTitle": "Software Engineer"
  }'
```

---

## 📱 Frontend Navigation

1. **Open App** → Login page
2. **Enter Email** → Sign in
3. **Settings Tab** (bottom right) → "Edit Profile"
4. **Fill Profile Form** → Save
5. **Settings Tab** → "CV Management" → Upload CV
6. **Settings Tab** → "Job Analysis" → Analyze Job

---

## 🔑 Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/users/:userId/profile` | Get profile |
| PATCH | `/api/users/:userId/profile` | Update profile |
| POST | `/api/users/:userId/cv/upload` | Upload CV |
| GET | `/api/users/:userId/cv/download` | Download CV |
| POST | `/api/jobs/:userId/analyze-cv` | Analyze job |

---

## 📂 Key Files to Review

```
Backend:
- server/src/controllers/userController.ts     (Profile, CV upload)
- server/src/controllers/jobController.ts      (Job analysis)
- server/src/services/aiService.ts             (Groq integration)
- server/prisma/schema.prisma                  (UserProfile model)

Frontend:
- client/app/profile.tsx                       (Profile page)
- client/app/cv-upload.tsx                     (CV upload)
- client/app/job-analysis.tsx                  (Job analysis)
```

---

## 🧪 Quick Test Commands

```bash
# 1. Get user ID (from signup)
curl -X POST http://localhost:3000/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# 2. Create profile
curl -X PATCH http://localhost:3000/api/users/YOUR_ID/profile \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "skills": ["React", "Node.js"]
  }'

# 3. Upload sample CV (create test.txt first)
echo "Experience: 5 years React development" > test.txt
curl -X POST http://localhost:3000/api/users/YOUR_ID/cv/upload \
  -F "cv=@test.txt"

# 4. Analyze job
curl -X POST http://localhost:3000/api/jobs/YOUR_ID/analyze-cv \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescriptionText": "We need React expert with 5+ years experience",
    "jobTitle": "Senior React Developer"
  }'
```

---

## 🔧 Environment Configuration

**server/.env**
```
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=postgresql://user:password@localhost:5433/job_tracker_db
```

**client/.env**
```
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

---

## ❌ Troubleshooting

**"Cannot find module 'multer'"**
```bash
cd server && npm install multer @types/multer
```

**"Database not synced"**
```bash
npx prisma db push
```

**"CV upload fails"**
- Ensure file is PDF, Word, or TXT
- Check file size < 5MB
- Create `server/uploads/` directory manually if needed

**"Groq API error"**
- Verify GROQ_API_KEY is set correctly
- Check Groq API quotas
- Ensure internet connection

---

## 📚 Full Documentation

- **API Reference**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **User Guide**: [USER_PROFILE_GUIDE.md](./USER_PROFILE_GUIDE.md)
- **Complete Summary**: [FEATURE_COMPLETE.md](./FEATURE_COMPLETE.md)

---

## ✅ Verification Checklist

After setup, verify:
- [ ] Backend running on localhost:3000
- [ ] Frontend app accessible
- [ ] Can create/update profile
- [ ] Can upload CV file
- [ ] Can run job analysis
- [ ] All responses valid JSON
- [ ] No console errors

---

## 💡 Next Steps

1. **Test thoroughly** - Use test scenarios in USER_PROFILE_GUIDE.md
2. **Review code** - Check source files for implementation details
3. **Customize** - Modify styling, prompts, or logic as needed
4. **Deploy** - Follow deployment checklist in FEATURE_COMPLETE.md
5. **Monitor** - Track API usage and user feedback

---

## 🆘 Need Help?

1. Check **USER_PROFILE_GUIDE.md** → Troubleshooting section
2. Review **API_DOCUMENTATION.md** → Error handling section
3. Examine source code comments
4. Check browser/server console logs
5. Verify database connection: `npx prisma studio`

---

**You're all set! 🎉**

The feature is fully implemented and ready to use. Start with the test commands above, then explore the full documentation for deeper understanding.

Happy coding! 🚀
