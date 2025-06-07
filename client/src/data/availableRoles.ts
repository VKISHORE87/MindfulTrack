// Available roles for the Upcraft platform
// This defines all roles that will be available in dropdown selections

export interface Role {
  id: number;
  title: string;
  category: string;
  requiredSkills: string[];
  description?: string;
}

export const availableRoles: Role[] = [
  // Technical/IT Roles
  {
    id: 1,
    title: "Software Developer",
    category: "Technical/IT",
    requiredSkills: ["Programming", "Problem Solving", "Data Structures", "Algorithms", "Version Control"],
    description: "Develops software applications using programming languages and frameworks"
  },
  {
    id: 2,
    title: "Frontend Developer",
    category: "Technical/IT",
    requiredSkills: ["HTML/CSS", "JavaScript", "Frontend Frameworks", "UI/UX", "Responsive Design"],
    description: "Creates user interfaces and client-side functionality for web applications"
  },
  {
    id: 3,
    title: "Backend Developer",
    category: "Technical/IT",
    requiredSkills: ["Server-side Languages", "Databases", "API Development", "Authentication", "Security"],
    description: "Develops server-side logic and database interactions for applications"
  },
  {
    id: 4,
    title: "Full Stack Developer",
    category: "Technical/IT",
    requiredSkills: ["Frontend Technologies", "Backend Technologies", "Databases", "API Design", "System Architecture"],
    description: "Develops both client-side and server-side components of applications"
  },
  {
    id: 5,
    title: "DevOps Engineer",
    category: "Technical/IT",
    requiredSkills: ["Continuous Integration", "Containerization", "Infrastructure as Code", "Cloud Services", "Monitoring"],
    description: "Manages infrastructure, deployment, and operations for software systems"
  },
  {
    id: 6,
    title: "Data Scientist",
    category: "Technical/IT",
    requiredSkills: ["Statistics", "Machine Learning", "Data Analysis", "Python/R", "Data Visualization"],
    description: "Analyzes data to extract insights and build predictive models"
  },
  {
    id: 7,
    title: "Machine Learning Engineer",
    category: "Technical/IT",
    requiredSkills: ["Machine Learning Algorithms", "Deep Learning", "Python", "Model Deployment", "Feature Engineering"],
    description: "Builds and deploys machine learning systems for production use"
  },
  {
    id: 8,
    title: "Cloud Solutions Architect",
    category: "Technical/IT",
    requiredSkills: ["Cloud Platforms", "Infrastructure Design", "System Architecture", "Security", "Cost Optimization"],
    description: "Designs and implements solutions using cloud computing platforms"
  },
  {
    id: 9,
    title: "Cybersecurity Analyst",
    category: "Technical/IT",
    requiredSkills: ["Network Security", "Threat Intelligence", "Security Protocols", "Incident Response", "Risk Assessment"],
    description: "Protects systems and data from security threats and vulnerabilities"
  },
  {
    id: 10,
    title: "Database Administrator",
    category: "Technical/IT",
    requiredSkills: ["SQL", "Database Systems", "Performance Tuning", "Backup & Recovery", "Data Security"],
    description: "Manages and optimizes database systems and their performance"
  },
  {
    id: 11,
    title: "Data Engineer",
    category: "Technical/IT",
    requiredSkills: ["ETL Processes", "Data Pipelines", "Big Data Technologies", "SQL", "Data Modeling"],
    description: "Designs and builds data infrastructure and processing systems"
  },
  {
    id: 12,
    title: "Site Reliability Engineer",
    category: "Technical/IT",
    requiredSkills: ["System Administration", "Automation", "Monitoring", "Incident Response", "Performance Optimization"],
    description: "Ensures the reliability and performance of large-scale systems"
  },
  {
    id: 13,
    title: "Big Data Engineer",
    category: "Technical/IT",
    requiredSkills: ["Hadoop Ecosystem", "Spark", "Distributed Systems", "Data Processing", "NoSQL Databases"],
    description: "Builds systems for processing and analyzing large volumes of data"
  },
  
  // Agile/Product Roles
  {
    id: 20,
    title: "Scrum Master",
    category: "Agile/Product",
    requiredSkills: ["Agile Methodologies", "Facilitation", "Coaching", "Conflict Resolution", "Team Leadership"],
    description: "Facilitates Scrum processes and removes obstacles for development teams"
  },
  {
    id: 21,
    title: "Product Owner",
    category: "Agile/Product",
    requiredSkills: ["Product Management", "Stakeholder Management", "Backlog Prioritization", "User Story Writing", "Requirements Gathering"],
    description: "Represents stakeholders and defines product requirements in Agile teams"
  },
  {
    id: 22,
    title: "Agile Coach",
    category: "Agile/Product",
    requiredSkills: ["Agile Frameworks", "Coaching", "Change Management", "Leadership", "Process Improvement"],
    description: "Guides teams and organizations in adopting Agile methodologies"
  },
  {
    id: 23,
    title: "Agile Project Manager",
    category: "Agile/Product",
    requiredSkills: ["Agile Methodologies", "Project Planning", "Risk Management", "Team Leadership", "Stakeholder Communication"],
    description: "Manages projects using Agile approaches and principles"
  },
  {
    id: 24,
    title: "Program Manager",
    category: "Agile/Product",
    requiredSkills: ["Program Planning", "Strategic Thinking", "Stakeholder Management", "Risk Management", "Resource Allocation"],
    description: "Coordinates multiple related projects to achieve strategic goals"
  },
  {
    id: 25,
    title: "Product Manager",
    category: "Agile/Product",
    requiredSkills: ["Product Strategy", "Market Research", "User Experience", "Business Analysis", "Communication"],
    description: "Defines product vision, strategy, and roadmap for development"
  },
  
  // Specialized Technical Roles
  {
    id: 40,
    title: "AR/VR Developer",
    category: "Specialized Technical",
    requiredSkills: ["3D Modeling", "Unity/Unreal Engine", "Computer Vision", "Spatial Computing", "Interactive Design"],
    description: "Creates immersive experiences using augmented and virtual reality technologies"
  },
  {
    id: 41,
    title: "Blockchain Developer",
    category: "Specialized Technical",
    requiredSkills: ["Blockchain Protocols", "Smart Contracts", "Cryptography", "Distributed Systems", "Security"],
    description: "Builds applications and systems using blockchain technology"
  },
  {
    id: 42,
    title: "IoT Developer",
    category: "Specialized Technical",
    requiredSkills: ["Embedded Systems", "Hardware Interfacing", "Network Protocols", "Security", "Cloud Integration"],
    description: "Develops software for Internet of Things devices and systems"
  },
  {
    id: 43,
    title: "Telecom API Developer",
    category: "Specialized Technical",
    requiredSkills: ["Telecommunications Protocols", "API Design", "Network Programming", "Security", "Performance Optimization"],
    description: "Develops APIs and services for telecommunications systems"
  },
  {
    id: 44,
    title: "Computer Vision Engineer",
    category: "Specialized Technical",
    requiredSkills: ["Image Processing", "Machine Learning", "Computer Vision Algorithms", "Python", "Deep Learning"],
    description: "Develops systems that can analyze and interpret visual information"
  },
  
  // Intermediate/Specialist Roles
  {
    id: 60,
    title: "CI/CD Specialist",
    category: "Intermediate/Specialist",
    requiredSkills: ["CI/CD Pipelines", "Build Tools", "Automation", "Version Control", "DevOps Practices"],
    description: "Designs and implements continuous integration and deployment processes"
  },
  {
    id: 61,
    title: "Cloud Infrastructure Engineer",
    category: "Intermediate/Specialist",
    requiredSkills: ["Cloud Platforms", "Infrastructure as Code", "Networking", "Security", "Automation"],
    description: "Designs and manages cloud-based infrastructure for applications"
  },
  {
    id: 62,
    title: "API Developer",
    category: "Intermediate/Specialist",
    requiredSkills: ["API Design", "RESTful Services", "Authentication", "Documentation", "Performance Optimization"],
    description: "Specializes in designing and developing application programming interfaces"
  },
  {
    id: 63,
    title: "Database Specialist",
    category: "Intermediate/Specialist",
    requiredSkills: ["Advanced SQL", "Database Optimization", "Data Modeling", "Performance Tuning", "Database Security"],
    description: "Expert in database design, optimization, and management"
  },
  {
    id: 64,
    title: "HTML/CSS Specialist",
    category: "Intermediate/Specialist",
    requiredSkills: ["Advanced HTML5", "CSS3", "Responsive Design", "Accessibility", "CSS Preprocessors"],
    description: "Expert in creating the visual structure and styling of web applications"
  },
  {
    id: 65,
    title: "JavaScript Developer",
    category: "Intermediate/Specialist",
    requiredSkills: ["JavaScript", "ES6+", "DOM Manipulation", "Async Programming", "Browser APIs"],
    description: "Specializes in developing client-side functionality using JavaScript"
  }
];

// Get all available roles
export function getAllRoles(): Role[] {
  return availableRoles;
}

// Get roles by category
export function getRolesByCategory(category: string): Role[] {
  return availableRoles.filter(role => role.category === category);
}

// Get a specific role by ID
export function getRoleById(id: number): Role | undefined {
  return availableRoles.find(role => role.id === id);
}

// Get a specific role by title
export function getRoleByTitle(title: string): Role | undefined {
  return availableRoles.find(role => role.title === title);
}