
import { GoogleGenAI, Type } from "@google/genai";
import { TranscriptionResponse, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const transcribeAndTranslateMedia = async (
  targetLanguage: Language,
  mediaData?: { base64: string; mimeType: string },
  youtubeUrl?: string
): Promise<TranscriptionResponse> => {
  const targetLanguageName = targetLanguage === Language.INDONESIAN ? 'Indonesian' : 'English';
  
  const promptBase = `You are a professional subtitle creator. Your goal is to produce subtitles in ${targetLanguageName}.
  
  INSTRUCTIONS:
  1. Detect the language spoken or the content of the media.
  2. Produce a precise transcription if the source matches ${targetLanguageName}, or a faithful translation if it differs.
  3. All output MUST be in ${targetLanguageName}.
  4. Ensure all timestamps are perfectly synced and follow the SRT standard logic.
  
  FORMATTING:
  - Return a JSON object with a "subtitles" array.
  - Each item must have:
    - "start": start time in seconds (number)
    - "end": end time in seconds (number)
    - "text": the ${targetLanguageName} text.
  - Keep lines brief (max 10 words).`;

  try {
    const contents: any[] = [];
    let config: any = {
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
    };

    if (youtubeUrl) {
      contents.push({ 
        parts: [{ text: `${promptBase}\n\nTask: Generate subtitles for this YouTube video: ${youtubeUrl}. Use your tools to find the transcript or dialogue.` }] 
      });
      // Enable Search Grounding for YouTube links
      config.tools = [{ googleSearch: {} }];
    } else if (mediaData) {
      contents.push({
        parts: [
          { text: promptBase },
          {
            inlineData: {
              data: mediaData.base64,
              mimeType: mediaData.mimeType,
            },
          },
        ],
      });
    } else {
      throw new Error("No source provided");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config,
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response from AI");
    
    return JSON.parse(resultText) as TranscriptionResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to process media. Please ensure the file or link is valid.");
  }
};
