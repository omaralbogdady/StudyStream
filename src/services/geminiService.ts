import { GoogleGenAI, Type } from "@google/genai";

// Initialization should happen once. 
// In AI Studio, process.env.GEMINI_API_KEY is available in the environment.
// For standard Vite/Vercel environments, we may need to handle fallback or provided keys.
const apiKey = (process.env.GEMINI_API_KEY) || "";
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;
const MODEL_NAME = "gemini-3-flash-preview";

export interface GeneratedConcept {
  title: string;
  content: string;
}

export interface GeneratedFlashcard {
  question: string;
  answer: string;
  hint: string;
}

export const explainTopic = async (topic: string, context: string = "") => {
  if (!genAI) {
    throw new Error("Gemini AI is not configured. Please check your environment variables.");
  }
  
  try {
    const prompt = `You are an expert tutor. Explain the following topic in a clear, concise, and engaging way for a student: "${topic}". ${context ? `Context: ${context}` : ""} Use Markdown for formatting (bolding, lists, headers) to make it information-rich and easy to scan.`;
    
    // @ts-ignore - AI Studio SDK has specific types
    const response = await (genAI as any).models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error in explainTopic:", error);
    throw error;
  }
};

export const generateConcepts = async (topic: string, context: string = "") => {
  if (!genAI) {
    throw new Error("Gemini AI is not configured. Please check your environment variables.");
  }

  try {
    const prompt = `Based on the following topic and description, generate 3-5 key concepts that a student should understand. Topic: "${topic}". Description: "${context}".`;

    // @ts-ignore - AI Studio SDK has specific types
    const response = await (genAI as any).models.generateContent({ 
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
    
    return JSON.parse(response.text || "[]") as GeneratedConcept[];
  } catch (error) {
    console.error("Error in generateConcepts:", error);
    throw error;
  }
};

export const generateFlashcards = async (topic: string, context: string = "") => {
  if (!genAI) {
    throw new Error("Gemini AI is not configured. Please check your environment variables.");
  }

  try {
    const prompt = `Based on the following topic and description, generate 5 study flashcards (question, answer, and a short hint). Topic: "${topic}". Description: "${context}".`;

    // @ts-ignore - AI Studio SDK has specific types
    const response = await (genAI as any).models.generateContent({ 
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
    
    return JSON.parse(response.text || "[]") as GeneratedFlashcard[];
  } catch (error) {
    console.error("Error in generateFlashcards:", error);
    throw error;
  }
};
