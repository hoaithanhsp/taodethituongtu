import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { GeneratedContent } from "../types";

export const generateExams = async (
  apiKey: string,
  base64Data: string,
  mimeType: string
): Promise<GeneratedContent> => {
  try {
    if (!apiKey) {
      throw new Error("Vui lòng nhập Gemini API Key để tiếp tục.");
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
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

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
