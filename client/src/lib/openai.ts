import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateLearningPath(userData: any): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI career advisor that specializes in creating personalized learning paths based on users' skills and career goals. Create a structured learning path with modules and recommended resources."
        },
        {
          role: "user",
          content: JSON.stringify(userData)
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating learning path with OpenAI:", error);
    throw new Error("Failed to generate learning path recommendation");
  }
}

export async function analyzeSkillGaps(userData: any): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI career advisor that specializes in identifying skill gaps based on users' current skills and career goals. Provide a detailed analysis of missing or underdeveloped skills."
        },
        {
          role: "user",
          content: JSON.stringify(userData)
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error analyzing skill gaps with OpenAI:", error);
    throw new Error("Failed to analyze skill gaps");
  }
}

export async function recommendResources(userData: any): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI advisor that specializes in recommending learning resources based on users' skill gaps and learning preferences. Provide tailored resource recommendations."
        },
        {
          role: "user",
          content: JSON.stringify(userData)
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error recommending resources with OpenAI:", error);
    throw new Error("Failed to generate resource recommendations");
  }
}
