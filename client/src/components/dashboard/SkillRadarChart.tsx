import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCareerGoal } from "@/contexts/CareerGoalContext";
import { useTargetRole } from '@/contexts/TargetRoleContext';
import * as d3 from 'd3';

interface SkillRadarChartProps {
  width: number;
  height: number;
}

interface SkillData {
  name: string;
  current: number;
  target: number;
}

export default function SkillRadarChart({ width, height }: SkillRadarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { targetRoleSkills, currentGoal } = useCareerGoal();
  const { targetRole } = useTargetRole();
  const [skills, setSkills] = useState<SkillData[]>([]);
  
  // Update skills data when targetRole or targetRoleSkills changes
  useEffect(() => {
    // First priority: Use targetRole's requiredSkills if available
    if (targetRole && targetRole.requiredSkills && targetRole.requiredSkills.length > 0) {
      // Map the skills from targetRole to the format needed for the chart
      const updatedSkills = targetRole.requiredSkills.map(skill => ({
        name: skill,
        // In a real implementation, these values would come from user assessment
        current: Math.floor(Math.random() * 60) + 20, // 20-80 range for demo
        target: Math.floor(Math.random() * 20) + 80, // 80-100 range for demo
      }));
      
      setSkills(updatedSkills);
    } 
    // Second priority: Fall back to targetRoleSkills from CareerGoalContext
    else if (targetRoleSkills && targetRoleSkills.length > 0) {
      // Map the skills from context to the format needed for the chart
      const updatedSkills = targetRoleSkills.map(skill => ({
        name: skill,
        current: Math.floor(Math.random() * 60) + 20, // 20-80 range for demo
        target: Math.floor(Math.random() * 20) + 80, // 80-100 range for demo
      }));
      
      setSkills(updatedSkills);
    } else {
      // Default skills if none are available from context
      setSkills([
        { name: "Programming", current: 75, target: 90 },
        { name: "System Design", current: 50, target: 80 },
        { name: "Problem Solving", current: 65, target: 70 },
        { name: "Technical Documentation", current: 45, target: 85 },
        { name: "Project Management", current: 60, target: 75 }
      ]);
    }
  }, [targetRole, targetRoleSkills]);

  useEffect(() => {
    if (!svgRef.current || skills.length === 0) return;
    
    // Use D3 to create a radar chart
    drawRadarChart();
  }, [skills, targetRole, currentGoal]);

  const drawRadarChart = () => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous chart
    
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const radius = Math.min(chartWidth, chartHeight) / 2;
    
    const g = svg.append("g")
      .attr("transform", `translate(${width/2}, ${height/2})`);
    
    // Scales and axes
    const angleScale = d3.scaleBand()
      .domain(skills.map(d => d.name))
      .range([0, 2 * Math.PI]);
    
    const radiusScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, radius]);
    
    // Draw axis lines
    const axisGrid = g.append("g").attr("class", "axis-grid");
    
    skills.forEach((_, i) => {
      const angle = i * (2 * Math.PI / skills.length);
      const line = axisGrid.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", radius * Math.sin(angle))
        .attr("y2", -radius * Math.cos(angle))
        .attr("stroke", "gray")
        .attr("stroke-opacity", 0.3);
    });
    
    // Draw concentric circles
    const circles = [20, 40, 60, 80, 100];
    circles.forEach(value => {
      const circle = g.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", radiusScale(value))
        .attr("fill", "none")
        .attr("stroke", "gray")
        .attr("stroke-opacity", 0.3);
    });
    
    // Create radar paths
    const radarLine = d3.lineRadial<{name: string, value: number}>()
      .angle(d => angleScale(d.name)! + angleScale.bandwidth() / 2)
      .radius(d => radiusScale(d.value))
      .curve(d3.curveCardinalClosed);
    
    // Current skills area
    const currentData = skills.map(s => ({ name: s.name, value: s.current }));
    g.append("path")
      .datum(currentData)
      .attr("d", radarLine as any)
      .attr("fill", "rgba(99, 102, 241, 0.3)")
      .attr("stroke", "#4F46E5")
      .attr("stroke-width", 2);
    
    // Target skills area
    const targetData = skills.map(s => ({ name: s.name, value: s.target }));
    g.append("path")
      .datum(targetData)
      .attr("d", radarLine as any)
      .attr("fill", "none")
      .attr("stroke", "#EF4444")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5");
    
    // Add labels
    skills.forEach((skill, i) => {
      const angle = i * (2 * Math.PI / skills.length);
      const labelRadius = radius + 15;
      
      g.append("text")
        .attr("x", labelRadius * Math.sin(angle))
        .attr("y", -labelRadius * Math.cos(angle))
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("dy", "0.35em")
        .text(skill.name);
    });
    
    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 100}, 20)`);
    
    // Current skills legend
    legend.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 20)
      .attr("y2", 0)
      .attr("stroke", "#4F46E5")
      .attr("stroke-width", 2);
    
    legend.append("text")
      .attr("x", 25)
      .attr("y", 0)
      .attr("dy", "0.35em")
      .attr("font-size", "10px")
      .text("Current Skills");
    
    // Target skills legend
    legend.append("line")
      .attr("x1", 0)
      .attr("y1", 20)
      .attr("x2", 20)
      .attr("y2", 20)
      .attr("stroke", "#EF4444")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5");
    
    legend.append("text")
      .attr("x", 25)
      .attr("y", 20)
      .attr("dy", "0.35em")
      .attr("font-size", "10px")
      .text("Target Level");
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">
            Skill Radar Chart
          </CardTitle>
          {targetRole && (
            <div className="text-sm text-muted-foreground">
              {targetRole.title}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-2">
          {targetRole ? 
            `Visualizing current vs. target skills for ${targetRole.title}` : 
            "Visualizing current vs. target skills for your role"}
        </div>
        <div className="flex justify-center">
          <svg ref={svgRef} width={width} height={height}></svg>
        </div>
      </CardContent>
    </Card>
  );
}