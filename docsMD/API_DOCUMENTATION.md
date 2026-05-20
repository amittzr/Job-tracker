# User Profile & CV Analysis API Documentation

## Overview
This document provides comprehensive API documentation for the User Profile and CV Analysis features in the Job Tracker AI application.

---

## Authentication & Setup

All endpoints require a valid `userId` (UUID format). Users are created via the signup endpoint.

### Signup/Login User
**POST** `/api/users/signup`

```bash
curl -X POST http://localhost:3000/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Response:**
```json
{
  "id": "1fba5933-6f98-49d6-ab46-ba9c12cb4be4",
  "email": "user@example.com"
}
```

---

## User Profile Endpoints

### 1. Get User Profile
Retrieve user's current profile information.

**GET** `/api/users/:userId/profile`

```bash
curl -X GET http://localhost:3000/api/users/1fba5933-6f98-49d6-ab46-ba9c12cb4be4/profile
```

**Response (200 OK):**
```json
{
  "id": "profile-uuid",
  "userId": "1fba5933-6f98-49d6-ab46-ba9c12cb4be4",
  "fullName": "John Smith",
  "professionalTitle": "Senior Software Engineer",
  "contactInfo": "john@example.com | (555) 123-4567 | linkedin.com/in/johnsmith",
  "skills": "[\"React\", \"TypeScript\", \"Node.js\", \"PostgreSQL\"]",
  "cvFileName": "John_Smith_CV_2024.pdf",
  "cvParsedText": "[First 5000 chars of extracted CV text]",
  "createdAt": "2024-03-26T10:30:00.000Z",
  "updatedAt": "2024-03-26T14:45:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Profile not found (user hasn't created a profile yet)
- `500 Internal Server Error` - Database error

---

### 2. Update/Create User Profile
Create or update user profile with personal details and skills.

**PATCH** `/api/users/:userId/profile`

```bash
curl -X PATCH http://localhost:3000/api/users/1fba5933-6f98-49d6-ab46-ba9c12cb4be4/profile \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Smith",
    "professionalTitle": "Senior Software Engineer",
    "contactInfo": "john@example.com | (555) 123-4567 | linkedin.com/in/johnsmith",
    "skills": [
      "React",
      "TypeScript",
      "Node.js",
      "PostgreSQL",
      "AWS",
      "Docker"
    ]
  }'
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| fullName | String | Yes | User's full name (min 2 chars) |
| professionalTitle | String | No | Job title or professional title |
| contactInfo | String | No | Email, phone, LinkedIn URL |
| skills | Array[String] or String | No | List of skills (comma-separated string or array) |

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "id": "profile-uuid",
    "userId": "1fba5933-6f98-49d6-ab46-ba9c12cb4be4",
    "fullName": "John Smith",
    "professionalTitle": "Senior Software Engineer",
    "contactInfo": "john@example.com | (555) 123-4567 | linkedin.com/in/johnsmith",
    "skills": "[\"React\", \"TypeScript\", \"Node.js\", \"PostgreSQL\", \"AWS\", \"Docker\"]",
    "updatedAt": "2024-03-26T15:20:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields
- `404 Not Found` - User not found
- `500 Internal Server Error` - Database error

---

## CV Management Endpoints

### 3. Upload CV File
Upload and parse CV file (PDF, Word, or TXT).

**POST** `/api/users/:userId/cv/upload`

```bash
curl -X POST http://localhost:3000/api/users/1fba5933-6f98-49d6-ab46-ba9c12cb4be4/cv/upload \
  -F "cv=@/path/to/John_Smith_CV.pdf"
```

**Supported File Types:**
- PDF (`.pdf`)
- Microsoft Word (`.doc`, `.docx`)
- Plain Text (`.txt`)
- Maximum file size: 5MB

**Response (200 OK):**
```json
{
  "message": "CV uploaded successfully",
  "profile": {
    "cvFileName": "John_Smith_CV_2024.pdf",
    "cvFilePath": "/path/to/uploads/userid_timestamp_John_Smith_CV.pdf"
  }
}
```

**Error Responses:**
- `400 Bad Request` - No file uploaded or invalid file type
- `404 Not Found` - User not found
- `500 Internal Server Error` - Upload failed

---

### 4. Download CV File
Download previously uploaded CV.

**GET** `/api/users/:userId/cv/download`

```bash
curl -X GET http://localhost:3000/api/users/1fba5933-6f98-49d6-ab46-ba9c12cb4be4/cv/download \
  --output CV.pdf
```

**Response:**
- Returns file stream with CV attachment
- Content-Type: application/pdf (or appropriate MIME type)

**Error Responses:**
- `404 Not Found` - CV not found for user
- `500 Internal Server Error` - Download failed

---

## CV Job Analysis Endpoints

### 5. Analyze CV Against Job Description (URL)
Compare user's CV with a job posting from URL.

**POST** `/api/jobs/:userId/analyze-cv`

```bash
curl -X POST http://localhost:3000/api/jobs/1fba5933-6f98-49d6-ab46-ba9c12cb4be4/analyze-cv \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescriptionUrl": "https://www.google.com/about/careers/applications/jobs/results/120898271743746758-power-and-signal-integrity-engineer",
    "jobTitle": "Power and Signal Integrity Engineer"
  }'
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| jobDescriptionUrl | String | No* | URL of job posting |
| jobDescriptionText | String | No* | Plain text job description |
| jobTitle | String | No | Job position title (optional, auto-extracted from URL) |

