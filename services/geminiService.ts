import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIResponse, ImageSize } from "../types";

// Ensure API Key is present
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// System instruction to guide the AI Dungeon Master
const SYSTEM_INSTRUCTION = `
You are an advanced AI Dungeon Master for an immersive text-based adventure game.
Your goal is to create an "infinite choose-your-own-adventure" experience.
My choices must genuinely alter the upcoming plot; do not use pre-set paths.

Rules:
1.  **Response Format**: You MUST always respond with a valid JSON object strictly matching the schema provided.
2.  **Narrative**: Be descriptive, engaging, and atmospheric. Use the second person ("You enter a dark room...").
3.  **Visuals**: Provide a 'visual_description' that describes the current scene vividly for an image generator. Keep it focused on the environment and characters. Always enforce a consistent "Fantasy Digital Painting" art style in this description.
4.  **Game State**: Track the user's 'inventory' and 'current_quest'.
    *   If the user finds an item, list it in 'inventory_changes.add'.
    *   If the user loses/uses an item, list it in 'inventory_changes.remove'.
    *   If the quest changes or advances, provide a string in 'quest_update'. If no change, return null or omit.
5.  **Options**: Provide 2-4 short, actionable choices for the user in the 'options' array.

Your JSON output schema is strict. Do not include markdown formatting (like \`\`\`json) outside the pure JSON string if possible, but the parser will handle it.
`;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    narrative: {
      type: Type.STRING,
      description: "The main story text segment.",
    },
    options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Suggested actions for the user.",
    },
    inventory_changes: {
      type: Type.OBJECT,
      properties: {
        add: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        remove: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    },
    quest_update: {
      type: Type.STRING,
      description: "The new quest status or objective. Null if unchanged.",
    },
    visual_description: {
      type: Type.STRING,
      description: "A standalone prompt for an image generator to visualize this scene.",
    },
  },
  required: ["narrative", "options", "visual_description", "inventory_changes"],
};

export const geminiService = {
  // Use Flash Lite for fast text responses as requested
  async generateStorySegment(history: { role: string; parts: { text: string }[] }[], userInput: string): Promise<AIResponse> {
    try {
      // We use the low-latency model for the text engine
      const model = 'gemini-flash-lite-latest'; 
      
      const contents = [
        ...history,
        { role: 'user', parts: [{ text: userInput }] }
      ];

      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.7, // slightly creative but focused
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");

      try {
        return JSON.parse(text) as AIResponse;
      } catch (e) {
        console.error("Failed to parse JSON response:", text);
        // Fallback if JSON is malformed (rare with schema)
        return {
          narrative: text,
          options: ["Continue"],
          inventory_changes: {},
          visual_description: "A mysterious scene in a fantasy world.",
        };
      }

    } catch (error) {
      console.error("Story generation error:", error);
      throw error;
    }
  },

  // Use Pro Image Preview for high quality images as requested
  async generateSceneImage(prompt: string, size: ImageSize): Promise<string> {
    try {
      const model = 'gemini-3-pro-image-preview';
      
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            imageSize: size, // 1K, 2K, or 4K
            aspectRatio: "16:9", // Cinematic
          }
        }
      });

      // Find the image part
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      
      throw new Error("No image data found in response");

    } catch (error) {
      console.error("Image generation error:", error);
      // Return a placeholder if generation fails to avoid breaking the UI flow completely
      return `https://picsum.photos/seed/${Math.random()}/800/450?grayscale&blur=2`;
    }
  }
};
