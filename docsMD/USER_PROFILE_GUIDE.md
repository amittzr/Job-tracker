# User Profile & CV Analysis Feature Guide

## Overview

The User Profile & CV Analysis feature enables job seekers to:
- **Manage Professional Profile**: Store personal information, professional title, and skills
- **Upload and Manage CV**: Store and organize curriculum vitae documents
- **AI-Powered Job Matching**: Get intelligent analysis of CV-to-job fit with actionable feedback

---

## Feature Components

### 1. User Profile Management
**Location**: Settings Tab → Edit Profile

Users can:
- Update full name, professional title, and contact information
- Manage technical and soft skills (comma-separated)
- View profile creation and last update timestamps

**Required Fields:**
- Full Name (minimum 2 characters)

**Optional Fields:**
- Professional Title (e.g., "Senior Software Engineer")
- Contact Info (email, phone, LinkedIn URL)
- Skills (technologies, tools, methodologies)

**Use Case:**
```
A developer can maintain an up-to-date profile that:
- Highlights current expertise
- Links to professional social media
- Lists certifications and specializations
- Provides contact methods for recruiters
```

---

### 2. CV Upload & Management
**Location**: Settings Tab → CV Management → Upload CV

Users can:
- Upload CV files (PDF, Word, TXT)
- View current CV filename and upload date
- Download previously uploaded CV
- Replace CV with new version (automatic update)

**Supported Formats:**
- **PDF** (.pdf) - Recommended for formatting preservation
- **Microsoft Word** (.doc, .docx) - Common format
- **Plain Text** (.txt) - Simple, universal format

**File Handling:**
- Maximum file size: 5MB
- Text extracted for AI processing (first 5000 characters)
- Original file stored on server for download
- Latest upload automatically replaces previous version

**Best Practices:**
1. Use PDF format to preserve formatting
2. Keep CV to 1-2 pages for optimal processing
3. Use industry-standard terminology
4. Include quantifiable achievements
5. Update regularly as skills and experience grow

---

### 3. Job Matching Analysis
**Location**: Settings Tab → Job Analysis

#### How It Works:

1. **Input Job Description**
   - Provide job URL (auto-extracts description) OR
   - Paste complete job description text

2. **AI Analysis Process**
   - System retrieves user's uploaded CV
   - Compares CV against job requirements
   - Uses Groq AI for intelligent matching
   - Generates detailed feedback

3. **Results Provided**
   - **Match Percentage** (0-100): Overall fit score
   - **Your Strengths**: What you bring to the role
   - **Skill Gaps**: Areas for development
   - **Actionable Tips**: How to improve match
   - **Summary**: Strategic guidance

#### Match Score Interpretation:

| Score | Interpretation | Recommendation |
|-------|---|---|
| 80-100% | Excellent Fit | Strong candidate, apply immediately |
| 60-80% | Good Match | Qualified, address 1-2 skill gaps |
| 40-60% | Moderate Fit | Apply if interested, plan skill development |
| 0-40% | Limited Fit | Consider different roles or upskill |

#### Example Analysis Output:

```json
{
  "matchPercentage": 82,
  "strengths": [
    "5+ years React experience matches requirement",
    "Strong TypeScript skills aligned with tech stack",
    "AWS experience covers cloud platform needs",
    "Proven mentoring background for team lead role"
  ],
  "gaps": [
    "Limited GraphQL API development experience",
    "No Kubernetes orchestration mentioned",
    "Docker experience not highlighted in CV"
  ],
  "suggestions": [
    "Add GraphQL projects to portfolio section",
    "Highlight containerization experience in CV",
    "Mention Kubernetes exposure in cover letter",
    "Emphasize cloud infrastructure work"
  ],
  "summary": "Strong candidate with 82% alignment. Your React and AWS experience are key strengths. Adding GraphQL and containerization details to your CV could increase match to 90%+."
}
```

---

## User Workflow

### First-Time Setup (5 minutes)

1. **Navigate to Profile**
   - Go to Settings Tab (gear icon)
   - Tap "Edit Profile" button

2. **Fill Profile Information**
   - Enter full name
   - Add professional title (optional)
   - Include contact information
   - List relevant skills

3. **Save Profile**
   - Tap "Save Profile" button
   - Confirmation message displays

4. **Upload CV**
   - Still in Settings, tap "Upload CV"
   - Select CV file from device
   - Wait for upload confirmation

---

### Job Application Workflow (2-3 minutes per job)