*Either jobDescriptionUrl or jobDescriptionText must be provided.

**Response (200 OK):**
```json
{
  "analysis": {
    "matchPercentage": 82,
    "strengths": [
      "Strong experience with signal integrity analysis and EDA tools (Cadence, Ansys)",
      "Proven track record in hardware validation and lab testing",
      "Experience with high-speed circuit design and protocols (PCIe, MIPI, UFS)",
      "Cross-functional collaboration skills demonstrated in previous roles"
    ],
    "gaps": [
      "Limited experience with power integrity modeling (PowerDC, Q3D)",
      "No mentioned experience with specific Google infrastructure standards",
      "Less exposure to LPDDR-specific design guidelines",
      "Could strengthen RF measurement and simulation expertise"
    ],
    "suggestions": [
      "Highlight hands-on HFSS or PowerDC experience in job application or CV",
      "Study Google's power management standards and include in cover letter",
      "Emphasize experience with LPDDR, USB, or PCIe protocol implementations",
      "Add any lab measurement or oscilloscope proficiency to CV",
      "Demonstrate how past projects align with Google's reliability standards"
    ],
    "summary": "Your background demonstrates strong potential for this role with 82% alignment. You have solid experience in signal integrity analysis and EDA tools, which are core requirements. Focus on emphasizing your power integrity knowledge and any relevant protocol experience to increase match strength."
  },
  "cvFileName": "John_Smith_CV.pdf",
  "analyzedAt": "2024-03-26T16:30:45.000Z"
}
```

---

### 6. Analyze CV Against Job Description (Text)
Compare user's CV with manually pasted job description.

**POST** `/api/jobs/:userId/analyze-cv`

```bash
curl -X POST http://localhost:3000/api/jobs/1fba5933-6f98-49d6-ab46-ba9c12cb4be4/analyze-cv \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescriptionText": "We are looking for a Senior Frontend Engineer with 5+ years of React experience. Must have TypeScript skills and experience with AWS. Responsibilities include: building responsive UIs, optimizing performance, and mentoring junior developers.",
    "jobTitle": "Senior Frontend Engineer"
  }'
```

**Response Format:** Same as endpoint #5

---

## Response Analysis Fields Explanation

### Match Percentage (0-100)
- **80-100**: Excellent fit for the role
- **60-80**: Good match with some skill gaps
- **40-60**: Moderate alignment, significant development needed
- **0-40**: Limited fit, considerable skill gaps

### Strengths Array
- 3-5 key areas where your CV aligns well with job requirements
- References actual skills/experience from your CV
- Actionable and specific to the job description

### Gaps Array
- 3-5 technical or soft skills that are required but missing from your CV
- Identifies areas for professional development
- Specific to job requirements not covered in CV

### Suggestions Array
- 3-5 actionable tips to improve your match
- May include: CV updates, skill development, highlighting existing strengths
- Focused on increasing interview chances

### Summary
- 2-3 sentence overall assessment
- Includes match percentage context
- Provides strategic guidance

---

## Error Handling & Status Codes

### Common Status Codes
- `200 OK` - Successful request
- `201 Created` - Resource successfully created
- `400 Bad Request` - Invalid request parameters
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Error Response Format
```json
{
  "error": "Human-readable error message"
}
```

