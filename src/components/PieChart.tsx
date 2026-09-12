import { useState, useEffect } from 'react';

interface PieChartProps {
  data: Record<string, number>;
  width?: number;
  height?: number;
  className?: string;
  title?: string;
}

interface PieSlice {
  label: string;
  value: number;
  percentage: number;
  startAngle: number;
  endAngle: number;
  color: string;
  path: string;
}

const COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#ec4899', // Pink
  '#6366f1', // Indigo
];

export default function PieChart({ 
  data, 
  width = 300, 
  height = 300, 
  className = '',
  title = 'Distribution'
}: PieChartProps) {
  const [hoveredSlice, setHoveredSlice] = useState<PieSlice | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimationProgress(1), 200);
    return () => clearTimeout(timer);
  }, [data]);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 40;
  const innerRadius = radius * 0.4; // Donut chart

  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  
  if (total === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="w-32 h-32 rounded-full bg-dark-tertiary flex items-center justify-center mb-4">
            <span className="text-dark-text-muted text-sm">No Data</span>
          </div>
          <p className="text-dark-text-muted text-sm">{title}</p>
        </div>
      </div>
    );
  }

  const slices: PieSlice[] = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .map(([label, value], index) => {
      const percentage = (value / total) * 100;
      const startAngle = Object.entries(data)
        .slice(0, index)
        .reduce((sum, [, val]) => sum + (val / total) * 360, 0);
      const endAngle = startAngle + (value / total) * 360;
      
      const color = COLORS[index % COLORS.length];
      
      // Create SVG path for the slice
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);
      
      const x3 = centerX + innerRadius * Math.cos(endAngleRad);
      const y3 = centerY + innerRadius * Math.sin(endAngleRad);
      const x4 = centerX + innerRadius * Math.cos(startAngleRad);
      const y4 = centerY + innerRadius * Math.sin(startAngleRad);
      
      const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
      
      const path = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
        'Z'
      ].join(' ');
      
      return {
        label,
        value,
        percentage,
        startAngle,
        endAngle,
        color,
        path
      };
    });

  return (
    <div className={`relative ${className}`}>
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <filter id="pie-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="pie-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.3"/>
          </filter>
        </defs>

        {/* Background circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="2"
        />

        {/* Pie slices */}
        {slices.map((slice) => {
          const isHovered = hoveredSlice?.label === slice.label;
          const scale = isHovered ? 1.05 : 1;
          const offsetX = isHovered ? (slice.color === hoveredSlice?.color ? 5 : 0) : 0;
          const offsetY = isHovered ? (slice.color === hoveredSlice?.color ? 5 : 0) : 0;
          
          return (
            <g
              key={slice.label}
              transform={`translate(${offsetX}, ${offsetY}) scale(${scale})`}
              className="transition-all duration-300 ease-out cursor-pointer"
              onMouseEnter={() => setHoveredSlice(slice)}
              onMouseLeave={() => setHoveredSlice(null)}
            >
              <path
                d={slice.path}
                fill={slice.color}
                stroke="white"
                strokeWidth="2"
                filter="url(#pie-shadow)"
                className="transition-all duration-300 ease-out"
                style={{
                  opacity: animationProgress,
                  transform: `scale(${animationProgress})`,
                  transformOrigin: `${centerX}px ${centerY}px`
                }}
              />
              
              {/* Percentage text in center */}
              {slice.percentage > 5 && (
                <text
                  x={centerX + (radius + innerRadius) / 2 * Math.cos((slice.startAngle + slice.endAngle) / 2 * Math.PI / 180)}
                  y={centerY + (radius + innerRadius) / 2 * Math.sin((slice.startAngle + slice.endAngle) / 2 * Math.PI / 180)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-semibold fill-white"
                  style={{
                    opacity: animationProgress,
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                  }}
                >
                  {slice.percentage.toFixed(0)}%
                </text>
              )}
            </g>
          );
        })}

        {/* Center text */}
        <text
          x={centerX}
          y={centerY - 5}
          textAnchor="middle"
          className="text-sm font-bold fill-current"
          style={{ opacity: animationProgress }}
        >
          {total}
        </text>
        <text
          x={centerX}
          y={centerY + 10}
          textAnchor="middle"
          className="text-xs fill-current opacity-60"
          style={{ opacity: animationProgress }}
        >
          Total
        </text>
      </svg>

      {/* Legend */}
      <div className="mt-4 space-y-2">
        {slices.map((slice) => (
          <div
            key={slice.label}
            className="flex items-center gap-2 text-sm"
            onMouseEnter={() => setHoveredSlice(slice)}
            onMouseLeave={() => setHoveredSlice(null)}
          >
            <div
              className="w-3 h-3 rounded-full transition-all duration-200"
              style={{ 
                backgroundColor: slice.color,
                transform: hoveredSlice?.label === slice.label ? 'scale(1.2)' : 'scale(1)',
                boxShadow: hoveredSlice?.label === slice.label ? `0 0 8px ${slice.color}` : 'none'
              }}
            />
            <span className="text-dark-text-secondary flex-1">{slice.label}</span>
            <span className="text-dark-text font-semibold">{slice.value}</span>
            <span className="text-dark-text-muted text-xs">({slice.percentage.toFixed(1)}%)</span>
          </div>
        ))}
      </div>

      {/* Hover tooltip */}
      {hoveredSlice && (
        <div className="absolute top-2 right-2 bg-dark-tertiary/90 backdrop-blur-sm rounded-lg p-3 border border-dark-border">
          <div className="text-sm">
            <div className="font-semibold text-dark-text">{hoveredSlice.label}</div>
            <div className="text-dark-text-secondary">
              {hoveredSlice.value} occurrences
            </div>
            <div className="text-dark-text-muted text-xs">
              {hoveredSlice.percentage.toFixed(1)}% of total
            </div>
          </div>
        </div>
      )}

      {/* Chart title */}
      <div className="text-center mt-2">
        <h4 className="text-sm font-semibold text-dark-text">{title}</h4>
      </div>
    </div>
  );
}



