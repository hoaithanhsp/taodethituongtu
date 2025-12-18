import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { GeneratedContent, GenerationOptions } from "../types";

const MODELS = [
  'gemini-3-pro-preview',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.5-pro'
];

export const generateExams = async (
  base64Data: string,
  mimeType: string,
  userApiKey?: string,
  options?: GenerationOptions
): Promise<GeneratedContent> => {
  const apiKey = userApiKey || process.env.API_KEY || '';
  if (!apiKey) {
    throw new Error("Vui lòng nhập Gemini API Key trong phần Cài đặt");
  }

  const ai = new GoogleGenAI({ apiKey });
  let lastError: any = null;

  // Construct Dynamic Instruction based on Options
  let customInstructions = "";
  if (options) {
    // Diagram Mode Handling
    if (options.diagramMode === 'detailed') {
      customInstructions += `\n\n### YÊU CẦU NÂNG CAO VỀ HÌNH VẼ (High Detail):
- Ưu tiên sử dụng thư viện TikZ chuyên sâu (như tkz-euclide cho hình học phẳng).
- Với hình không gian: Vẽ chính xác tỉ lệ, nét đứt/liền chuẩn xác, góc nhìn trực quan nhất.
- Với đồ thị: Hiển thị đầy đủ tiệm cận, bảng biến thiên (nếu cần), điểm cực trị.`;
    } else {
      customInstructions += `\n\n### YÊU CẦU VỀ HÌNH VẼ (Standard):
- Sử dụng TikZ cơ bản, tối ưu tốc độ sinh và độ tương thích.`;
    }

    // Solution Mode Handling
    if (options.solutionMode === 'concise') {
      customInstructions += `\n\n### YÊU CẦU VỀ LỜI GIẢI (Concise Mode):
- TRẢ LỜI NGẮN GỌN. Tập trung vào đáp số và 1-2 bước biến đổi mẫu chốt.
- Bỏ qua các bước trung gian hiển nhiên.`;
    } else if (options.solutionMode === 'very_detailed') {
      customInstructions += `\n\n### YÊU CẦU VỀ LỜI GIẢI (Deep Dive Mode):
- GIẢI CỰC KỲ CHI TIẾT. Mỗi bài toán khó phải có cấu trúc:
  1. [Phân tích đề]: Nhận diện dạng toán, từ khóa.
  2. [Chiến lược]: Tóm tắt hướng đi.
  3. [Lời giải]: Từng bước một, có chú thích bên cạnh (Tại sao lại biến đổi như vậy).
  4. [Lưu ý/Sai lầm thường gặp]: Cảnh báo lỗi học sinh hay mắc.`;
    } else {
      customInstructions += `\n\n### YÊU CẦU VỀ LỜI GIẢI (Standard Mode):
- Lời giải chi tiết, đầy đủ các bước, trình bày sư phạm, dễ hiểu.`;
    }
  }

  const finalSystemInstruction = SYSTEM_INSTRUCTION + customInstructions;

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
              // Adding instruction reference in user prompt effectively reinforces the system instruction
              text: "Hãy phân tích đề thi này và tạo ra 2 đề thi tương tự theo hướng dẫn hệ thống và các yêu cầu bổ sung về độ chi tiết."
            }
          ]
        },
        config: {
          systemInstruction: finalSystemInstruction,
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
