import React, { useState, useMemo } from 'react';
import { BoundingBox } from '../types';
import { Sparkles } from 'lucide-react';

interface SpatialOverlayProps {
  boundingBoxes: BoundingBox[];
  show: boolean;
}

const BoxItem: React.FC<{ box: BoundingBox }> = ({ box }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Smart positioning logic
  const showTooltipAbove = box.y > 60; // Threshold for showing above
  const alignRight = box.x > 50; // Threshold for aligning to the right

  const getStyle = (severity: string) => {
    switch (severity) {
      case 'critical': return {
        border: 'border-rose-500',
        bg: 'bg-rose-500/5', 
        badge: 'bg-rose-500 text-white',
        shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.4)]'
      };
      case 'moderate': return {
        border: 'border-amber-500',
        bg: 'bg-amber-500/5',
        badge: 'bg-amber-500 text-slate-900',
        shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.4)]'
      };
      default: return {
        border: 'border-sky-500',
        bg: 'bg-sky-500/5',
        badge: 'bg-sky-500 text-white',
        shadow: 'shadow-[0_0_15px_rgba(14,165,233,0.4)]'
      };
    }
  };

  const style = getStyle(box.severity);

  return (
    <div
      className={`absolute border-2 transition-all duration-300 ease-out cursor-help ${style.border} ${style.bg} ${isHovered ? `z-50 scale-[1.01] ${style.shadow}` : 'z-10'}`}
      style={{
        left: `${box.x}%`,
        top: `${box.y}%`,
        width: `${box.width}%`,
        height: `${box.height}%`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // Enable touch interaction for mobile
      onClick={() => setIsHovered(!isHovered)}
    >
      {/* Visible Label Tag */}
      <div className={`
        absolute px-2 py-0.5 rounded-t-md 
        text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5
        transition-transform duration-200 backdrop-blur-sm
        ${style.badge}
        ${alignRight ? 'right-[-2px] origin-bottom-right' : 'left-[-2px] origin-bottom-left'}
        ${showTooltipAbove ? 'bottom-full rounded-t-md rounded-b-none' : '-top-6 rounded-b-none rounded-t-md'}
        ${isHovered ? 'scale-110 z-50' : 'scale-100 z-20'}
      `}>
        {box.type}
      </div>

      {/* Detailed Tooltip */}
      <div className={`
        absolute w-48 md:w-64 p-3 rounded-lg 
        bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md
        transition-all duration-200 pointer-events-none
        ${alignRight ? 'right-[-2px]' : 'left-[-2px]'}
        ${showTooltipAbove 
            ? `bottom-full mb-8 ${alignRight ? 'origin-bottom-right' : 'origin-bottom-left'}` 
            : `top-full mt-2 ${alignRight ? 'origin-top-right' : 'origin-top-left'}`
        }
        ${isHovered 
            ? 'opacity-100 scale-100 translate-y-0 z-[60]' 
            : `opacity-0 scale-95 z-[-1] ${showTooltipAbove ? 'translate-y-2' : '-translate-y-2'}`
        }
      `}>
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
          <span className={`text-xs font-bold uppercase ${
            box.severity === 'critical' ? 'text-rose-400' : 
            box.severity === 'moderate' ? 'text-amber-400' : 'text-sky-400'
          }`}>
            {box.severity} Issue
          </span>
        </div>
        <p className="text-xs font-medium text-slate-200 mb-2 leading-relaxed">{box.description}</p>
        <div className="flex gap-2 items-start bg-slate-800/50 p-2 rounded">
           <Sparkles className="w-3 h-3 text-brand-400 mt-0.5 flex-shrink-0" />
           <p className="text-[10px] text-brand-100 leading-snug">{box.suggestion}</p>
        </div>
      </div>
    </div>
  );
};

const SpatialOverlay: React.FC<SpatialOverlayProps> = ({ boundingBoxes, show }) => {
  if (!show || !boundingBoxes || boundingBoxes.length === 0) return null;

  // SORTING LOGIC:
  // We sort boxes by area (width * height) in descending order.
  // This ensures larger boxes (like general Composition) are rendered first (at the bottom).
  // Smaller, specific boxes (like Focus on Eye) are rendered last (on top).
  // This prevents large boxes from blocking interactions with smaller ones nested inside them.
  const sortedBoxes = useMemo(() => {
    return [...boundingBoxes].sort((a, b) => {
      const areaA = a.width * a.height;
      const areaB = b.width * b.height;
      return areaB - areaA; // Large to Small
    });
  }, [boundingBoxes]);

  return (
    <>
      {sortedBoxes.map((box, i) => (
        <BoxItem key={i} box={box} />
      ))}
    </>
  );
};

export default SpatialOverlay;