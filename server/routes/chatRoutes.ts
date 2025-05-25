import type { Express, Request, Response, NextFunction } from "express";
import OpenAI from "openai";
import { storage } from "../storage";

// Create OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Format a user's skill data for AI prompt
 */
function formatUserSkillsForAI(skills: any[]) {
  if (!skills || skills.length === 0) {
    return "No skills data available.";
  }

  return skills.map(skill => {
    return `- ${skill.skillName || "Unknown skill"} (Current level: ${skill.currentLevel || 0}, Target level: ${skill.targetLevel || 0})`;
  }).join("\n");
}

/**
 * Format a user's career goals for AI prompt
 */
function formatCareerGoalsForAI(goals: any[]) {
  if (!goals || goals.length === 0) {
    return "No career goals set.";
  }

  return goals.map(goal => {
    const targetRoleInfo = goal.targetRoleId ? `Target role: ${goal.targetRoleTitle || "Unknown role"}` : "";
    const timeline = goal.timelineMonths ? `Timeline: ${goal.timelineMonths} months` : "";
    
    return `- ${goal.title || "Unnamed goal"}: ${goal.description || ""} ${targetRoleInfo} ${timeline}`.trim();
  }).join("\n");
}

export async function registerChatRoutes(app: Express): Promise<void> {
  /**
   * AI-powered skill advisor chatbot endpoint
   */
  app.post("/api/chat/skill-advisor", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message, userId, currentSkills, targetRole, careerGoals } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      
      // Get user data if userId is provided
      let userData = null;
      if (userId) {
        try {
          // Use a direct query since we're using a mock user
          // In production, this would use the proper storage interface
          userData = {
            id: userId,
            name: "Demo User",
            email: "demo@example.com"
          };
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      
      // Format user context for the AI
      const userSkillsText = formatUserSkillsForAI(currentSkills || []);
      const careerGoalsText = formatCareerGoalsForAI(careerGoals || []);
      
      // Generate system prompt with user context
      const systemPrompt = `
You are an AI Skill Advisor for a career development platform called Upcraft. Your role is to help users develop their skills for career advancement.

USER CONTEXT:
${userData ? `Name: ${userData.name}` : 'Anonymous user'}
${targetRole ? `Target role: ${targetRole}` : 'No target role specified'}

USER SKILLS:
${userSkillsText}

USER CAREER GOALS:
${careerGoalsText}

INSTRUCTIONS:
1. Provide thoughtful, personalized advice on skill development based on the user's current skills and career goals.
2. If the user asks about skills needed for a specific role, provide a detailed breakdown of technical and soft skills required.
3. For learning resources, recommend specific types of courses, projects, or practice exercises.
4. Always be encouraging and focus on incremental progress.
5. When suggesting learning paths, structure them in clear steps from beginner to advanced.
6. Keep responses concise and focused on actionable advice.
7. Respond in a professional, supportive tone.
8. If you don't have enough information, ask clarifying questions.
`;

      // Call the OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      // Send the AI response back to the client
      res.json({
        response: response.choices[0].message.content
      });
      
    } catch (error) {
      console.error("Error in skill advisor chat:", error);
      next(error);
    }
  });
  
  /**
   * Get skill recommendations based on target role
   */
  app.post("/api/ai/skill-recommendations", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { targetRole, currentSkills } = req.body;
      
      if (!targetRole) {
        return res.status(400).json({ error: "Target role is required" });
      }
      
      // Format user skills for the AI
      const userSkillsText = formatUserSkillsForAI(currentSkills || []);
      
      // Generate prompt for skill recommendations
      const prompt = `
Based on the following information, provide skill development recommendations:

TARGET ROLE: ${targetRole}

CURRENT SKILLS:
${userSkillsText}

Please provide:
1. Top 5 most important skills to develop for this role
2. For each skill, suggest a specific starting point for learning
3. Identify which skills the user should prioritize based on their current skill levels
4. Recommend a logical skill development sequence

Format your response in clear sections with headings.
`;

      // Call the OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      // Send the AI response back to the client
      res.json({
        recommendations: response.choices[0].message.content
      });
      
    } catch (error) {
      console.error("Error in skill recommendations:", error);
      next(error);
    }
  });
  
  /**
   * Get personalized learning advice for a specific skill
   */
  app.post("/api/ai/skill-learning-advice", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { skillName, currentLevel, targetLevel, learningStyle, timeAvailable } = req.body;
      
      if (!skillName) {
        return res.status(400).json({ error: "Skill name is required" });
      }
      
      // Generate prompt for learning advice
      const prompt = `
Provide personalized learning advice for developing the following skill:

SKILL: ${skillName}
CURRENT LEVEL: ${currentLevel || 'Beginner'} (out of 5)
TARGET LEVEL: ${targetLevel || 'Advanced'} (out of 5)
LEARNING STYLE: ${learningStyle || 'Not specified'}
TIME AVAILABLE: ${timeAvailable || 'Not specified'}

Please provide:
1. A structured learning path with clear milestones
2. Specific resources (courses, books, projects) for each milestone
3. Practice exercises to reinforce learning
4. Ways to validate skill improvement
5. Estimated time to reach the target level

Format your response in clear sections with headings.
`;

      // Call the OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      // Send the AI response back to the client
      res.json({
        advice: response.choices[0].message.content
      });
      
    } catch (error) {
      console.error("Error in skill learning advice:", error);
      next(error);
    }
  });
}