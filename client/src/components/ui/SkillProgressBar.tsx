import { cva } from "class-variance-authority";

interface SkillProgressBarProps {
  skillName: string;
  percentage: number;
  className?: string;
}

const skillLevelVariants = cva("skill-progress-bar h-full rounded-md", {
  variants: {
    level: {
      low: "bg-red-500",
      medium: "bg-amber-500",
      high: "bg-emerald-500"
    }
  },
  defaultVariants: {
    level: "low"
  }
});

export default function SkillProgressBar({ skillName, percentage, className }: SkillProgressBarProps) {
  // Determine level based on percentage
  const getLevel = (percentage: number) => {
    if (percentage < 40) return "low";
    if (percentage < 70) return "medium";
    return "high";
  };

  const level = getLevel(percentage);

  return (
    <div className={`mb-4 last:mb-0 ${className}`}>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{skillName}</span>
        <span className="text-sm text-gray-500">{percentage}% of target</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-md overflow-hidden">
        <div 
          className={skillLevelVariants({ level })} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
