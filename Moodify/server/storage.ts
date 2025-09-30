import { type User, type InsertUser, type MoodSession, type InsertMoodSession } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createMoodSession(session: InsertMoodSession): Promise<MoodSession>;
  getMoodSessions(limit?: number): Promise<MoodSession[]>;
  getMoodSessionsByDateRange(startDate: Date, endDate: Date): Promise<MoodSession[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private moodSessions: Map<string, MoodSession>;

  constructor() {
    this.users = new Map();
    this.moodSessions = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createMoodSession(insertSession: InsertMoodSession): Promise<MoodSession> {
    const id = randomUUID();
    const session: MoodSession = {
      ...insertSession,
      id,
      alternativeMoods: insertSession.alternativeMoods || null,
      createdAt: new Date(),
    };
    this.moodSessions.set(id, session);
    return session;
  }

  async getMoodSessions(limit: number = 50): Promise<MoodSession[]> {
    const sessions = Array.from(this.moodSessions.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    return sessions;
  }

  async getMoodSessionsByDateRange(startDate: Date, endDate: Date): Promise<MoodSession[]> {
    const sessions = Array.from(this.moodSessions.values())
      .filter(session => {
        const sessionDate = new Date(session.createdAt);
        return sessionDate >= startDate && sessionDate <= endDate;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return sessions;
  }
}

export const storage = new MemStorage();
