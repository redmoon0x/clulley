import { GoogleGenAI } from "@google/genai"
import fs from "fs"
import { BrowserWindow } from "electron"

export class LLMHelper {
  private ai: GoogleGenAI
  private modelName: string = "gemini-2.0-flash"
  private mainWindow: BrowserWindow | null = null
  private readonly systemPrompt = `You are Cluely, a helpful AI assistant for software engineers. When a user shares a screenshot, error message, or question, you will:

Understand the user’s intent — what are they trying to do?

Provide a concise answer or suggestion, such as code, a terminal command, or the next step they should take.

Speak directly to the user in a human, informal tone. Do not explain the answer like a teacher — answer like a teammate.

Don't mention being an AI. Don’t say "as an AI" or "based on your input." Don’t explain what you’re doing. Just help.

If the user is confused or needs help, guide them. If they seem stuck, encourage them. If their question isn't clear, ask for clarification.

Most importantly: Be useful, fast, and straight to the point.

Act as if you are answering in a meeting as a person.`

  constructor(apiKey: string, mainWindow?: BrowserWindow | null) {
    if (!apiKey) {
      console.error("[LLMHelper] No API key provided");
      throw new Error("API key is required for LLMHelper initialization");
    }
    
    console.log("[LLMHelper] Initializing with API key and model:", this.modelName);
    this.ai = new GoogleGenAI({ apiKey });
    this.mainWindow = mainWindow || null;
    
    if (this.mainWindow) {
      console.log("[LLMHelper] Main window reference provided during initialization");
    }
  }
  
