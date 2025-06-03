const OpenAI = require("openai");
const { drizzle } = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");
const schema = require("./shared/schema.ts");

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function generateRoleSpecificSkills(roleTitle, industry, level, roleType) {
  try {
    const prompt = `Generate 5-8 specific technical and professional skills required for the role of "${roleTitle}" in the ${industry} industry at ${level} level (${roleType} role).

Requirements:
- Focus on skills that are truly specific to this role
- Include both technical skills and soft skills
- Avoid generic skills like "Communication" or "Problem Solving" unless they're role-specific variants
- Make skills specific enough to differentiate this role from others
- Consider the industry context and role level

For example:
- For "Data Scientist": ["Python Programming", "Statistical Analysis", "Machine Learning", "SQL", "Data Visualization", "A/B Testing", "Feature Engineering"]
- For "UX Designer": ["User Research", "Wireframing", "Prototyping", "Figma/Sketch", "Usability Testing", "Information Architecture", "Design Systems"]
- For "DevOps Engineer": ["Docker", "Kubernetes", "CI/CD Pipelines", "Infrastructure as Code", "AWS/Azure", "Monitoring & Logging", "Shell Scripting"]

Return ONLY a JSON array of skill names, no other text:`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert in job market analysis and role-specific skill requirements. Generate realistic, specific skills for IT and technology roles."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.skills || [];
  } catch (error) {
    console.error(`Error generating skills for ${roleTitle}:`, error);
    // Return role-specific fallback skills based on role type
    return generateFallbackSkills(roleTitle, roleType);
  }
}

function generateFallbackSkills(roleTitle, roleType) {
  const title = roleTitle.toLowerCase();
  
  if (title.includes('data') || title.includes('analytics')) {
    return ["Python Programming", "SQL", "Data Analysis", "Statistics", "Data Visualization", "Machine Learning", "Excel"];
  } else if (title.includes('ai') || title.includes('artificial intelligence') || title.includes('machine learning')) {
    return ["Python Programming", "Machine Learning", "Deep Learning", "TensorFlow/PyTorch", "Neural Networks", "Natural Language Processing", "Computer Vision"];
  } else if (title.includes('security') || title.includes('cyber')) {
    return ["Network Security", "Penetration Testing", "Vulnerability Assessment", "Security Frameworks", "Incident Response", "Risk Assessment", "Compliance"];
  } else if (title.includes('cloud') || title.includes('aws') || title.includes('azure')) {
    return ["AWS/Azure", "Cloud Architecture", "Infrastructure as Code", "Containerization", "Serverless Computing", "Cloud Security", "Cost Optimization"];
  } else if (title.includes('mobile') || title.includes('ios') || title.includes('android')) {
    return ["Mobile Development", "React Native/Flutter", "App Store Optimization", "Mobile UI/UX", "API Integration", "Device Testing", "Performance Optimization"];
  } else if (title.includes('web') || title.includes('frontend') || title.includes('backend')) {
    return ["JavaScript", "React/Angular", "Node.js", "RESTful APIs", "Database Design", "Web Security", "Performance Optimization"];
  } else if (title.includes('devops') || title.includes('infrastructure')) {
    return ["Docker", "Kubernetes", "CI/CD Pipelines", "Infrastructure as Code", "Monitoring & Logging", "Shell Scripting", "Configuration Management"];
  } else if (title.includes('product') || title.includes('manager')) {
    return ["Product Strategy", "Requirements Analysis", "Agile Methodologies", "User Research", "Roadmap Planning", "Stakeholder Management", "Data-Driven Decision Making"];
  } else if (title.includes('design') || title.includes('ux') || title.includes('ui')) {
    return ["User Research", "Wireframing", "Prototyping", "Figma/Sketch", "Usability Testing", "Design Systems", "Information Architecture"];
  } else if (title.includes('qa') || title.includes('test')) {
    return ["Test Automation", "Manual Testing", "Test Planning", "Bug Tracking", "API Testing", "Performance Testing", "Quality Assurance"];
  } else {
    return ["Technical Skills", "System Analysis", "Software Development", "Database Management", "API Development", "Version Control", "Agile Methodologies"];
  }
}

async function updateAllRoleSkills() {
  console.log("Starting role skills update process...");
  
  try {
    // Get all roles from the database
    const roles = await db.select().from(schema.interviewRoles);
    console.log(`Found ${roles.length} roles to update`);
    
    let updated = 0;
    let errors = 0;
    
    for (const role of roles) {
      try {
        console.log(`Updating skills for: ${role.title}`);
        
        // Generate role-specific skills
        const skills = await generateRoleSpecificSkills(
          role.title, 
          role.industry, 
          role.level, 
          role.roleType
        );
        
        // Update the role in the database
        await db
          .update(schema.interviewRoles)
          .set({ requiredSkills: skills })
          .where(schema.interviewRoles.id.eq(role.id));
        
        console.log(`✓ Updated ${role.title} with skills:`, skills);
        updated++;
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`✗ Failed to update ${role.title}:`, error);
        errors++;
      }
    }
    
    console.log(`\nUpdate complete:`);
    console.log(`✓ Successfully updated: ${updated} roles`);
    console.log(`✗ Errors: ${errors} roles`);
    
  } catch (error) {
    console.error("Error in update process:", error);
  } finally {
    await pool.end();
  }
}

// Run the update
updateAllRoleSkills();