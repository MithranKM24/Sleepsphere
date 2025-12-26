import React, { useState, useEffect } from 'react';
import { SleepLog } from '../lib/supabase';

interface LineGraphProps {
  data: SleepLog[];
  metric: 'duration' | 'quality' | 'dreams' | 'stress';
  lifestyleLogs?: any[];
  width?: number;
  height?: number;
  className?: string;
}

interface Point {
  x: number;
  y: number;
  value: number;
  date: string;
}

export default function LineGraph({ 
  data, 
  metric, 
  lifestyleLogs = [], 
  width = 400, 
  height = 200, 
  className = '' 
}: LineGraphProps) {
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimationProgress(1), 100);
    return () => clearTimeout(timer);
  }, [data]);

  const getMetricValue = (log: SleepLog, lifestyleLog?: any): number => {
    switch (metric) {
      case 'duration':
        return log.total_hours || 0;
      case 'quality':
        return log.sleep_quality || 0;
      case 'dreams':
        return log.dream_recall_frequency || 0;
      case 'stress':
        return lifestyleLog?.stress_level || 0;
      default:
        return 0;
    }
  };

  const getMaxValue = (): number => {
    switch (metric) {
      case 'duration':
        return Math.max(...data.map(log => log.total_hours || 0), 8);
      case 'quality':
        return 10;
      case 'dreams':
        return Math.max(...data.map(log => log.dream_recall_frequency || 0), 5);
      case 'stress':
        return 10;
      default:
        return 10;
    }
  };

  const getMetricColor = (): string => {
    switch (metric) {
      case 'duration':
        return '#3b82f6';
      case 'quality':
        return '#10b981';
      case 'dreams':
        return '#8b5cf6';
      case 'stress':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  const getMetricLabel = (): string => {
    switch (metric) {
      case 'duration':
        return 'Hours';
      case 'quality':
        return 'Rating';
      case 'dreams':
        return 'Dreams';
      case 'stress':
        return 'Level';
      default:
        return '';
    }
  };

  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxValue = getMaxValue();
  const color = getMetricColor();

  // Create data points
  const points: Point[] = data.map((log, index) => {
    const lifestyleLog = lifestyleLogs.find(l => l.log_date === log.log_date);
    const value = getMetricValue(log, lifestyleLog);
    const x = padding + (index / Math.max(data.length - 1, 1)) * chartWidth;
    const y = padding + chartHeight - (value / maxValue) * chartHeight;
    
    return {
      x,
      y,
      value,
      date: log.log_date
    };
  });

  // Create smooth path
  const createPath = (points: Point[]): string => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      if (next) {
        // Smooth curve with control points
        const cp1x = prev.x + (curr.x - prev.x) * 0.5;
        const cp1y = prev.y;
        const cp2x = curr.x - (next.x - curr.x) * 0.5;
        const cp2y = curr.y;
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
      } else {
        path += ` L ${curr.x} ${curr.y}`;
      }
    }
    
    return path;
  };

  const pathData = createPath(points);
  const animatedPathData = createPath(
    points.map(point => ({
      ...point,
      y: padding + chartHeight - ((point.value / maxValue) * chartHeight * animationProgress)
    }))
  );

  return (
    <div className={`relative ${className}`}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Grid lines */}
        <defs>
          <linearGradient id={`gradient-${metric}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
          <filter id={`glow-${metric}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
          <g key={index}>
            <line
              x1={padding}
              y1={padding + chartHeight * ratio}
              x2={width - padding}
              y2={padding + chartHeight * ratio}
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeWidth="1"
            />
            <text
              x={padding - 10}
              y={padding + chartHeight * ratio + 4}
              textAnchor="end"
              className="text-xs fill-current opacity-60"
            >
              {Math.round(maxValue * (1 - ratio))}
            </text>
          </g>
        ))}

        {/* Area under curve */}
        <path
          d={`${animatedPathData} L ${points[points.length - 1]?.x || padding} ${padding + chartHeight} L ${padding} ${padding + chartHeight} Z`}
          fill={`url(#gradient-${metric})`}
          className="transition-all duration-1000 ease-out"
        />

        {/* Main line */}
        <path
          d={animatedPathData}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#glow-${metric})`}
          className="transition-all duration-1000 ease-out"
        />

        {/* Data points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={padding + chartHeight - ((point.value / maxValue) * chartHeight * animationProgress)}
              r="6"
              fill={color}
              stroke="white"
              strokeWidth="2"
              className="transition-all duration-1000 ease-out cursor-pointer hover:r-8"
              onMouseEnter={() => setHoveredPoint(point)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
            
            {/* Date labels */}
            <text
              x={point.x}
              y={height - 10}
              textAnchor="middle"
              className="text-xs fill-current opacity-60"
            >
              {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </text>
          </g>
        ))}

        {/* Hover tooltip */}
        {hoveredPoint && (
          <g>
            <rect
              x={hoveredPoint.x - 30}
              y={hoveredPoint.y - 40}
              width="60"
              height="30"
              rx="6"
              fill="rgba(0, 0, 0, 0.8)"
              className="backdrop-blur-sm"
            />
            <text
              x={hoveredPoint.x}
              y={hoveredPoint.y - 20}
              textAnchor="middle"
              className="text-xs fill-white font-semibold"
            >
              {hoveredPoint.value.toFixed(1)} {getMetricLabel()}
            </text>
            <text
              x={hoveredPoint.x}
              y={hoveredPoint.y - 5}
              textAnchor="middle"
              className="text-xs fill-white opacity-80"
            >
              {new Date(hoveredPoint.date).toLocaleDateString()}
            </text>
          </g>
        )}
      </svg>

      {/* Chart title */}
      <div className="absolute top-2 left-2">
        <h4 className="text-sm font-semibold text-dark-text">
          {metric === 'duration' && 'Sleep Duration'}
          {metric === 'quality' && 'Sleep Quality'}
          {metric === 'dreams' && 'Dream Recall'}
          {metric === 'stress' && 'Stress Levels'}
        </h4>
      </div>
    </div>
  );
}



