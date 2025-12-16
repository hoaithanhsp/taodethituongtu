import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { GeneratedContent } from "../types";

// Get API key with priority: localStorage > environment variable
const getApiKey = (): string => {
  const userApiKey = localStorage.getItem('gemini_api_key');
  return userApiKey || process.env.API_KEY || '';
};

export const generateExams = async (
  base64Data: string, 
  mimeType: string
): Promise<GeneratedContent> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("API key is missing. Please provide your Gemini API key.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: "Hãy phân tích đề thi này và tạo ra 2 đề thi tương tự theo hướng dẫn hệ thống."
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.5, // Balanced for creativity but strict on structure
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: {
              type: Type.STRING,
              description: "Phân tích chi tiết cấu trúc, ma trận đề thi mẫu."
            },
            exam1: {
              type: Type.STRING,
              description: "Đề thi tương tự số 1 kèm đáp án chi tiết."
            },
            exam2: {
              type: Type.STRING,
              description: "Đề thi tương tự số 2 kèm đáp án chi tiết."
            }
          },
          required: ["analysis", "exam1", "exam2"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text) as GeneratedContent;
    return result;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Provide detailed error messages for common issues
    if (error.message?.includes('RESOURCE_EXHAUSTED') || error.status === 429) {
      throw new Error("RESOURCE_EXHAUSTED: API quota exceeded. Please check your API key limits.");
    }
    if (error.status === 403) {
      throw new Error("API key not valid or permission denied (403). Please verify your API key.");
    }
    if (error.status === 400) {
      throw new Error(`Bad Request (400): ${error.message || 'Invalid request parameters'}`);
    }
    if (error.message?.includes('API key')) {
      throw new Error(`API Key Error: ${error.message}`);
    }
    
    // Return the original error message for other cases
    throw new Error(error.message || "Unknown error occurred while generating exams");
  }
};