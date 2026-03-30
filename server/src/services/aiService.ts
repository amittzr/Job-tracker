import axios from "axios";
import * as cheerio from "cheerio";

// Extract and clean text from a URL using local scraping (no AI tokens used)
const fetchWebText = async (url: string): Promise<{ text: string; html: string; title: string }> => {
  try {
    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9,he;q=0.8",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(html);
    
    // Extract page title
    const pageTitle = $("title").text().trim() || "";

    // Remove non-content elements to focus on job posting text
    $("script, style, nav, footer, header, aside, svg, button, [aria-hidden]").remove();

    let cleanText = $("body").text().replace(/\s\s+/g, " ").trim();

    // Ensure minimum content was extracted
    if (cleanText.length < 100) {
      throw new Error("Extracted text too short. Site may be blocking access.");
    }

    // Return both text and HTML for better parsing
    return {
      text: cleanText.substring(0, 2500),
      html: html.substring(0, 5000),
      title: pageTitle,
    };
  } catch (error: any) {
    console.error("Web scraping error:", error.message);
    throw new Error(`Failed to fetch website content: ${error.message}`);
  }
};

// Analyze job posting - extract details smartly
export const analyzeJobFromUrl = async (url: string) => {
  try {
    console.log(`[AI Service] Processing: ${url}`);
    const scraped = await fetchWebText(url);
    console.log(`[AI Service] Scraped ${scraped.text.length} characters`);
    console.log(`[AI Service] Page title: ${scraped.title}`);

    // Try Groq API (fastest free option)
    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey && groqApiKey !== "") {
      try {
        console.log("[AI Service] Attempting Groq API...");
        const groqResponse = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "mixtral-8x7b-32768",
            messages: [
              {
                role: "system",
                content: "You are a job posting analyzer. Extract job details and return ONLY valid JSON with no markdown or extra text.",
              },
              {
                role: "user",
                content: `Extract these fields from the job posting text. Return ONLY this JSON format (no markdown):
{"companyName": "company or organization name", "jobTitle": "job position title", "jobDescription": "3-4 sentence summary of the role, responsibilities, and requirements", "status": "pending"}

Job posting text:
${scraped.text.substring(0, 1200)}`,
              },
            ],
            temperature: 0.1,
            max_tokens: 500,
          },
          {
            headers: { Authorization: `Bearer ${groqApiKey}` },
            timeout: 20000,
          }
        );

        const content = groqResponse.data?.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            const companyName = (parsed.companyName || "").trim();
            const jobTitle = (parsed.jobTitle || "").trim();
            const jobDesc = (parsed.jobDescription || "").trim();
            
            // If Groq extracted good data, use it
            if (companyName.length > 1 && jobTitle.length > 3 && jobDesc.length > 60) {
              console.log("[AI Service] Groq extraction successful");
              return {
                companyName: companyName || "Unknown Company",
                jobTitle: jobTitle || "New Position",
                jobDescription: jobDesc,
                status: "pending",
              };
            } else {
              console.log(`[AI Service] Groq data too weak: company=${companyName.length}, title=${jobTitle.length}, desc=${jobDesc.length}`);
            }
          } catch (parseErr) {
            console.error("[AI Service] JSON parse failed");
          }
        }
      } catch (err: any) {
        console.error("[AI Service] Groq failed:", err.response?.status || err.message);
      }
    }

    // Fallback: Smart text extraction with URL analysis
    console.log("[AI Service] Using enhanced smart extraction...");
    const fallbackResult = extractJobDetailsFromText(scraped, url);
    
    // If we successfully extracted the job title from page, use Groq for description
    // Or if fallback description is weak, try Groq
    const descLower = fallbackResult.jobDescription.toLowerCase();
    const needsGroqDesc = fallbackResult.titleFromPage ||  // Title from page = good quality, use Groq for desc
                          fallbackResult.jobDescription.length < 100 || 
                          descLower.includes("qualification") ||
                          descLower.includes("location") ||
                          descLower.includes("job id") ||
                          descLower.includes("experience with") ||
                          /^[\s,]/.test(fallbackResult.jobDescription); // Starts with comma/space
    
    if (needsGroqDesc && groqApiKey && groqApiKey !== "") {
      try {
        console.log("[AI Service] Getting description from Groq...");
        const groqRetry = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "mixtral-8x7b-32768",
            messages: [
              {
                role: "system",
                content: "Extract ONLY the job description. Return a 3-4 sentence summary of what the role is and what the person will do. Focus on the main responsibilities and impact.",
              },
              {
                role: "user",
                content: `Job title: ${fallbackResult.jobTitle}\n\nJob posting text:\n${scraped.text.substring(0, 1500)}`,
              },
            ],
            temperature: 0.2,
            max_tokens: 400,
          },
          {
            headers: { Authorization: `Bearer ${groqApiKey}` },
            timeout: 15000,
          }
        );

        const groqDesc = groqRetry.data?.choices?.[0]?.message?.content || "";
        if (groqDesc && groqDesc.length > 100 && groqDesc.length < 700 && !groqDesc.toLowerCase().includes("qualification")) {
          console.log("[AI Service] Using Groq description");
          fallbackResult.jobDescription = groqDesc.trim();
        }
      } catch (err: any) {
        console.error("[AI Service] Groq retry failed:", err.message);
      }
    }
    
    // Remove the titleFromPage flag before returning
    delete (fallbackResult as any).titleFromPage;
    
    return fallbackResult;

  } catch (error: any) {
    console.error("[AI Service] Fatal error:", error.message);
    return {
      companyName: "Unknown Company",
      jobTitle: "New Position",
      jobDescription: "Unable to analyze. Please update manually.",
      status: "pending",
    };
  }
};

