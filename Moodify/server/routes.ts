import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { execFile } from "child_process";
import { promisify } from "util";
import { z } from "zod";
import { getPlaylistsForMood, type MoodType } from "./spotify";

const execFileAsync = promisify(execFile);

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/mood/detect", async (req, res) => {
    try {
      const schema = z.object({
        text: z.string().min(1).max(1000),
      });

      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }

      const { text } = validation.data;

      const { stdout, stderr } = await execFileAsync(
        "python3",
        ["ml/predict.py", text],
        {
          timeout: 10000,
          maxBuffer: 512 * 1024,
        }
      );

      if (stderr) {
        console.warn("Python stderr:", stderr);
      }

      const prediction = JSON.parse(stdout);

      if (prediction.error) {
        return res.status(500).json({ error: prediction.error });
      }

      const moodSession = await storage.createMoodSession({
        text,
        mood: prediction.mood,
        confidence: Math.round(prediction.confidence),
        alternativeMoods: prediction.all_predictions
          .slice(1, 4)
          .map((p: any) => `${p.mood}:${Math.round(p.confidence)}`),
      });

      res.json({
        mood: prediction.mood,
        confidence: Math.round(prediction.confidence),
        predictions: prediction.all_predictions.map((p: any) => ({
          mood: p.mood,
          confidence: Math.round(p.confidence),
        })),
        sessionId: moodSession.id,
      });
    } catch (error) {
      console.error("Mood detection error:", error);
      res.status(500).json({ error: "Failed to detect mood" });
    }
  });

  app.get("/api/mood/history", async (req, res) => {
    try {
      const schema = z.object({
        limit: z.coerce.number().int().min(1).max(200).optional().default(50),
      });

      const validation = schema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }

      const { limit } = validation.data;
      const sessions = await storage.getMoodSessions(limit);

      res.json({
        sessions: sessions.map((session) => ({
          id: session.id,
          mood: session.mood,
          confidence: session.confidence,
          date: session.createdAt,
        })),
      });
    } catch (error) {
      console.error("Mood history error:", error);
      res.status(500).json({ error: "Failed to fetch mood history" });
    }
  });

  app.get("/api/playlists/:mood", async (req, res) => {
    try {
      const schema = z.object({
        mood: z.enum(["happy", "sad", "energetic", "calm"]),
      });

      const validation = schema.safeParse(req.params);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid mood. Must be: happy, sad, energetic, or calm" });
      }

      const { mood } = validation.data;
      const playlists = await getPlaylistsForMood(mood as MoodType);

      res.json({ playlists });
    } catch (error) {
      console.error("Playlist fetch error:", error);
      res.status(500).json({ error: "Failed to fetch playlists" });
    }
  });

  app.get("/api/mood/history/range", async (req, res) => {
    try {
      const schema = z.object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      }).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
        message: "Start date must be before or equal to end date",
      });

      const validation = schema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }

      const { startDate, endDate } = validation.data;
      const start = new Date(startDate);
      const end = new Date(endDate);

      const sessions = await storage.getMoodSessionsByDateRange(start, end);

      res.json({
        sessions: sessions.map((session) => ({
          id: session.id,
          mood: session.mood,
          confidence: session.confidence,
          date: session.createdAt,
        })),
      });
    } catch (error) {
      console.error("Mood history range error:", error);
      res.status(500).json({ error: "Failed to fetch mood history" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
