
import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const suggestSubtasks = async (taskTitle: string, description: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Desglosa la siguiente tarea en 4 o 5 subtareas accionables:
      Título: ${taskTitle}
      Descripción: ${description}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Una lista de subtareas accionables."
            }
          },
          required: ["suggestions"]
        }
      }
    });

    const data: AIResponse = JSON.parse(response.text);
    return data.suggestions || [];
  } catch (error) {
    console.error("Error fetching AI suggestions:", error);
    return [];
  }
};

export const getMotivationalMessage = async (tasksCount: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Genera una frase motivadora corta y amable en español para alguien que tiene ${tasksCount} tareas pendientes hoy. Que sea inspiradora pero no agobiante.`,
    });
    return response.text.trim();
  } catch (error) {
    return "¡Tú puedes con todo lo que te propongas hoy!";
  }
};
