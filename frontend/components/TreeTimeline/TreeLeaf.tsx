'use client';

import { useRef } from 'react';
import { Event } from '@/types';

interface TreeLeafProps {
  event: Event;
  x: number; // SVG坐标 (0-100)
  y: number; // SVG坐标 (0-100)
  delay: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  spaceId: string;
  containerWidth: number;
  containerHeight: number;
}

export default function TreeLeaf({
  event,
  x,
  y,
  delay,
  isHovered,
  onHover,
  onLeave,
  onClick,
  spaceId,
  containerWidth,
  containerHeight,
}: TreeLeafProps) {
  const leafRef = useRef<HTMLDivElement>(null);

  // 将SVG坐标（0-100）转换为像素坐标
  const pixelX = (x / 100) * containerWidth;
  const pixelY = (y / 100) * containerHeight;

  // 根据事件日期或标签生成颜色
  const getLeafColor = () => {
    const date = new Date(event.event_date);
    const month = date.getMonth();

    // 春夏秋冬颜色方案
    const colors = [
      // 冬季 (12, 1, 2) - 冷色调
      { from: '#60A5FA', to: '#3B82F6', shadow: 'rgba(96, 165, 250, 0.6)' },
      { from: '#818CF8', to: '#6366F1', shadow: 'rgba(129, 140, 248, 0.6)' },
      { from: '#A78BFA', to: '#8B5CF6', shadow: 'rgba(167, 139, 250, 0.6)' },

      // 春季 (3, 4, 5) - 嫩绿/粉色
      { from: '#FDE68A', to: '#FCD34D', shadow: 'rgba(253, 230, 138, 0.6)' },
      { from: '#86EFAC', to: '#4ADE80', shadow: 'rgba(134, 239, 172, 0.6)' },
      { from: '#FCA5A5', to: '#F87171', shadow: 'rgba(252, 165, 165, 0.6)' },

      // 夏季 (6, 7, 8) - 鲜艳色
      { from: '#34D399', to: '#10B981', shadow: 'rgba(52, 211, 153, 0.6)' },
      { from: '#2DD4BF', to: '#14B8A6', shadow: 'rgba(45, 212, 191, 0.6)' },
      { from: '#22D3EE', to: '#06B6D4', shadow: 'rgba(34, 211, 238, 0.6)' },

      // 秋季 (9, 10, 11) - 暖色调
      { from: '#FBBF24', to: '#F59E0B', shadow: 'rgba(251, 191, 36, 0.6)' },
      { from: '#FB923C', to: '#F97316', shadow: 'rgba(251, 146, 60, 0.6)' },
      { from: '#F87171', to: '#EF4444', shadow: 'rgba(248, 113, 113, 0.6)' },
    ];

    return colors[month];
  };

  const color = getLeafColor();

  // 生成叶子形状的 SVG 路径
  const leafPath = "M 12 2 Q 2 8, 2 16 Q 2 22, 12 24 Q 22 22, 22 16 Q 22 8, 12 2 Z";

  // 如果容器尺寸还未计算，不渲染
  if (!containerWidth || !containerHeight) {
    return null;
  }

  return (
    <>
      <div
        ref={leafRef}
        className="tree-leaf pointer-events-auto absolute"
        style={{
          left: `${pixelX}px`,
          top: `${pixelY}px`,
          transform: 'translate(-50%, -50%)',
          animationDelay: `${delay}s`,
          zIndex: isHovered ? 100 : 10,
        }}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        onClick={onClick}
      >
        {/* SVG 叶子 */}
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          className="leaf-svg cursor-pointer transition-all duration-300"
          style={{
            filter: `drop-shadow(0 0 ${isHovered ? '12px' : '8px'} ${color.shadow})`,
          }}
        >
          <defs>
            <linearGradient id={`leaf-gradient-${event.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color.from} />
              <stop offset="100%" stopColor={color.to} />
            </linearGradient>
          </defs>

          <path
            d={leafPath}
            fill={`url(#leaf-gradient-${event.id})`}
            opacity={isHovered ? 1 : 0.92}
            className="leaf-shape"
          />

          {/* 叶脉 */}
          <path
            d="M 12 2 L 12 24"
            stroke="rgba(255, 255, 255, 0.35)"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M 12 10 Q 8 12, 6 14"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="0.4"
            fill="none"
          />
          <path
            d="M 12 10 Q 16 12, 18 14"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="0.4"
            fill="none"
          />
        </svg>

        {/* 悬停时显示的预览卡片 */}
        {isHovered && (
          <div
            className="absolute left-full ml-6 top-1/2 -translate-y-1/2 w-72 bg-slate-800/98 backdrop-blur-md rounded-xl shadow-2xl border border-emerald-500/40 p-4 animate-fade-in-scale pointer-events-none"
            style={{
              zIndex: 1000,
            }}
          >
            {/* 箭头 */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-[-1px]">
              <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[10px] border-r-slate-800/98"></div>
            </div>

            {/* 缩略图 */}
            {event.images && event.images.length > 0 && (
              <div className="relative h-36 rounded-lg overflow-hidden mb-3 ring-1 ring-white/10">
                <img
                  src={event.images[0]}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent"></div>
              </div>
            )}

            {/* 标题 */}
            <h4 className="text-white font-semibold text-base mb-2 line-clamp-2 leading-snug">
              {event.title}
            </h4>

            {/* 日期 */}
            <p className="text-emerald-400 text-xs mb-3 font-medium">
              {new Date(event.event_date).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>

            {/* 描述 */}
            {event.description && (
              <p className="text-gray-400 text-xs line-clamp-3 leading-relaxed mb-3">
                {event.description}
              </p>
            )}

            {/* 位置 */}
            {event.location && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                <span>📍</span>
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}

            {/* 标签 */}
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {event.tags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs rounded-full border border-emerald-500/30"
                  >
                    #{tag}
                  </span>
                ))}
                {event.tags.length > 3 && (
                  <span className="px-2 py-0.5 text-gray-400 text-xs">
                    +{event.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* 提示 */}
            <div className="mt-3 pt-3 border-t border-white/10 text-center text-gray-500 text-xs">
              点击查看完整详情
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes leaf-appear {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0) rotate(-180deg);
          }
          60% {
            transform: translate(-50%, -50%) scale(1.15) rotate(10deg);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
          }
        }

        @keyframes leaf-sway {
          0%, 100% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          25% {
            transform: translate(-50%, -52%) rotate(3deg);
          }
          75% {
            transform: translate(-50%, -48%) rotate(-3deg);
          }
        }

        @keyframes fade-in-scale {
          from {
            opacity: 0;
            transform: translate(-50%, calc(-50% - 8px)) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        .tree-leaf {
          animation: leaf-appear 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) backwards,
                     leaf-sway 5s ease-in-out infinite 1s;
        }

        .tree-leaf:hover .leaf-svg {
          transform: scale(1.35) rotate(8deg);
        }

        .leaf-shape {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .tree-leaf:hover .leaf-shape {
          filter: brightness(1.25);
        }

        .animate-fade-in-scale {
          animation: fade-in-scale 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </>
  );
}
