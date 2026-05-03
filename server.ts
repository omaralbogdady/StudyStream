import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini Setup
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = apiKey ? new GoogleGenAI(apiKey) : null;
  const MODEL_NAME = "gemini-1.5-flash"; // Using 1.5 flash as it's standard and stable for production-like builds if 3.1 lite is flaky on some regions

  app.post("/api/ai/explain", async (req, res) => {
    try {
      if (!genAI) throw new Error("GEMINI_API_KEY not configured");
      const { topic, context } = req.body;
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const prompt = `You are an expert tutor. Explain the following topic in a clear, concise, and engaging way for a student: "${topic}". ${context ? `Context: ${context}` : ""} Use Markdown for formatting (bolding, lists, headers) to make it information-rich and easy to scan.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      res.json({ text: response.text() });
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/concepts", async (req, res) => {
    try {
      if (!genAI) throw new Error("GEMINI_API_KEY not configured");
      const { topic, context } = req.body;
      const model = genAI.getGenerativeModel({ 
        model: MODEL_NAME,
        generationConfig: {
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
      
      const prompt = `Based on the following topic and description, generate 3-5 key concepts that a student should understand. Topic: "${topic}". Description: "${context}".`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      res.json(JSON.parse(response.text()));
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/flashcards", async (req, res) => {
    try {
      if (!genAI) throw new Error("GEMINI_API_KEY not configured");
      const { topic, context } = req.body;
      const model = genAI.getGenerativeModel({ 
        model: MODEL_NAME,
        generationConfig: {
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
      
      const prompt = `Based on the following topic and description, generate 5 study flashcards (question, answer, and a short hint). Topic: "${topic}". Description: "${context}".`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      res.json(JSON.parse(response.text()));
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
