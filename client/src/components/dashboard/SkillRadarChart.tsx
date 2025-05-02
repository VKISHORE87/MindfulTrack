import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PieChart } from "lucide-react";
import { useCareerGoal } from "@/contexts/CareerGoalContext";
import * as d3 from 'd3';

interface SkillLevel {
  name: string;
  current: number;
  target: number;
}

interface SkillRadarChartProps {
  skills?: SkillLevel[];
  width?: number;
  height?: number;
}

export default function SkillRadarChart({ 
  skills = [],
  width = 300, 
  height = 300 
}: SkillRadarChartProps) {
  const { currentGoal, targetRoleSkills } = useCareerGoal();
  const chartRef = useRef<SVGSVGElement>(null);
  
  // Generate sample data if no skills provided
  const skillLevels = skills.length > 0 ? skills : 
    targetRoleSkills.map(skill => ({
      name: skill,
      current: Math.floor(Math.random() * 60) + 10, // Random current level between 10-70
      target: Math.floor(Math.random() * 30) + 70,  // Random target level between 70-100
    })).slice(0, 5); // Limit to 5 skills for better visualization
  
  useEffect(() => {
    if (!chartRef.current || skillLevels.length === 0) return;
    
    // Clear previous chart
    d3.select(chartRef.current).selectAll("*").remove();
    
    const svg = d3.select(chartRef.current);
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const radius = Math.min(chartWidth, chartHeight) / 2;
    
    // Create a group for the chart
    const g = svg.append("g")
      .attr("transform", `translate(${width/2}, ${height/2})`);
    
    // Scales
    const angleScale = d3.scaleLinear()
      .domain([0, skillLevels.length])
      .range([0, 2 * Math.PI]);
    
    const radiusScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, radius]);
    
    // Create background circles
    const circleCount = 5;
    for (let i = 1; i <= circleCount; i++) {
      g.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", radius * i / circleCount)
        .attr("fill", "none")
        .attr("stroke", "#e2e8f0")
        .attr("stroke-width", 1);
      
      // Add labels for 0, 20, 40, 60, 80, 100
      if (i < circleCount) {
        g.append("text")
          .attr("x", 0)
          .attr("y", -radius * i / circleCount - 5)
          .attr("text-anchor", "middle")
          .attr("font-size", "8px")
          .attr("fill", "#94a3b8")
          .text(`${i * 20}`);
      }
    }
    
    // Create axes
    skillLevels.forEach((_, i) => {
      const angle = angleScale(i);
      const lineEnd = {
        x: radius * Math.sin(angle),
        y: -radius * Math.cos(angle)
      };
      
      g.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", lineEnd.x)
        .attr("y2", lineEnd.y)
        .attr("stroke", "#e2e8f0")
        .attr("stroke-width", 1);
      
      g.append("text")
        .attr("x", lineEnd.x * 1.1)
        .attr("y", lineEnd.y * 1.1)
        .attr("text-anchor", angle > Math.PI ? "end" : angle < Math.PI / 2 || angle > Math.PI * 3 / 2 ? "start" : "middle")
        .attr("dominant-baseline", angle === 0 ? "text-after-edge" : angle === Math.PI ? "text-before-edge" : "middle")
        .attr("font-size", "10px")
        .attr("fill", "#64748b")
        .text(skillLevels[i].name);
    });
    
    // Create areas
    const createArea = (dataPoints: { x: number, y: number }[], color: string, opacity: number) => {
      const lineGenerator = d3.lineRadial<{ x: number, y: number }>()
        .angle(d => d.x)
        .radius(d => d.y)
        .curve(d3.curveLinearClosed);
      
      g.append("path")
        .datum(dataPoints)
        .attr("d", lineGenerator as any)
        .attr("fill", color)
        .attr("fill-opacity", opacity)
        .attr("stroke", color)
        .attr("stroke-width", 2);
    };
    
    // Create current skills area
    const currentDataPoints = skillLevels.map((skill, i) => ({
      x: angleScale(i),
      y: radiusScale(skill.current)
    }));
    
    // Create target skills area
    const targetDataPoints = skillLevels.map((skill, i) => ({
      x: angleScale(i),
      y: radiusScale(skill.target)
    }));
    
    // Draw the areas
    createArea(targetDataPoints, "#818cf8", 0.2); // Target - light purple
    createArea(currentDataPoints, "#4f46e5", 0.7); // Current - darker purple
    
    // Add a legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 80}, 20)`);
    
    // Current skills legend
    legend.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", "#4f46e5")
      .attr("fill-opacity", 0.7);
    
    legend.append("text")
      .attr("x", 18)
      .attr("y", 10)
      .attr("font-size", "10px")
      .text("Current Skills");
    
    // Target skills legend
    legend.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("y", 20)
      .attr("fill", "#818cf8")
      .attr("fill-opacity", 0.2);
    
    legend.append("text")
      .attr("x", 18)
      .attr("y", 30)
      .attr("font-size", "10px")
      .text("Target Skills");
    
  }, [chartRef, skillLevels, width, height]);
  
  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <PieChart className="h-5 w-5 text-primary mr-2" />
            <h3 className="font-semibold text-lg">Skill Comparison</h3>
          </div>
          <div className="text-xs text-gray-500">
            {currentGoal?.title && `Target: ${currentGoal.title}`}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <svg 
            ref={chartRef} 
            width={width} 
            height={height} 
            className="overflow-visible"
          ></svg>
        </div>
      </CardContent>
    </Card>
  );
}