1. **Find Job Posting**
   - Get URL of job posting OR
   - Copy job description text

2. **Run Job Analysis**
   - Go to Settings Tab
   - Tap "Job Analysis"
   - Choose input method (URL or text)
   - Paste job information

3. **Review Results**
   - Check match percentage
   - Read strengths section
   - Note skill gaps
   - Implement suggestions

4. **Apply or Update CV**
   - If score is 60%+: Apply for position
   - If score is <60%: Update CV or skip
   - Use suggestions to improve for future applications

---

## Data Storage & Privacy

### What We Store:
- **Profile Data**: Name, title, contact, skills (in database)
- **CV File**: Original document (on server filesystem)
- **CV Text**: First 5000 characters extracted for AI (in database)
- **Analysis Results**: Not stored; generated on-demand

### Data Retention:
- Stored indefinitely until user account deletion
- CV can be replaced/updated anytime
- Analysis results are ephemeral

### Security Measures:
- Files stored with unique naming (userId_timestamp_filename)
- userId-based access control
- Future: JWT authentication for production

---

## Technology Implementation

### Backend Technologies

**Node.js with Express**
- RESTful API endpoints
- Middleware for file upload handling (multer)
- Error handling and validation

**Database (PostgreSQL with Prisma ORM)**
```sql
UserProfile {
  id: UUID (primary)
  userId: UUID (foreign key to User)
  fullName: String
  professionalTitle: String
  contactInfo: String
  skills: JSON/String
  cvFilePath: String
  cvParsedText: String (5000 chars)
  cvFileName: String
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**AI Service (Groq API)**
- Model: mixtral-8x7b-32768
- Prompt: Detailed comparison prompt with CV + Job description
- Temperature: 0.3 (precise, consistent results)
- Max tokens: 1000 (detailed analysis)

### Frontend Technologies

**React Native with Expo**
- Cross-platform mobile UI
- Expo Document Picker for file selection
- Axios for API communication
- AsyncStorage for user session management

**Navigation**
- Expo Router for app routing
- Dynamic route creation for new screens
- Tab-based navigation in main app

---

## API Endpoints Summary

### User Profile
- `GET /api/users/:userId/profile` - Retrieve profile
- `PATCH /api/users/:userId/profile` - Update/create profile

### CV Management
- `POST /api/users/:userId/cv/upload` - Upload CV file
- `GET /api/users/:userId/cv/download` - Download CV file

### Job Analysis
- `POST /api/jobs/:userId/analyze-cv` - Analyze CV against job

**Complete API documentation**: See [API_DOCUMENTATION.md](../API_DOCUMENTATION.md)

---

## Configuration & Environment Variables

### Required Environment Variables

```env
# Groq API
GROQ_API_KEY=gsk_your_groq_api_key_here

# Database
DATABASE_URL=postgresql://user:password@localhost:5433/job_tracker_db

# Frontend API
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

### File Upload Configuration
- Upload directory: `./server/uploads/`
- Max file size: 5MB (in multer middleware)
- Supported MIME types: PDF, Word, TXT

---

## Testing Guide

### Manual Testing Checklist

**Profile Management:**
- [ ] Create new profile with all fields
- [ ] Update existing profile
- [ ] Verify data persistence across app restarts
- [ ] Test with special characters and long text

**CV Upload:**
- [ ] Upload PDF file
- [ ] Upload Word document
- [ ] Upload TXT file
- [ ] Attempt invalid file type (should fail)
- [ ] Test file size limit

**Job Analysis:**
- [ ] Analyze with job URL
- [ ] Analyze with pasted text
- [ ] Verify results are returned
- [ ] Test with multiple jobs
- [ ] Verify skill gaps are realistic
- [ ] Check suggestions are actionable

**Error Handling:**
- [ ] No CV uploaded (should show helpful error)
- [ ] Invalid job URL (should show error)
- [ ] Empty job description (should show error)
- [ ] Server unavailable (should show retry option)

---

## Performance Optimization Tips

### Frontend
- Lazy load job analysis page (only when needed)
- Cache profile data locally (in AsyncStorage)
- Debounce skill input to avoid multiple saves
- Show loading indicator during long operations (analysis takes 2-5 seconds)

### Backend
- Index database queries on userId
- Implement caching for frequently analyzed jobs
- Consider async CV parsing for large files
- Monitor Groq API quotas and implement rate limiting

### Network
- Compress files before upload
- Implement resume/retry for large uploads
- Use connection checks before API calls
- Offline-first UI with sync when reconnected

