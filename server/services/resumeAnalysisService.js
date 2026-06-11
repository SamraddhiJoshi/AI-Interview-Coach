const pdf = require("pdf-parse");
const https = require("https");

/**
 * Extract text from a PDF buffer
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<string>} - Extracted text
 */
const extractTextFromPDF = async (buffer) => {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error("PDF Parsing Error:", error);
    throw new Error("Failed to extract text from PDF");
  }
};

/**
 * Call Gemini to analyze the resume text and extract structured data
 * @param {string} text - The raw text extracted from the resume
 * @returns {Promise<object>} - Parsed JSON object containing skills, projects, etc.
 */
const analyzeResume = (text) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      return reject(new Error("GEMINI_API_KEY is not defined."));
    }

    if (!text || text.trim() === "") {
      return reject(new Error("Empty resume text provided."));
    }

    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const prompt = `You are an expert technical recruiter and resume parser.
Extract the following information from the provided resume text.

Return a JSON object ONLY. Do not include markdown formatting, backticks, or any conversational text.

Required JSON structure:
{
  "skills": ["skill1", "skill2"], // General skills
  "technologies": ["tech1", "tech2"], // Specific tools, frameworks, databases
  "programmingLanguages": ["lang1", "lang2"],
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief 1-2 sentence description of the project"
    }
  ],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Duration string (e.g. Jan 2020 - Present)"
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "University/College Name"
    }
  ],
  "certifications": ["Cert 1", "Cert 2"]
}

If a section is missing from the resume, return an empty array for that field.

Resume Text:
"""
${text}
"""
`;

    const payload = JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
      timeout: 30000,
    };

    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          if (res.statusCode !== 200) {
            return reject(new Error(`Gemini API returned status ${res.statusCode}: ${data}`));
          }

          const responseBody = JSON.parse(data);
          const responseText = responseBody.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!responseText || responseText.trim() === "") {
            return reject(new Error("Empty response from Gemini."));
          }

          let parsed;
          try {
            const cleanText = responseText.replace(/```(?:json)?|```/g, "").trim();
            parsed = JSON.parse(cleanText);
          } catch (jsonErr) {
            return reject(new Error(`Failed to parse Gemini JSON: ${jsonErr.message}`));
          }

          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Gemini API request timed out."));
    });

    req.write(payload);
    req.end();
  });
};

// Aliases for compatibility with the required function names in the prompt
const extractSkills = async (text) => {
  const result = await analyzeResume(text);
  return result.skills || [];
};

const extractProjects = async (text) => {
  const result = await analyzeResume(text);
  return result.projects || [];
};

const extractExperience = async (text) => {
  const result = await analyzeResume(text);
  return result.experience || [];
};

module.exports = {
  extractTextFromPDF,
  analyzeResume,
  extractSkills,
  extractProjects,
  extractExperience,
};
