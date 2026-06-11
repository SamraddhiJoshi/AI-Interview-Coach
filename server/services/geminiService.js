const https = require("https");

/**
 * Call Gemini 1.5 Flash API to evaluate mock interview responses
 * @param {string} role Target job role
 * @param {string} experienceLevel Target experience level
 * @param {string[]} questions Array of interview questions
 * @param {string[]} answers Array of candidate answers
 * @returns {Promise<object>} Parsed evaluation results
 */
const evaluateInterview = (role, experienceLevel, questions, answers) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      return reject(new Error("GEMINI_API_KEY is not defined in environment variables."));
    }

    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Prepare Q&A pair block for the prompt
    const qaBlock = questions
      .map((q, i) => `Question ${i + 1}: ${q}\nCandidate Answer: ${answers[i] ? answers[i].trim() : "(No answer provided)"}`)
      .join("\n\n");

    const prompt = `You are a senior technical interviewer. Evaluate the candidate's responses for a mock interview.
Role: ${role}
Experience Level: ${experienceLevel}

Questions and candidate's answers:
${qaBlock}

Provide a JSON response ONLY. Do not include markdown formatting or backticks around the JSON (e.g. do not wrap in \`\`\`json ... \`\`\`). It must be raw parsable JSON.
Required JSON format:
{
  "score": <numeric score between 1 and 10 representing overall performance>,
  "strengths": [
    "strength point 1",
    "strength point 2"
  ],
  "weaknesses": [
    "weakness point 1",
    "weakness point 2"
  ],
  "suggestions": [
    "actionable improvement suggestion 1",
    "actionable improvement suggestion 2"
  ],
  "hiringRecommendation": "A concise hiring recommendation summary string"
}
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
      timeout: 30000, // 30 seconds timeout
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
            return reject(new Error("Empty response content from Gemini API."));
          }

          // Parse the candidate JSON returned by Gemini
          let parsed;
          try {
            const cleanText = responseText.replace(/```(?:json)?|```/g, "").trim();
            parsed = JSON.parse(cleanText);
          } catch (jsonErr) {
            console.error("Gemini output was not valid JSON. Response raw text was:", responseText);
            return reject(new Error(`Failed to parse Gemini evaluation JSON: ${jsonErr.message}`));
          }

          // Validate required fields
          const requiredKeys = ["score", "strengths", "weaknesses", "suggestions", "hiringRecommendation"];
          const missingKeys = requiredKeys.filter((k) => parsed[k] === undefined);

          if (missingKeys.length > 0) {
            return reject(new Error(`Gemini response is missing required keys: ${missingKeys.join(", ")}`));
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
      reject(new Error("Gemini API request timed out after 30 seconds."));
    });

    req.write(payload);
    req.end();
  });
};

/**
 * Call Gemini to generate personalized interview questions based on candidate's resume
 * @param {string} role Target job role
 * @param {string} experienceLevel Target experience level
 * @param {number} numQuestions Number of questions to generate
 * @param {object} parsedData Resume parsed data (skills, projects, etc.)
 * @returns {Promise<string[]>} Array of questions
 */
const generatePersonalizedQuestions = (role, experienceLevel, numQuestions, parsedData) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      return reject(new Error("GEMINI_API_KEY is not defined."));
    }

    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const resumeContext = `
Skills: ${parsedData.skills?.join(", ") || "None listed"}
Technologies: ${parsedData.technologies?.join(", ") || "None listed"}
Programming Languages: ${parsedData.programmingLanguages?.join(", ") || "None listed"}
Projects: ${parsedData.projects?.map(p => p.name).join(", ") || "None listed"}
Education: ${parsedData.education?.map(e => e.degree).join(", ") || "None listed"}
    `.trim();

    const prompt = `You are an expert technical interviewer. Create a customized interview for a candidate.
Role: ${role}
Experience Level: ${experienceLevel}
Number of Questions: ${numQuestions}

Candidate Background:
${resumeContext}

Generate exactly ${numQuestions} highly personalized interview questions for this candidate.
The questions should specifically target the technologies, skills, and projects listed in their background.
Include a mix of conceptual questions, practical scenario questions, and questions asking them to explain their past projects.

Provide a JSON response ONLY. Do not include markdown formatting or backticks around the JSON. It must be raw parsable JSON.
Required JSON format:
{
  "questions": [
    "Question 1",
    "Question 2",
    ...
  ]
}
`;

    const payload = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
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
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          if (res.statusCode !== 200) {
            return reject(new Error(`Gemini API returned status ${res.statusCode}: ${data}`));
          }

          const responseBody = JSON.parse(data);
          const responseText = responseBody.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!responseText || responseText.trim() === "") {
            return reject(new Error("Empty response content from Gemini."));
          }

          let parsed;
          try {
            const cleanText = responseText.replace(/```(?:json)?|```/g, "").trim();
            parsed = JSON.parse(cleanText);
          } catch (jsonErr) {
            return reject(new Error(`Failed to parse Gemini JSON: ${jsonErr.message}`));
          }

          if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
            return reject(new Error("Gemini response is missing the questions array."));
          }

          // Ensure exactly the requested number of questions
          const finalQuestions = parsed.questions.slice(0, numQuestions);
          resolve(finalQuestions);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", (err) => { reject(err); });
    req.on("timeout", () => { req.destroy(); reject(new Error("Gemini API request timed out.")); });

    req.write(payload);
    req.end();
  });
};

module.exports = {
  evaluateInterview,
  generatePersonalizedQuestions,
};
