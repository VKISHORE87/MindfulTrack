import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Get skill recommendations based on user's profile, goals and current skills
 */
export async function getSkillRecommendations(
  userProfile: any,
  targetRole: string,
  currentSkills: any[],
  industry?: string
): Promise<{
  recommendations: Array<{
    skillName: string;
    relevance: number;
    description: string;
    learningPathSuggestion: string;
  }>;
  explanation: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a career development and skills advisor specializing in IT and technology careers. 
          Your task is to analyze a user's profile, their target role, and current skills to recommend 
          additional skills they should develop to be competitive in their target role.
          
          Focus on providing specific, actionable skill recommendations that are:
          1. Highly relevant to the target role
          2. Complementary to their current skill set
          3. In-demand in the current job market
          4. Clear learning path suggestions for each skill`
        },
        {
          role: "user",
          content: `I'm looking to advance my career and need skill recommendations.
          
          Target Role: ${targetRole}
          ${industry ? `Industry: ${industry}` : ''}
          
          My Current Skills:
          ${currentSkills.map(skill => `- ${skill.skillName} (Level: ${skill.currentLevel}/100)`).join('\n')}
          
          Please recommend 3-5 additional skills I should develop to be competitive for my target role.`
        }
      ],
      response_format: { type: "json_object" },
    });
    
    // Parse the JSON response
    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      recommendations: result.recommendations || [],
      explanation: result.explanation || "Based on your target role and current skills, I've identified these skill recommendations to help you progress."
    };
  } catch (error) {
    console.error("Error getting skill recommendations:", error);
    throw new Error("Failed to get skill recommendations. Please try again later.");
  }
}

/**
 * Get personalized learning advice for a specific skill
 */
export async function getSkillLearningAdvice(
  skillName: string,
  currentLevel: number,
  targetRole: string,
  learningPreference?: string
): Promise<{
  advice: string;
  resources: Array<{
    title: string;
    type: string;
    url?: string;
    description: string;
    difficulty: string;
  }>;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a skill development advisor specializing in IT and technology skills. 
          Your task is to provide personalized learning advice for a specific skill based on 
          the user's current level, target role, and learning preferences.`
        },
        {
          role: "user",
          content: `I need advice on how to improve my ${skillName} skills.
          
          Current level: ${currentLevel}/100
          Target role: ${targetRole}
          ${learningPreference ? `Learning preference: ${learningPreference}` : ''}
          
          Please provide:
          1. Specific advice on how to improve this skill
          2. 3-5 recommended learning resources (courses, books, tutorials, projects)
          3. Estimated time to reach proficiency`
        }
      ],
      response_format: { type: "json_object" },
    });
    
    // Parse the JSON response
    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      advice: result.advice || `Here are some tips to improve your ${skillName} skills for a ${targetRole} role.`,
      resources: result.resources || []
    };
  } catch (error) {
    console.error("Error getting skill learning advice:", error);
    throw new Error("Failed to get learning advice. Please try again later.");
  }
}

/**
 * Chat with AI about career and skill development
 */
export async function chatWithAI(
  messages: Array<{ role: "user" | "assistant" | "system", content: string }>,
  userId: number,
  targetRole?: string
): Promise<string> {
  try {
    // Add system message if it doesn't exist
    if (!messages.some(msg => msg.role === "system")) {
      messages.unshift({
        role: "system",
        content: `You are UpSkill AI, a career development assistant specializing in IT and technology careers.
        Your purpose is to help users develop skills for their target roles, particularly in tech fields.
        
        ${targetRole ? `The user's target role is: ${targetRole}` : ''}
        
        Focus on providing:
        1. Clear, actionable advice for skill development
        2. Relevant resources for learning
        3. Encouragement and motivation
        4. Industry insights for their target role
        
        Keep responses concise, friendly, and focused on skill development.`
      });
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      max_tokens: 800,
    });
    
    return response.choices[0].message.content || "I'm sorry, I wasn't able to generate a response. Please try again.";
  } catch (error) {
    console.error("Error chatting with AI:", error);
    throw new Error("Failed to chat with AI. Please try again later.");
  }
}

export default openai;