import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "AI API is running" });
});

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;
const MODEL_NAME = "gemini-3-flash-preview";

// Use a more flexible path handling
const aiRouter = express.Router();

const handleAIError = (error: any, res: express.Response) => {
  console.error("AI Error Details:", JSON.stringify(error, null, 2));
  
  let status = 500;
  let code = "UNKNOWN_ERROR";
  let message = "An unexpected error occurred while processing the AI request.";

  if (error.message?.includes("GEMINI_API_KEY not configured")) {
    status = 401;
    code = "CONFIG_ERROR";
    message = "The Gemini API key is missing. Please add it to your environment variables.";
  } else if (error.status === 429 || error.message?.includes("429")) {
    status = 429;
    code = "RATE_LIMIT_ERROR";
    message = "You've reached the AI request limit. Please try again in 1 minute.";
  } else if (error.status === 400 || error.message?.includes("400")) {
    status = 400;
    code = "BAD_REQUEST";
    message = "The request was invalid. This might be due to safety filters or input size.";
  } else if (error.message) {
    message = error.message;
    code = "AI_ERROR";
  }

  res.status(status).json({ error: { code, message, original: error.message } });
};

aiRouter.post("/explain", async (req, res) => {
  try {
    if (!genAI) throw new Error("GEMINI_API_KEY not configured. Please add it to Vercel Environment Variables.");
    const { topic, context } = req.body;
    const prompt = `You are an expert tutor. Explain the following topic in a clear, concise, and engaging way for a student: "${topic}". ${context ? `Context: ${context}` : ""} Use Markdown for formatting (bolding, lists, headers) to make it information-rich and easy to scan.`;
    
    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    
    res.json({ text: response.text });
  } catch (error: any) {
    handleAIError(error, res);
  }
});

aiRouter.post("/concepts", async (req, res) => {
  try {
    if (!genAI) throw new Error("GEMINI_API_KEY not configured. Please add it to Vercel Environment Variables.");
    const { topic, context } = req.body;
    const prompt = `Based on the following topic and description, generate 3-5 key concepts that a student should understand. Topic: "${topic}". Description: "${context}".`;

    const response = await genAI.models.generateContent({ 
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
            },
            required: ["title", "content"],
          },
        },
      },
    });
    
    res.json(JSON.parse(response.text || "[]"));
  } catch (error: any) {
    handleAIError(error, res);
  }
});

aiRouter.post("/flashcards", async (req, res) => {
  try {
    if (!genAI) throw new Error("GEMINI_API_KEY not configured. Please add it to Vercel Environment Variables.");
    const { topic, context } = req.body;
    const prompt = `Based on the following topic and description, generate 5 study flashcards (question, answer, and a short hint). Topic: "${topic}". Description: "${context}".`;

    const response = await genAI.models.generateContent({ 
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
              hint: { type: Type.STRING },
            },
            required: ["question", "answer", "hint"],
          },
        },
      },
    });
    
    res.json(JSON.parse(response.text || "[]"));
  } catch (error: any) {
    handleAIError(error, res);
  }
});

app.use("/api/ai", aiRouter);
// Fallback local mount for development if prefixed differently
app.use("/ai", aiRouter);

export default app;
