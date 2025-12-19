
import { GoogleGenAI, Type } from "@google/genai";
import { TranscriptionResponse, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const transcribeAndTranslateMedia = async (
  base64Data: string,
  mimeType: string,
  targetLanguage: Language
): Promise<TranscriptionResponse> => {
  const targetLanguageName = targetLanguage === Language.INDONESIAN ? 'Indonesian' : 'English';
  
  const prompt = `You are a professional subtitle creator. 
  Your goal is to produce subtitles in ${targetLanguageName}.
  
  INSTRUCTIONS:
  1. Detect the language spoken in the media.
  2. If the audio is ALREADY in ${targetLanguageName}, perform a precise transcription (Transkripsi).
  3. If the audio is in a DIFFERENT language, perform a faithful translation into ${targetLanguageName} (Terjemahan).
  4. Ensure all timestamps are perfectly synced with the speech.
  5. The output MUST be in ${targetLanguageName}.
  
  FORMATTING:
  - Return a JSON object with a "subtitles" array.
  - Each item must have:
    - "start": start time in seconds (number)
    - "end": end time in seconds (number)
    - "text": the ${targetLanguageName} text.
  - Keep each subtitle line brief (max 10 words).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtitles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  start: { type: Type.NUMBER },
                  end: { type: Type.NUMBER },
                  text: { type: Type.STRING },
                },
                required: ["start", "end", "text"],
              },
            },
          },
          required: ["subtitles"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response from AI");
    
    return JSON.parse(resultText) as TranscriptionResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Gagal memproses media. Pastikan file tidak rusak dan coba lagi.");
  }
};
