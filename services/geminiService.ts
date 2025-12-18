import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { GeneratedContent } from "../types";

const MODELS = [
  'gemini-3-pro-preview',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.5-pro'
];

export const generateExams = async (
  base64Data: string,
  mimeType: string,
  userApiKey?: string
): Promise<GeneratedContent> => {
  const apiKey = userApiKey || process.env.API_KEY || '';
  if (!apiKey) {
    throw new Error("Vui lòng nhập Gemini API Key trong phần Cài đặt");
  }

  const ai = new GoogleGenAI({ apiKey });
  let lastError: any = null;

  for (const modelName of MODELS) {
    try {
      console.log(`Trying model: ${modelName}`);
      const response = await ai.models.generateContent({
        model: modelName,
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
          temperature: 0.5,
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

    } catch (error) {
      console.warn(`Model ${modelName} failed:`, error);
      lastError = error;
      // Continue to next model
    }
  }

  throw lastError || new Error("All models failed");
};
