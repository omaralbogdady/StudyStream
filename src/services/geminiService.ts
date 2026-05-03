import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    // In React/Vite in this environment, process.env.GEMINI_API_KEY is injected.
    // However, we must pass it in an object as { apiKey: ... }
    aiInstance = new GoogleGenAI({ apiKey: key || "" });
  }
  return aiInstance;
};

export interface GeneratedConcept {
  title: string;
  content: string;
}

export interface GeneratedFlashcard {
  question: string;
  answer: string;
  hint: string;
}

const MODEL_NAME = "gemini-3.1-flash-lite-preview";

export const explainTopic = async (topic: string, context: string = "") => {
  try {
    const ai = getAI();
    const prompt = `You are an expert tutor. Explain the following topic in a clear, concise, and engaging way for a student: "${topic}". ${context ? `Context: ${context}` : ""} Use Markdown for formatting (bolding, lists, headers) to make it information-rich and easy to scan.`;
    
    const response = await ai.models.generateContent({
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
  try {
    const ai = getAI();
    const prompt = `Based on the following topic and description, generate 3-5 key concepts that a student should understand. Topic: "${topic}". Description: "${context}".`;
    
    const response = await ai.models.generateContent({
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
    
    const text = response.text;
    if (!text) throw new Error("No response text from AI");
    return JSON.parse(text) as GeneratedConcept[];
  } catch (error) {
    console.error("Error in generateConcepts:", error);
    throw error;
  }
};

export const generateFlashcards = async (topic: string, context: string = "") => {
  try {
    const ai = getAI();
    const prompt = `Based on the following topic and description, generate 5 study flashcards (question, answer, and a short hint). Topic: "${topic}". Description: "${context}".`;
    
    const response = await ai.models.generateContent({
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
    
    const text = response.text;
    if (!text) throw new Error("No response text from AI");
    return JSON.parse(text) as GeneratedFlashcard[];
  } catch (error) {
    console.error("Error in generateFlashcards:", error);
    throw error;
  }
};
