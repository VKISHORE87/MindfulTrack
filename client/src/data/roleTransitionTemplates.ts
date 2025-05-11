// Role transition templates database
// This database contains predefined pathways between different IT/technical roles

export interface RoleTransitionTemplate {
  path: string;
  time: string;
  skills: string[];
}

export const roleTransitionTemplates: Record<string, RoleTransitionTemplate> = {
  "Software Developer_Frontend Developer": {
    path: "Software Developer → HTML/CSS Specialist → JavaScript Developer → Frontend Developer",
    time: "6-9 months",
    skills: ["Advanced HTML5/CSS3", "JavaScript/TypeScript", "Frontend Frameworks (React, Angular, Vue)", "Responsive Design", "UI/UX Fundamentals", "Web Performance Optimization"]
  },
  "Software Developer_Backend Developer": {
    path: "Software Developer → API Developer → Database Specialist → Backend Developer",
    time: "6-9 months",
    skills: ["Server-side Languages (Node.js, Python, Java)", "Database Design & Management", "API Development", "Authentication & Authorization", "Server Management", "Performance Optimization"]
  },
  "Software Developer_Full Stack Developer": {
    path: "Software Developer → Frontend Specialist → Backend Integration Engineer → Full Stack Developer",
    time: "9-15 months",
    skills: ["Frontend Technologies (HTML/CSS/JavaScript)", "Backend Languages & Frameworks", "Database Management", "Version Control Systems", "DevOps Fundamentals", "System Architecture"]
  },
  "Software Developer_DevOps Engineer": {
    path: "Developer → CI/CD Specialist → Cloud Infrastructure Engineer → DevOps Engineer",
    time: "6-12 months",
    skills: ["Containerization (Docker)", "Orchestration (Kubernetes)", "Infrastructure as Code", "CI/CD Pipelines", "Cloud Services (AWS/Azure/GCP)", "Monitoring & Logging"]
  },
  "Software Developer_Data Scientist": {
    path: "Software Developer → Data Engineer → Analytics Developer → Data Scientist",
    time: "12-18 months",
    skills: ["Statistics & Mathematics", "Python/R Programming", "Data Visualization", "Machine Learning Algorithms", "Big Data Technologies", "Data Cleaning & Preparation"]
  },
  "Software Developer_Machine Learning Engineer": {
    path: "Software Developer → Python Developer → Data Scientist → Machine Learning Engineer",
    time: "12-18 months",
    skills: ["Advanced Mathematics", "Machine Learning Algorithms", "Deep Learning Frameworks", "Model Deployment", "MLOps", "Feature Engineering"]
  },
  "Software Developer_Cloud Solutions Architect": {
    path: "Software Developer → Cloud Engineer → Solutions Engineer → Cloud Solutions Architect",
    time: "15-24 months",
    skills: ["Cloud Platform Expertise", "Infrastructure as Code", "Networking & Security", "Cost Optimization", "System Design", "Enterprise Architecture"]
  },
  "Software Developer_Cybersecurity Analyst": {
    path: "Software Developer → Security Developer → Security Operations Specialist → Cybersecurity Analyst",
    time: "9-15 months",
    skills: ["Network Security", "Threat Intelligence", "Security Protocols", "Penetration Testing", "Security Frameworks", "Incident Response"]
  },
  "Software Developer_Database Administrator": {
    path: "Software Developer → Database Developer → Database Engineer → Database Administrator",
    time: "8-14 months",
    skills: ["Advanced SQL", "Database Systems (Oracle, MySQL, PostgreSQL)", "Performance Tuning", "Backup & Recovery", "High Availability Solutions", "Data Security"]
  },
  "Frontend Developer_Software Developer": {
    path: "Frontend Developer → JavaScript Engineer → Full Stack Developer → Software Developer",
    time: "9-15 months",
    skills: ["Object-Oriented Programming", "Backend Languages (Java, Python, C#)", "System Design", "Design Patterns", "Testing Methodologies", "Algorithms & Data Structures"]
  },
  "Frontend Developer_Backend Developer": {
    path: "Frontend Developer → API Integration Specialist → Server-Side Developer → Backend Developer",
    time: "9-15 months",
    skills: ["Server-side Languages", "Database Management", "API Development", "Authentication & Security", "Server Architecture", "Microservices"]
  },
  "Frontend Developer_Full Stack Developer": {
    path: "Frontend Developer → API Integration Engineer → Backend Basics Developer → Full Stack Developer",
    time: "6-12 months",
    skills: ["Backend Languages & Frameworks", "Database Design & Management", "API Development", "Server Management", "Version Control Systems", "System Architecture"]
  },
  "Frontend Developer_DevOps Engineer": {
    path: "Frontend Developer → Build Engineer → CI/CD Pipeline Engineer → DevOps Engineer",
    time: "12-18 months",
    skills: ["Containerization", "Infrastructure as Code", "CI/CD Pipelines", "Cloud Services", "Linux Administration", "Monitoring & Logging"]
  },
  "Frontend Developer_UX Designer": {
    path: "Frontend Developer → UI Developer → UX/UI Engineer → UX Designer",
    time: "6-12 months",
    skills: ["User Research", "Wireframing", "Prototyping", "Information Architecture", "Usability Testing", "Design Thinking"]
  },
  "Big Data Engineer_Augmented/Virtual Reality Developer": {
    path: "Big Data Engineer → Data Visualization Engineer → 3D Interactive Developer → AR/VR Developer",
    time: "12-18 months",
    skills: ["3D Modeling", "Unity/Unreal Engine", "Spatial Computing", "Computer Vision", "Interactive Data Visualization", "User Experience Design"]
  },
  // Banking/Financial transitions
  "Banking Associate_Financial Analyst": {
    path: "Banking Associate → Junior Financial Analyst → Financial Reporting Specialist → Financial Analyst",
    time: "12-18 months",
    skills: ["Financial Modeling", "Data Analysis", "Financial Statement Analysis", "Excel Advanced Functions", "Business Intelligence Tools", "Financial Reporting"]
  },
  "Financial Analyst_Investment Banker": {
    path: "Financial Analyst → Investment Analysis Associate → Junior Investment Banker → Investment Banker",
    time: "18-24 months",
    skills: ["Valuation Methods", "Financial Modeling", "Deal Structuring", "Market Analysis", "Negotiation", "Pitchbook Creation"]
  },
  "Risk Analyst_Compliance Officer": {
    path: "Risk Analyst → Regulatory Specialist → Compliance Associate → Compliance Officer",
    time: "12-18 months",
    skills: ["Regulatory Framework Knowledge", "Risk Assessment", "Compliance Monitoring", "Policy Development", "Audit Procedures", "Stakeholder Management"]
  }
};

/**
 * Gets a transition template for the specified current and target roles
 * @param currentRole The user's current role
 * @param targetRole The user's target role
 * @returns The transition template if found, undefined otherwise
 */
export function getTransitionTemplate(currentRole: string, targetRole: string): RoleTransitionTemplate | undefined {
  const templateKey = `${currentRole}_${targetRole}`;
  return roleTransitionTemplates[templateKey];
}