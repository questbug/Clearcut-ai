import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON request body parser with limit for larger requests
  app.use(express.json({ limit: "10mb" }));

  // API Route for AI backdrop generation
  app.post("/api/backdrop/generate", async (req, res) => {
    try {
      const { prompt, aspectRatio = "16:9" } = req.body;

      if (!prompt || typeof prompt !== "string") {
        res.status(400).json({ error: "A valid text prompt is required." });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        res.status(400).json({
          error: "Gemini API key is not configured. Please add your GEMINI_API_KEY in the Secrets panel."
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      console.log(`Generating AI backdrop for prompt: "${prompt}" with aspect ratio: ${aspectRatio}`);

      // Generate the backdrop image using gemini-3.1-flash-lite-image
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
        contents: {
          parts: [
            {
              text: `A high-quality beautiful background setting. Extremely clean, professional backdrop, high definition, photorealistic, 4k resolution, optimized for background insertion, subject is removed, space is open: ${prompt}`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
          }
        }
      });

      if (!response.candidates?.[0]?.content?.parts) {
        res.status(500).json({ error: "Failed to generate image. No content parts returned." });
        return;
      }

      let imageUrl: string | null = null;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || "image/png";
          imageUrl = `data:${mimeType};base64,${base64EncodeString}`;
          break;
        }
      }

      if (imageUrl) {
        res.json({ imageUrl });
      } else {
        res.status(500).json({ error: "No image data found in model response." });
      }
    } catch (error: any) {
      console.error("Backdrop generation error:", error);
      res.status(500).json({ error: error.message || "An error occurred during backdrop generation." });
    }
  });

  // Serve static folder/Vite dev server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