// Smart text extraction without AI
function extractJobDetailsFromText(scraped: { text: string; html: string; title: string }, url: string): { companyName: string; jobTitle: string; jobDescription: string; status: string; titleFromPage?: boolean } {
  const cleanText = scraped.text.replace(/\s+/g, " ").trim();
  const $ = cheerio.load(scraped.html);

  // Extract company name from URL first (most reliable)
  let company = "Unknown Company";
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    let domainName = hostname
      .replace(/^(www\.|careers\.|jobs\.|apply\.|hiring\.)?/, "")
      .replace(/\.(com|co|org|io|net|de|uk|eu|app|dev|ai|us|ca|au|jobs)$/, "")
      .split('.')[0]
      .replace(/[-_]/g, " ")
      .trim();

    if (domainName && domainName.length > 1) {
      company = domainName
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
    }
  } catch (e) {
    console.error("[AI Service] URL parsing failed");
  }

  // Extract job title from multiple sources
  let title = "New Position";
  let titleFromPage = false;

  // Strategy 1: Extract from page title tag (prioritize this)
  let pageTitle = scraped.title.trim();
  if (pageTitle && pageTitle.length > 3 && pageTitle.length < 300) {
    // Clean up page title - remove " — Google Careers", "| Company", etc.
    const titleCleaned = pageTitle
      .split(/\s*[—|–-]\s*/)[0]  // Take everything before the separator
      .replace(/\s*(careers?|jobs?|hiring|applications?)\s*$/i, "")  // Remove common suffixes
      .trim();
    
    // Check if it looks like a job title (not a sentence, reasonable length)
    if (titleCleaned.length > 3 && titleCleaned.length < 200 && titleCleaned.split(" ").length <= 12) {
      title = titleCleaned;
      titleFromPage = true;
      console.log(`[AI Service] Title from page: ${title}`);
    }
  }

  // Strategy 2: Extract from H1 tag if title extraction failed
  if (title === "New Position") {
    const h1Text = $("h1").first().text().trim();
    if (h1Text && h1Text.length > 3 && h1Text.length < 200 && h1Text.split(" ").length <= 12) {
      title = h1Text;
      console.log(`[AI Service] Title from H1: ${title}`);
    }
  }

  // Strategy 3: Extract from meta property or specific job title elements
  if (title === "New Position") {
    const metaTitle = $('meta[property="og:title"]').attr("content") || $('meta[name="job-title"]').attr("content") || "";
    if (metaTitle && metaTitle.length > 3 && metaTitle.length < 200) {
      const cleanedMeta = metaTitle.split(/\s*[—|–-]\s*/)[0].trim();
      if (cleanedMeta.length > 3) {
        title = cleanedMeta;
        console.log(`[AI Service] Title from meta: ${title}`);
      }
    }
  }

  // Strategy 4: Extract from text patterns if still not found
  if (title === "New Position") {
    const titlePatterns = [
      /(?:position|role|title|job title):\s*([A-Za-z0-9\s\-&]+?)(?:\n|$)/i,
      /(?:we(?:'re| are)? hiring for|hiring|open role|we seek|we need):\s*([A-Za-z0-9\s\-&]+?)(?:\n|-|,|$)/i,
      /(?:join our team as|join us as|looking for):\s*([A-Za-z0-9\s\-&]+?)(?:\n|,|to|and|$)/i,
    ];

    for (const pattern of titlePatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        const candidate = match[1].trim().substring(0, 150);
        if (candidate.length >= 3 && candidate.length <= 150 && candidate.split(" ").length <= 10 && !candidate.toLowerCase().includes("job description")) {
          title = candidate;
          console.log(`[AI Service] Title from pattern: ${title}`);
          break;
        }
      }
    }
  }

  // Extract description - use multiple strategies
  let description = "";

  // Strategy 1: Look for description in common divs/sections
  const descriptionSelectors = [
    '[class*="description"], [class*="job-description"], [class*="role-description"]',
    '[class*="about-role"], [class*="about-job"], [class*="job-overview"]',
    '[class*="summary"], [class*="overview"]',
    'article, main, [role="main"]',
  ];

  for (const selector of descriptionSelectors) {
    const descElements = $(selector);
    for (let i = 0; i < descElements.length && !description; i++) {
      let text = descElements.eq(i).text().replace(/\s+/g, " ").trim();
      
      // Skip sections with too little or too much text
      if (text.length < 150 || text.length > 3000) continue;
      
      // Skip common non-description sections
      const lowerText = text.toLowerCase();
      if (lowerText.includes("minimum qualifications") || 
          lowerText.includes("required qualifications") ||
          lowerText.includes("preferred qualifications") ||
          lowerText.includes("location") ||
          lowerText.includes("job location") ||
          lowerText.includes("work location") ||
          lowerText.includes("job id") ||
          text.length > 2000) {
        // Look for the part before these keywords
        const beforeLoc = text.split(/(?:location|job location|work location|job id|minimum qualifications|required qualifications)/i)[0];
        if (beforeLoc.length < 150) continue;
        text = beforeLoc;
      }

      // Extract sentences
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
      const relevantSentences = sentences
        .filter(s => {
          const trimmed = s.trim();
          const lower = trimmed.toLowerCase();
          return trimmed.length > 25 && 
                 trimmed.length < 400 && 
                 !trimmed.match(/^([\d\-–]+|[A-Z]{2,}|[^a-z]*$)/) &&
                 !lower.includes("qualifications") &&
                 !lower.includes("location") &&
                 !lower.includes("apply now") &&
                 !lower.includes("job id") &&
                 !lower.includes("posting id");
        })
        .slice(0, 4)
        .map(s => s.trim());

      if (relevantSentences.length >= 1 && relevantSentences.join(" ").length > 50) {
        description = relevantSentences.join(" ");
        console.log(`[AI Service] Description from selector`);
        break;
      }
    }
    if (description) break;
  }

  // Strategy 2: Use regex patterns on full text (look for job description specifically)
  if (!description || description.length < 80) {
    const descPatterns = [
      /(?:about the (?:role|job|position)|role (?:overview|description)|job description|position overview|in this role)[\s:]*([^.!?]{80,700}(?:[.!?][^.!?]{0,200})?[.!?])/i,
      /(?:responsibilities|what you['`]ll (?:do|be doing)|key (?:responsibilities|duties))[\s:]*([^.!?]{80,700}[.!?])/i,
      /(?:this (?:role|position|job) (?:involves|is responsible for)|your impact|the role)[\s:]*([^.!?]{80,700}[.!?])/i,
      /(?:we['`]re hiring|we are hiring|we seek|we need)[\s:]+(?:a |an |the )?[A-Za-z\s]+[\s,]+([^.!?]{80,700}[.!?])/i,
    ];

    for (const pattern of descPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        const candidate = (match[match.length - 1] || "").trim();
        const candLower = candidate.toLowerCase();
        if (candidate.length > 80 && 
            candidate.length < 800 && 
            !candLower.includes("qualifications") &&
            !candLower.includes("location") &&
            !candLower.includes("job id")) {
          description = candidate;
          console.log(`[AI Service] Description from pattern`);
          break;
        }
      }
    }
  }

  // Strategy 3: Fallback - extract first meaningful sentences
  if (!description || description.length < 80) {
    const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [];
    const meaningfulSentences = sentences
      .filter(s => {
        const trimmed = s.trim();
        const lower = trimmed.toLowerCase();
        return trimmed.length > 30 && 
               trimmed.length < 500 && 
               !trimmed.match(/^\d+|^[A-Z]{2,}$|^[^a-z]*$/) &&
               !lower.includes("qualifications") &&
               !lower.includes("location") &&
               !lower.includes("apply") &&
               !lower.includes("job id") &&
               !lower.includes("posting id");
      })
      .slice(0, 4)
      .map(s => s.trim())
      .join(" ");
    
    description = meaningfulSentences.substring(0, 800).trim() || cleanText.substring(0, 500);
  }

  // Final cleanup - ensure description is valid
  if (description.length < 80 || description.match(/^[\s,]/)) {
    description = "Job details available on the posting.";
  } else if (description.length > 800) {
    // Truncate at sentence boundary
    const truncated = description.substring(0, 800);
    const lastPeriod = truncated.lastIndexOf(".");
    if (lastPeriod > 100) {
      description = truncated.substring(0, lastPeriod + 1);
    } else {
      description = truncated;
    }
  }

  return {
    companyName: company,
    jobTitle: title,
    jobDescription: description.trim(),
    status: "pending",
    titleFromPage,
  };
}