  // Method to set main window reference after initialization
  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
    console.log("[LLMHelper] Main window reference set for streaming")
  }

  private async fileToGenerativePart(imagePath: string) {
    const imageData = await fs.promises.readFile(imagePath)
    return {
      inlineData: {
        data: imageData.toString("base64"),
        mimeType: "image/png"
      }
    }
  }

  // Helper method to stream replies to the UI
  public streamReply(text: string): void {
    try {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('stream-reply', text);
      } else {
        console.warn("[LLMHelper] Cannot stream reply: no valid main window reference");
      }
    } catch (error) {
      console.error("[LLMHelper] Error streaming reply:", error);
    }
  }

  private cleanJsonResponse(text: string): string {
    if (!text) {
      console.warn("[LLMHelper] Empty text passed to cleanJsonResponse");
      return "{}";
    }
    
    console.log("[LLMHelper] Cleaning JSON response, length:", text.length);
    
    // Remove markdown code block syntax if present
    text = text.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
    
    // Remove any triple backticks without language specifier
    text = text.replace(/^```\n/, '').replace(/\n```$/, '');
    
    // Remove any leading/trailing whitespace
    text = text.trim();
    
    // Check if the result is valid JSON
    try {
      JSON.parse(text);
      return text;
    } catch (error) {
      console.warn("[LLMHelper] Cleaned text is not valid JSON, applying additional fixes");
      
      // Try more aggressive cleanup if JSON parsing fails
      // Find JSON-like content between curly braces
      const match = text.match(/\{.*\}/s);
      if (match) {
        console.log("[LLMHelper] Extracted JSON-like content");
        return match[0];
      }
      
      console.error("[LLMHelper] Failed to extract valid JSON");
      return "{}";
    }
  }

  public async extractProblemFromImages(imagePaths: string[]) {
    try {
      const imageParts = await Promise.all(imagePaths.map(path => this.fileToGenerativePart(path)))
      
      const prompt = `${this.systemPrompt}\n\nAnalyze these images and provide a clear problem statement, relevant context, suggested responses, and reasoning in JSON format. Return ONLY the JSON object without any markdown or code blocks.`

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: [prompt, ...imageParts]
      })
      const text = this.cleanJsonResponse(response.text)
      return JSON.parse(text)
    } catch (error) {
      console.error("Error extracting problem from images:", error)
      throw error
    }
  }

  public async generateSolution(problemInfo: any, stream: boolean = false) {
    const prompt = `${this.systemPrompt}\n\nGiven this problem or situation:\n${JSON.stringify(problemInfo, null, 2)}\n\nProvide a solution with code, restate the problem, give context, suggest responses, and explain reasoning in JSON format. Return ONLY the JSON object without markdown or code blocks.`

    console.log(`[LLMHelper] Calling Gemini LLM for solution... (streaming: ${stream})`);
    try {
      if (stream) {
        console.log("[LLMHelper] Using streaming mode");
        return this.generateSolutionStream(prompt);
      } else {
        console.log("[LLMHelper] Using non-streaming mode");
        try {
          const response = await this.ai.models.generateContent({
            model: this.modelName,
            contents: prompt
          });
          console.log("[LLMHelper] Gemini LLM returned result.");
          
          if (!response || !response.text) {
            throw new Error("Received empty response from Gemini");
          }
          
          const text = this.cleanJsonResponse(response.text);
          try {
            const parsed = JSON.parse(text);
            console.log("[LLMHelper] Parsed LLM response:", parsed);
            return parsed;
          } catch (parseError) {
            console.error("[LLMHelper] Error parsing JSON:", parseError);
            console.error("[LLMHelper] Raw text:", text);
            throw new Error(`Failed to parse JSON response: ${parseError.message}`);
          }
        } catch (apiError) {
          console.error("[LLMHelper] API error:", apiError);
          throw new Error(`Gemini API error: ${apiError.message}`);
        }
      }
    } catch (error) {
      console.error("[LLMHelper] Error in generateSolution:", error);
      throw error;
    }
  }

  private async generateSolutionStream(prompt: string) {
    try {
      console.log("[LLMHelper] Starting streaming solution generation");
      const streamingResponse = await this.ai.models.generateContentStream({
        model: this.modelName,
        contents: prompt
      });
      
      let fullText = "";
      
      try {
        // Process each chunk in the stream
        for await (const response of streamingResponse) {
          // Each chunk contains text that we can extract
          if (response.text) {
            console.log(`[LLMHelper] Received chunk: ${response.text.substring(0, 20)}...`);
            fullText += response.text;
            this.streamReply(response.text);
          }
        }
        
        console.log("[LLMHelper] Streaming completed, total length:", fullText.length);
        
        // After streaming is complete, parse the response
        const text = this.cleanJsonResponse(fullText);
        try {
          const parsed = JSON.parse(text);
          console.log("[LLMHelper] Parsed LLM response:", parsed);
          return parsed;
        } catch (parseError) {
          console.error("[LLMHelper] Error parsing streamed response:", parseError);
          console.error("[LLMHelper] Raw text (first 100 chars):", text.substring(0, 100));
          throw new Error(`Failed to parse JSON response: ${parseError.message}`);
        }
      } catch (streamError) {
        console.error("[LLMHelper] Error during stream processing:", streamError);
        throw new Error(`Stream processing error: ${streamError.message}`);
      }
    } catch (error) {
      console.error("[LLMHelper] Error in streaming solution:", error);
      throw error;
    }
  }

  public async debugSolutionWithImages(problemInfo: any, currentCode: string, debugImagePaths: string[]) {
    try {
      const imageParts = await Promise.all(debugImagePaths.map(path => this.fileToGenerativePart(path)))
      
      const prompt = `${this.systemPrompt}\n\nGiven:\n1. The original problem or situation: ${JSON.stringify(problemInfo, null, 2)}\n2. The current response or approach: ${currentCode}\n3. The debug info in the images\n\nAnalyze and provide feedback with code, restate the problem, context, suggested responses, and reasoning in JSON format. Return ONLY the JSON object without markdown or code blocks.`

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: [prompt, ...imageParts]
      })
      const text = this.cleanJsonResponse(response.text)
      const parsed = JSON.parse(text)
      console.log("[LLMHelper] Parsed debug LLM response:", parsed)
      return parsed
    } catch (error) {
      console.error("Error debugging solution with images:", error)
      throw error
    }
  }

  public async analyzeAudioFile(audioPath: string) {
    try {
      const audioData = await fs.promises.readFile(audioPath);
      const audioPart = {
        inlineData: {
          data: audioData.toString("base64"),
          mimeType: "audio/mp3"
        }
      };
      const prompt = `${this.systemPrompt}\n\nListen to this audio clip. If it contains a question, generate a confident, natural answer the user can speak aloud — like in an interview or sales meeting. Respond in a human tone, clearly and directly. Do not describe the clip — answer it as if you are the user replying.`;
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: [prompt, audioPart]
      });
      const text = response.text;
      return { text, timestamp: Date.now() };
    } catch (error) {
      console.error("Error analyzing audio file:", error);
      throw error;
    }
  }

  public async analyzeAudioFromBase64(data: string, mimeType: string) {
    try {
      const audioPart = {
        inlineData: {
          data,
          mimeType
        }
      };
      const prompt = `${this.systemPrompt}\n\nListen to this audio clip. If it contains a question, generate a confident, natural answer the user can speak aloud — like in an interview or sales meeting. Respond in a human tone, clearly and directly. Do not describe the clip — answer it as if you are the user replying. Be concise.`;
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: [prompt, audioPart]
      });
      const text = response.text;
      return { text, timestamp: Date.now() };
    } catch (error) {
      console.error("Error analyzing audio from base64:", error);
      throw error;
    }
  }

  public async analyzeImageFile(imagePath: string) {
    try {
      const imageData = await fs.promises.readFile(imagePath);
      const imagePart = {
        inlineData: {
          data: imageData.toString("base64"),
          mimeType: "image/png"
        }
      };
      const prompt = `${this.systemPrompt}\n\nLook at this image. If it contains a question, provide a confident, helpful answer the user can read out loud in a meeting. Keep it short and natural — like you're replying in real-time. Don't describe — answer.`;
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: [prompt, imagePart]
      });
      const text = response.text;
      return { text, timestamp: Date.now() };
    } catch (error) {
      console.error("Error analyzing image file:", error);
      throw error;
    }
  }
} 