import { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { chatWithAI, getSkillRecommendations, getSkillLearningAdvice } from "../../shared/openai";
import { db } from "../db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";

// Schema for chat request validation
const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string()
  })),
  userId: z.number(),
  targetRole: z.string().optional()
});

// Schema for skill recommendations request
const skillRecommendationsSchema = z.object({
  userId: z.number(),
  targetRole: z.string(),
  industry: z.string().optional()
});

// Schema for skill learning advice request
const skillLearningAdviceSchema = z.object({
  skillName: z.string(),
  currentLevel: z.number().min(0).max(100),
  targetRole: z.string(),
  learningPreference: z.string().optional()
});

export async function registerChatRoutes(app: Express): Promise<void> {
  // Main chatbot endpoint
  app.post("/api/chat/skill-advisor", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request data
      const { messages, userId, targetRole } = chatRequestSchema.parse(req.body);
      
      // Get user data for context
      const userData = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (!userData || userData.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get AI response
      const response = await chatWithAI(messages, userId, targetRole);
      
      return res.json({ response });
    } catch (error) {
      console.error("Error in skill advisor chat:", error);
      next(error);
    }
  });
  
  // Skill recommendations endpoint
  app.post("/api/ai/skill-recommendations", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, targetRole, industry } = skillRecommendationsSchema.parse(req.body);
      
      // Get user data
      const userData = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (!userData || userData.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get user's current skills
      const userSkills = await db.query.userSkills.findMany({
        where: (userSkills, { eq }) => eq(userSkills.userId, userId),
        with: {
          skill: true
        }
      });
      
      // Format skills for the AI
      const formattedSkills = userSkills.map(userSkill => ({
        skillName: userSkill.skill.name,
        currentLevel: userSkill.currentLevel,
        targetLevel: userSkill.targetLevel
      }));
      
      // Get recommendations from AI
      const recommendations = await getSkillRecommendations(
        userData[0],
        targetRole,
        formattedSkills,
        industry
      );
      
      return res.json(recommendations);
    } catch (error) {
      console.error("Error getting skill recommendations:", error);
      next(error);
    }
  });
  
  // Skill learning advice endpoint
  app.post("/api/ai/skill-learning-advice", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { skillName, currentLevel, targetRole, learningPreference } = skillLearningAdviceSchema.parse(req.body);
      
      // Get learning advice from AI
      const advice = await getSkillLearningAdvice(
        skillName,
        currentLevel,
        targetRole,
        learningPreference
      );
      
      return res.json(advice);
    } catch (error) {
      console.error("Error getting skill learning advice:", error);
      next(error);
    }
  });
}