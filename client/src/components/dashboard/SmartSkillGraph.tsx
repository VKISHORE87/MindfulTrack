import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, ZoomIn, ZoomOut, Network, PanelTop, PanelRight } from 'lucide-react';
import * as d3 from 'd3';
import { SkillGraphData } from '@/lib/openai';

interface SmartSkillGraphProps {
  userId: number;
}

export default function SmartSkillGraph({ userId }: SmartSkillGraphProps) {
  const [viewMode, setViewMode] = useState<'all' | 'current' | 'target' | 'recommended'>('all');
  const [layout, setLayout] = useState<'force' | 'cluster'>('force');
  const svgRef = useRef<SVGSVGElement>(null);
  
  const { data: graphData, isLoading, refetch } = useQuery<SkillGraphData>({
    queryKey: [`/api/users/${userId}/smart-skill-graph`],
  });

  // Filter nodes based on viewMode
  const getFilteredData = () => {
    if (!graphData || viewMode === 'all') return graphData;
    
    const filteredNodes = graphData.nodes.filter(node => {
      if (viewMode === 'current') return node.type === 'current';
      if (viewMode === 'target') return node.type === 'target' || node.type === 'current';
      if (viewMode === 'recommended') return node.type === 'recommended' || node.type === 'current';
      return true;
    });
    
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    
    const filteredEdges = graphData.edges.filter(
      edge => nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );
    
    return {
      ...graphData,
      nodes: filteredNodes,
      edges: filteredEdges
    };
  };

  useEffect(() => {
    if (!graphData || !svgRef.current) return;
    
    const filteredData = getFilteredData();
    if (!filteredData) return;
    
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    
    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();
    
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
      
    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom as any);
    
    // Create a group that will contain all elements
    const g = svg.append("g");
    
    // Create a color scale for node types
    const colorScale = d3.scaleOrdinal()
      .domain(['current', 'target', 'recommended', 'related'])
      .range(['#3b82f6', '#10b981', '#8b5cf6', '#94a3b8']);
    
    // Create a simulation
    const simulation = d3.forceSimulation(filteredData.nodes as any)
      .force("link", d3.forceLink(filteredData.edges as any)
        .id((d: any) => d.id)
        .distance(d => layout === 'force' ? 100 : 50)
        .strength(d => layout === 'force' ? 0.1 : 0.8)
      )
      .force("charge", d3.forceManyBody().strength(layout === 'force' ? -200 : -100))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(d => (d as any).size * 2 + 10));
    
    if (layout === 'cluster') {
      // Add cluster force
      simulation.force("cluster", (alpha: number) => {
        // Group nodes by category
        const clusters = new Map();
        filteredData.nodes.forEach(node => {
          const category = node.category;
          if (!clusters.has(category)) {
            clusters.set(category, {
              x: width / 2 + Math.random() * 100 - 50,
              y: height / 2 + Math.random() * 100 - 50
            });
          }
        });
        
        return filteredData.nodes.forEach((node: any) => {
          const cluster = clusters.get(node.category);
          if (cluster) {
            node.vx = (node.vx || 0) + (cluster.x - node.x) * alpha * 0.1;
            node.vy = (node.vy || 0) + (cluster.y - node.y) * alpha * 0.1;
          }
        });
      });
    }
    
    // Create edges (links)
    const link = g.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(filteredData.edges)
      .join("line")
      .attr("stroke-width", d => d.strength * 2)
      .attr("stroke-dasharray", d => {
        if (d.type === 'prerequisite') return "4,4";
        if (d.type === 'leads-to') return "1,0";
        return "0";
      })
      .attr("marker-end", d => {
        if (d.type === 'leads-to') return "url(#arrow)";
        return null;
      });
      
    // Create an arrow marker definition
    svg.append("defs").append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "#999")
      .attr("d", "M0,-5L10,0L0,5");
    
    // Create a group for nodes
    const node = g.append("g")
      .selectAll("g")
      .data(filteredData.nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any
      );
    
    // Add circles for nodes
    node.append("circle")
      .attr("r", d => d.size * 2)
      .attr("fill", d => colorScale(d.type as any) as string)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);
    
    // Add labels to nodes
    node.append("text")
      .attr("dx", d => d.size * 2 + 5)
      .attr("dy", ".35em")
      .text(d => d.name)
      .attr("font-size", d => {
        if (d.type === 'current') return "12px";
        if (d.type === 'target') return "12px";
        if (d.type === 'recommended') return "11px";
        return "10px";
      })
      .attr("fill", "#333")
      .style("pointer-events", "none")
      .each(function(d) {
        const text = d3.select(this);
        if (d.level) {
          text.append("tspan")
            .attr("x", d.size * 2 + 5)
            .attr("dy", "1.2em")
            .attr("font-size", "9px")
            .attr("fill", "#666")
            .text(`Level: ${d.level}${d.targetLevel ? ` → ${d.targetLevel}` : ""}`);
        }
      });
      
    // Add tooltips on hover
    node.append("title")
      .text(d => `${d.name}\nCategory: ${d.category}\nLevel: ${d.level || 'N/A'}\nType: ${d.type}`);
    
    // Position the links and nodes on each tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
        
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });
    
    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(20, ${height - 100})`);
      
    const legendItems = [
      { type: 'current', label: 'Current Skills' },
      { type: 'target', label: 'Target Skills' },
      { type: 'recommended', label: 'Recommended Skills' },
      { type: 'related', label: 'Related Skills' }
    ];
    
    legendItems.forEach((item, i) => {
      const g = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);
        
      g.append("circle")
        .attr("r", 6)
        .attr("fill", colorScale(item.type as any) as string);
        
      g.append("text")
        .attr("x", 15)
        .attr("y", 4)
        .text(item.label)
        .style("font-size", "12px");
    });
    
    // Return cleanup function
    return () => {
      simulation.stop();
    };
  }, [graphData, viewMode, layout]);

  if (isLoading) {
    return (
      <Card className="w-full h-96">
        <CardHeader className="pb-2">
          <CardTitle>Smart Skill Graph</CardTitle>
          <CardDescription>
            Loading your personalized skill visualization...
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[calc(100%-84px)] flex items-center justify-center">
          <RefreshCw className="h-10 w-10 animate-spin text-primary opacity-70" />
        </CardContent>
      </Card>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <Card className="w-full h-96">
        <CardHeader className="pb-2">
          <CardTitle>Smart Skill Graph</CardTitle>
          <CardDescription>
            Your skill graph will appear here after completing a skill assessment.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[calc(100%-84px)] flex flex-col items-center justify-center">
          <Network className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-center text-gray-500 mb-4">
            Skills visualization needs more data
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-[30rem]">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <CardTitle>Smart Skill Graph</CardTitle>
            <CardDescription>
              Interactive visualization of your skills, gaps, and relationships
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select 
              defaultValue="all" 
              onValueChange={(value) => setViewMode(value as any)}
            >
              <SelectTrigger className="w-32 h-8">
                <SelectValue placeholder="View mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Skills</SelectItem>
                <SelectItem value="current">Current Only</SelectItem>
                <SelectItem value="target">Target Skills</SelectItem>
                <SelectItem value="recommended">Recommended</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center border rounded-md overflow-hidden">
              <Button 
                variant={layout === 'force' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="rounded-none h-8 px-2"
                onClick={() => setLayout('force')}
              >
                <Network className="h-4 w-4 mr-1" />
                <span className="text-xs">Force</span>
              </Button>
              <Button 
                variant={layout === 'cluster' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="rounded-none h-8 px-2"
                onClick={() => setLayout('cluster')}
              >
                <PanelTop className="h-4 w-4 mr-1" />
                <span className="text-xs">Cluster</span>
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 h-[calc(100%-84px)]">
        <div className="relative w-full h-full overflow-hidden border rounded-lg">
          <svg ref={svgRef} className="w-full h-full" />
          <div className="absolute bottom-4 right-4 flex gap-1">
            <Button 
              variant="secondary" 
              size="icon" 
              className="h-8 w-8 rounded-full shadow-md"
              onClick={() => {
                const svg = d3.select(svgRef.current);
                const currentZoom = d3.zoomTransform(svg.node() as any);
                svg.transition().call(
                  (d3.zoom() as any).transform,
                  d3.zoomIdentity.scale(currentZoom.k * 1.3).translate(
                    currentZoom.x / 1.3,
                    currentZoom.y / 1.3
                  )
                );
              }}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button 
              variant="secondary" 
              size="icon" 
              className="h-8 w-8 rounded-full shadow-md"
              onClick={() => {
                const svg = d3.select(svgRef.current);
                const currentZoom = d3.zoomTransform(svg.node() as any);
                svg.transition().call(
                  (d3.zoom() as any).transform,
                  d3.zoomIdentity.scale(currentZoom.k / 1.3).translate(
                    currentZoom.x * 1.3,
                    currentZoom.y * 1.3
                  )
                );
              }}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}