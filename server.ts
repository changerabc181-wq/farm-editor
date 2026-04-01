import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // AI Initialization
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  // --- API Routes ---

  // Catalog API
  app.get("/api/catalog/object-types", async (req, res) => {
    res.json([
      { id: "crop", name: "Crops", file: "crops" },
      { id: "item", name: "Items", file: "items" },
      { id: "npc", name: "NPCs", file: "npcs" },
      { id: "fish", name: "Fish", file: "fish" },
      { id: "recipe", name: "Recipes", file: "recipes" },
      { id: "shop", name: "Shops", file: "shops" },
      { id: "quest", name: "Quests", file: "quests" },
      { id: "festival", name: "Festivals", file: "festivals" },
      { id: "dialogue", name: "Dialogues", file: "dialogues" }
    ]);
  });

  // GitHub Proxy API
  app.get("/api/github/data/:file", async (req, res) => {
    try {
      const response = await fetch(`https://raw.githubusercontent.com/changerabc181-wq/farm/main/data/${req.params.file}.json`);
      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch from GitHub" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Map API
  app.get("/api/maps", async (req, res) => {
    res.json([]);
  });

  app.post("/api/maps/assist/generate", async (req, res) => {
    const { prompt } = req.body;
    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          Generate a 2D farm map layout based on this prompt: "${prompt}".
          The map is a 30x20 grid.
          Return a JSON object with a "tiles" array (600 numbers, 0 for grass, 1 for dirt, 2 for water) 
          and an "objects" array of { x, y, type }.
          Respond ONLY with the JSON.
        `,
      });
      const text = response.text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        res.json(JSON.parse(jsonMatch[0]));
      } else {
        res.status(500).send("Failed to parse AI response");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("AI Generation failed");
    }
  });

  app.post("/api/maps/assist/polish", async (req, res) => {
    const { map } = req.body;
    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `
          Polish this 2D farm map layout. 
          Current Map: ${JSON.stringify(map)}
          Add more details like decorative objects, better water placement, and natural-looking dirt paths.
          The map is a 30x20 grid.
          Return a JSON object with the updated "tiles" and "objects".
          Respond ONLY with the JSON.
        `,
      });
      const text = response.text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        res.json(JSON.parse(jsonMatch[0]));
      } else {
        res.status(500).send("Failed to parse AI response");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("AI Polish failed");
    }
  });

  // Asset API
  app.post("/api/assets/generate", async (req, res) => {
    const { prompt, type } = req.body;
    try {
      // Using gemini-2.5-flash-image for image generation
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `Generate a pixel art sprite for a ${type} in a farm game. Style: Cute, vibrant, 32x32 pixel art. Description: ${prompt}`,
            },
          ],
        },
      });
      
      let imageUrl = "";
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        res.json({ imageUrl });
      } else {
        res.status(500).send("No image generated");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Asset generation failed");
    }
  });

  // --- Vite Middleware ---
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
