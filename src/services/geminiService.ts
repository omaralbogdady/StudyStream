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
  try {
    const response = await fetch("/api/ai/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, context }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || errorData.error || "Failed to generate explanation");
    }
    
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Error in explainTopic:", error);
    throw error;
  }
};

export const generateConcepts = async (topic: string, context: string = "") => {
  try {
    const response = await fetch("/api/ai/concepts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, context }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || errorData.error || "Failed to generate concepts");
    }
    
    return await response.json() as GeneratedConcept[];
  } catch (error) {
    console.error("Error in generateConcepts:", error);
    throw error;
  }
};

export const generateFlashcards = async (topic: string, context: string = "") => {
  try {
    const response = await fetch("/api/ai/flashcards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, context }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || errorData.error || "Failed to generate flashcards");
    }
    
    return await response.json() as GeneratedFlashcard[];
  } catch (error) {
    console.error("Error in generateFlashcards:", error);
    throw error;
  }
};