---

## Future Enhancements

### Phase 2 Features
1. **Multiple CV Versions**
   - Store 3-5 CV versions with dates
   - Quick switch between versions
   - Version-specific skill highlighting

2. **Job Matching History**
   - Track analyzed jobs over time
   - Show matching trends
   - Identify common skill gaps

3. **Skill Development Recommendations**
   - Suggest courses for skill gaps
   - Link to learning resources
   - Track progress on recommendations

4. **Cover Letter Generation**
   - AI-generated cover letter drafts
   - Job-specific customization
   - One-click refinement

5. **Application Tracking**
   - Link job analysis to job applications
   - Track which jobs you applied for
   - Monitor response rates

### Phase 3 Features
1. **LinkedIn Integration**
   - Auto-import profile data
   - Sync with LinkedIn CV
   - One-click profile updates

2. **Interview Preparation**
   - Question suggestions based on job
   - Mock interview scenarios
   - Skill-specific Q&A

3. **Salary Prediction**
   - Based on skills and job description
   - Market data integration
   - Negotiation tips

4. **Network Insights**
   - Company research summaries
   - Employee testimonials
   - Growth opportunities analysis

---

## Troubleshooting

### Issue: "User profile not found"
**Solution:**
1. Ensure user account is created (signup first)
2. Go to profile page and save at least once
3. Check correct userId is being used

### Issue: CV upload fails with "Invalid file type"
**Solution:**
1. Ensure file is PDF, Word, or TXT
2. Check file isn't corrupted
3. Try converting to PDF if using older format
4. Verify file size is under 5MB

### Issue: Job analysis returns poor results
**Solution:**
1. Ensure CV is uploaded (required for analysis)
2. Update CV with relevant keywords
3. Ensure job description is complete
4. Try with different job descriptions to verify

### Issue: Skills not saving in profile
**Solution:**
1. Ensure skills are entered (comma-separated)
2. Try with fewer skills first
3. Avoid special characters that might cause issues
4. Use clear technology names (React, not "web framework")

---

## Code Examples

### Frontend: Calling Profile API

```typescript
// Get user profile
const fetchProfile = async (userId: string) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/users/${userId}/profile`
    );
    setProfile(response.data);
  } catch (error) {
    console.error('Failed to load profile:', error);
  }
};

// Update profile
const updateProfile = async (userId: string, data: UserProfileData) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/users/${userId}/profile`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Failed to update profile:', error);
  }
};
```

### Frontend: Uploading CV

```typescript
const uploadCV = async (userId: string, file: DocumentResult) => {
  const formData = new FormData();
  formData.append('cv', {
    uri: file.uri,
    type: file.mimeType,
    name: file.name,
  });
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/users/${userId}/cv/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  } catch (error) {
    console.error('CV upload failed:', error);
  }
};
```

### Frontend: Job Analysis

```typescript
const analyzeCV = async (
  userId: string,
  jobUrl: string,
  jobTitle?: string
) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/jobs/${userId}/analyze-cv`,
      {
        jobDescriptionUrl: jobUrl,
        jobTitle: jobTitle
      }
    );
    return response.data.analysis;
  } catch (error) {
    console.error('Analysis failed:', error);
  }
};
```

### Backend: AI Analysis Function

```typescript
// In aiService.ts
export async function analyzeCVForJob(
  cvText: string,
  jobDescription: string,
  jobTitle: string = "",
  userSkills?: string
): Promise<AnalysisResult> {
  // Builds prompt with CV + job description
  // Calls Groq API with temperature 0.3
  // Validates and returns structured analysis
  // Includes match %, strengths, gaps, suggestions
}
```

---

## Support Resources

- **API Documentation**: See [API_DOCUMENTATION.md](../API_DOCUMENTATION.md)
- **Source Code**: `/server/src/` and `/client/app/`
- **Database Schema**: `/server/prisma/schema.prisma`
- **Environment Setup**: `/server/.env.example`

---

## Version Information

- **Feature Version**: 1.0.0
- **Last Updated**: March 26, 2024
- **Groq API Model**: mixtral-8x7b-32768
- **Tested With**: Node.js 18+, React Native, Expo 50+

---

## Credits & Acknowledgments

**Technologies Used:**
- Express.js - Web framework
- Prisma - Database ORM
- Groq API - AI analysis
- React Native - Mobile UI
- Expo - Cross-platform framework

**Author**: Job Tracker AI Team

---

*For questions or issues, please refer to troubleshooting section or check API documentation.*
