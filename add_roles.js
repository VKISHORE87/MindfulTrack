// Script to add all roles from the text file
const fs = require('fs');
const path = require('path');

// Read the text file
const filePath = path.join(__dirname, 'attached_assets', 'Pasted-Banking-Financial-Services-Core-Technical-Roles-Application-Developer-Engineer-DevOps-Engineer-Da-1745936849502.txt');
const content = fs.readFileSync(filePath, 'utf8');

// Parse the roles from the content
const lines = content.split('\n');
const roles = [];
let currentIndustry = '';
let currentRoleType = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  // Skip empty lines
  if (line === '') continue;
  
  // Check if it's an industry header
  if (line.includes('&') || 
      ['Insurance', 'Manufacturing', 'Pharmaceuticals & Life Sciences', 
       'Healthcare', 'Retail & E-commerce', 'Education & EdTech',
       'Telecommunications', 'Media & Entertainment'].includes(line) ||
      line === 'Cross-Industry IT Specializations') {
    currentIndustry = line;
    continue;
  }
  
  // Check if it's a role type header
  if (line.includes('Core') || line.includes('Specific') || 
      ['Data & Analytics', 'Security', 'Cloud & Infrastructure', 
       'Emerging Technologies'].includes(line)) {
    currentRoleType = line;
    continue;
  }
  
  // If not a header, it's a role
  if (currentIndustry && line) {
    roles.push({
      title: line,
      industry: currentIndustry,
      roleType: currentRoleType
    });
  }
}

// Log the total roles found
console.log(`Total roles found: ${roles.length}`);

// Generate SQL for inserting roles
let sql = 'BEGIN;\n\n';

roles.forEach((role, index) => {
  const description = `${role.title} specializing in ${role.industry}`;
  const requiredSkills = JSON.stringify([
    "IT Fundamentals", 
    "Software Development", 
    "Project Management", 
    "System Design", 
    "Technical Documentation"
  ]);
  
  sql += `INSERT INTO interview_roles (
    title, 
    description, 
    industry, 
    level, 
    role_type, 
    required_skills, 
    average_salary, 
    growth_rate, 
    demand_score, 
    created_at
  ) VALUES (
    '${role.title.replace(/'/g, "''")}', 
    '${description.replace(/'/g, "''")}', 
    '${role.industry.replace(/'/g, "''")}', 
    'mid', 
    'technical', 
    '${requiredSkills}', 
    '95000', 
    '12.5', 
    8, 
    NOW()
  );\n`;
});

sql += '\nCOMMIT;';

// Write the SQL to a file
fs.writeFileSync('insert_roles.sql', sql);
console.log('SQL file generated: insert_roles.sql');