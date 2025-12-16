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

  // Retry logic for 503 errors
  const maxRetries = 2;
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash', // Stable and reliable model
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
      lastError = error;

      // If it's a 503 error and we have retries left, wait and retry
      if ((error.status === 503 || error.message?.includes('overloaded') || error.message?.includes('UNAVAILABLE')) && attempt < maxRetries) {
        const waitTime = (attempt + 1) * 2000; // 2s, 4s
        console.log(`Attempt ${attempt + 1} failed with 503. Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue; // Retry
      }

      // For other errors or last attempt, break and handle below
      break;
    }
  }

  // Handle the error after all retries exhausted
  console.error("Gemini API Error:", lastError);

  // Provide detailed error messages for common issues
  if (lastError.status === 503 || lastError.message?.includes('overloaded') || lastError.message?.includes('UNAVAILABLE')) {
    throw new Error("Model đang quá tải (503 - UNAVAILABLE). Gemini AI đang xử lý quá nhiều request. Vui lòng thử lại sau 30-60 giây.");
  }
  if (lastError.message?.includes('RESOURCE_EXHAUSTED') || lastError.status === 429) {
    throw new Error("RESOURCE_EXHAUSTED: API quota exceeded. Please check your API key limits.");
  }
  if (lastError.status === 403) {
    throw new Error("API key not valid or permission denied (403). Please verify your API key.");
  }
  if (lastError.status === 400) {
    throw new Error(`Bad Request (400): ${lastError.message || 'Invalid request parameters'}`);
  }
  if (lastError.message?.includes('API key')) {
    throw new Error(`API Key Error: ${lastError.message}`);
  }

  // Return the original error message for other cases
  throw new Error(lastError.message || "Unknown error occurred while generating exams");
};