**Common Error Scenarios:**

1. **User not found**
   ```json
   {
     "error": "User not found"
   }
   ```

2. **CV not uploaded**
   ```json
   {
     "error": "User profile or CV not found. Please upload your CV first."
   }
   ```

3. **Invalid job description URL**
   ```json
   {
     "error": "Could not extract job description from provided URL"
   }
   ```

4. **Missing CV for analysis**
   ```json
   {
     "error": "User profile or CV not found. Please upload your CV first."
   }
   ```

---

## Integration Examples

### Complete Workflow Example

```javascript
// 1. Sign up user
const signupResponse = await fetch('http://localhost:3000/api/users/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});
const user = await signupResponse.json();
const userId = user.id;

// 2. Create user profile
await fetch(`http://localhost:3000/api/users/${userId}/profile`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fullName: 'John Smith',
    professionalTitle: 'Software Engineer',
    skills: ['React', 'TypeScript', 'Node.js']
  })
});

// 3. Upload CV
const formData = new FormData();
formData.append('cv', cvFile);
await fetch(`http://localhost:3000/api/users/${userId}/cv/upload`, {
  method: 'POST',
  body: formData
});

// 4. Analyze CV for job
const analysisResponse = await fetch(
  `http://localhost:3000/api/jobs/${userId}/analyze-cv`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobDescriptionUrl: 'https://example.com/job/123',
      jobTitle: 'Senior Software Engineer'
    })
  }
);
const analysis = await analysisResponse.json();
console.log('Match Score:', analysis.analysis.matchPercentage);
```

---

## Best Practices

### For CV Uploads
1. **Format**: Use PDF for best compatibility and formatting preservation
2. **Content**: Include quantifiable achievements and specific technologies
3. **Keywords**: Use industry-standard terminology matching job descriptions
4. **Length**: Keep to 1-2 pages for optimal extraction

### For Job Analysis
1. **Complete Data**: Provide full job descriptions for accurate matching
2. **Job Title**: Include job title when available for better context
3. **URL vs Text**: URL parsing is automatic; pasted text should be complete
4. **Iteration**: Re-analyze after updating CV to track improvement

### For Profile Management
1. **Keep Updated**: Update skills and titles as you grow professionally
2. **Be Specific**: Use exact technology names (React, not just "web frameworks")
3. **Add Context**: Include certifications and notable achievements in contact info
4. **Review Regularly**: Ensure profile accurately represents current capabilities

---

## Rate Limiting & Quotas

- **API Calls**: No hard limit (fair use policy)
- **File Upload Size**: 5MB maximum per file
- **CV Text Extraction**: First 5000 characters stored for AI processing
- **Job Analysis**: Uses Groq API with fair-use quotas

---

## Support & Troubleshooting

### Issue: "User not found"
- Verify userId is correct
- Ensure user was created via signup endpoint
- Check database connection

### Issue: "CV not found"
- Upload CV first using endpoint #3
- Verify file upload was successful (check response)
- Ensure correct userId in subsequent requests

### Issue: "Could not extract job description"
- Verify URL is publicly accessible
- Check job posting hasn't been removed
- Try using jobDescriptionText with manual paste

### Issue: Poor analysis results
- Ensure CV is complete and well-formatted
- Add more specific technical skills to profile
- Update CV with relevant keywords from job description
- Re-run analysis after CV improvements

---

## Version History

**v1.0.0** - March 26, 2024
- Initial release
- User profile management
- CV upload and management
- AI-powered job matching analysis

---

## Security Considerations

1. **File Storage**: CVs stored in server uploads directory
2. **Data Privacy**: CV text extracted and stored for AI processing (first 5000 chars)
3. **Authentication**: userId-based access control (should implement JWT in production)
4. **CORS**: Configured for local development and web clients

---

## Performance Notes

- Job analysis typically completes in 2-5 seconds
- File uploads depend on network and file size
- CV text extraction is synchronous for PDF/Word (may take 1-2 seconds)
- Large job descriptions may require 10-15 seconds for analysis

---

## Future Enhancements

- [ ] Multiple CV versions management
- [ ] Job matching history and trending
- [ ] Automated skill gap training recommendations
- [ ] Integration with LinkedIn profile
- [ ] Cover letter generation assistance
- [ ] Application tracking and follow-up reminders
