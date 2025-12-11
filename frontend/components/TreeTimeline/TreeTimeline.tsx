'use client';

import { useState, useEffect, useRef } from 'react';
import TreeLeaf from './TreeLeaf';
import { Event } from '@/types';

interface TreeTimelineProps {
  events: Event[];
  spaceId: string;
}

export default function TreeTimeline({ events, spaceId }: TreeTimelineProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // 获取容器尺寸
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [events]);

  // 根据事件数量和日期生成叶子位置
  const generateLeafPositions = () => {
    if (!events.length) return [];

    const positions = [];
    const sortedEvents = [...events].sort((a, b) =>
      new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    );

    // 树的基本参数（SVG viewBox 坐标系：0-100）
    const trunkX = 50;       // 树干中心 X
    const trunkBottom = 85;  // 树干底部 Y
    const trunkTop = 15;     // 树干顶部 Y
    const minBranchLength = 8;  // 最小枝条长度
    const maxBranchLength = 35; // 最大枝条长度

    sortedEvents.forEach((event, index) => {
      const progress = index / Math.max(sortedEvents.length - 1, 1);

      // Y 坐标：从底部到顶部
      const y = trunkBottom - (progress * (trunkBottom - trunkTop));

      // 枝条长度：使用正弦曲线，中间最长
      const branchLength = minBranchLength + Math.sin(progress * Math.PI) * (maxBranchLength - minBranchLength);

      // X 坐标：左右交替
      const side = index % 2 === 0 ? 1 : -1;
      const x = trunkX + (side * branchLength);

      // 添加轻微随机偏移（减小偏移量）
      const randomOffsetX = (Math.random() - 0.5) * 3;
      const randomOffsetY = (Math.random() - 0.5) * 2;

      positions.push({
        event,
        x: x + randomOffsetX,
        y: y + randomOffsetY,
        branchStartX: trunkX,
        branchStartY: y,
        delay: index * 0.15,
      });
    });

    return positions;
  };

  const leafPositions = generateLeafPositions();

  // 生成树枝路径
  const generateBranches = () => {
    return leafPositions.map((leaf) => {
      const startX = leaf.branchStartX;
      const startY = leaf.branchStartY;
      const endX = leaf.x;
      const endY = leaf.y;

      // 贝塞尔曲线控制点：让枝条自然弯曲
      const side = endX > startX ? 1 : -1;
      const controlX = startX + (endX - startX) * 0.6;
      const controlY = startY - Math.abs(endX - startX) * 0.2;

      const path = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;

      return {
        path,
        delay: leaf.delay,
      };
    });
  };

  const branches = generateBranches();

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900">
      {/* 背景星光效果 */}
      <div className="absolute inset-0 opacity-30">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>

      {/* 主容器 */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 mb-4"
              style={{ fontFamily: 'Playfair Display, serif' }}>
            生命之树
          </h2>
          <p className="text-gray-400 text-lg">
            每一片叶子，都是一个珍贵的回忆
          </p>
        </div>

        {/* 树形容器 */}
        <div
          ref={containerRef}
          className="relative w-full mx-auto"
          style={{
            maxWidth: '1200px',
            height: '800px',
          }}
        >
          {/* SVG 树 */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* 定义渐变和滤镜 */}
            <defs>
              {/* 树干渐变 */}
              <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8B4513" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#654321" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#4A3020" stopOpacity="1" />
              </linearGradient>

              {/* 枝条渐变 */}
              <linearGradient id="branchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B4513" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#8B4513" stopOpacity="0.4" />
              </linearGradient>

              {/* 发光滤镜 */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* 树干 */}
            <path
              d="M 50 85 Q 48 65 49 45 Q 51 25 50 15"
              stroke="url(#trunkGradient)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              className="tree-trunk"
            />

            {/* 树枝 */}
            {branches.map((branch, index) => (
              <path
                key={`branch-${index}`}
                d={branch.path}
                stroke="url(#branchGradient)"
                strokeWidth="0.8"
                fill="none"
                strokeLinecap="round"
                className="tree-branch"
                style={{
                  animationDelay: `${branch.delay}s`,
                }}
              />
            ))}

            {/* 树根装饰 */}
            <ellipse
              cx="50"
              cy="88"
              rx="10"
              ry="2.5"
              fill="#4A3020"
              opacity="0.6"
              className="tree-root"
            />
          </svg>

          {/* 叶子（事件点）- 使用与SVG相同的坐标系 */}
          <div className="absolute inset-0 pointer-events-none">
            {leafPositions.map((leaf) => (
              <TreeLeaf
                key={leaf.event.id}
                event={leaf.event}
                x={leaf.x}
                y={leaf.y}
                delay={leaf.delay}
                isHovered={hoveredEvent === leaf.event.id}
                onHover={() => setHoveredEvent(leaf.event.id)}
                onLeave={() => setHoveredEvent(null)}
                onClick={() => setSelectedEvent(leaf.event)}
                spaceId={spaceId}
                containerWidth={containerSize.width}
                containerHeight={containerSize.height}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 事件详情模态框 */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-emerald-500/30 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center text-gray-300 hover:text-white transition-colors z-10"
            >
              ✕
            </button>

            {/* 图片 */}
            {selectedEvent.images && selectedEvent.images.length > 0 && (
              <div className="relative h-64 overflow-hidden rounded-t-2xl">
                <img
                  src={selectedEvent.images[0]}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
              </div>
            )}

            {/* 内容 */}
            <div className="p-8">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-3xl font-bold text-white pr-12" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {selectedEvent.title}
                </h3>
              </div>

              <div className="text-emerald-400 text-sm mb-4">
                {new Date(selectedEvent.event_date).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>

              {selectedEvent.description && (
                <p className="text-gray-300 leading-relaxed mb-6">
                  {selectedEvent.description}
                </p>
              )}

              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-gray-400 mb-4">
                  <span>📍</span>
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedEvent.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-sm rounded-full border border-emerald-500/30"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 图片网格 */}
              {selectedEvent.images && selectedEvent.images.length > 1 && (
                <div className="grid grid-cols-3 gap-2 mt-6">
                  {selectedEvent.images.slice(1).map((image, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden">
                      <img
                        src={image}
                        alt=""
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-3 mt-6">
                <a
                  href={`/spaces/${spaceId}/events/${selectedEvent.id}`}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-600 transition-all text-center"
                >
                  查看详情
                </a>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-6 py-3 bg-slate-700/50 text-gray-300 rounded-lg font-medium hover:bg-slate-600/50 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 样式 */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap');

        /* 星空动画 */
        .stars,
        .stars2,
        .stars3 {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-repeat: repeat;
        }

        .stars {
          background-image:
            radial-gradient(2px 2px at 20px 30px, white, transparent),
            radial-gradient(2px 2px at 60px 70px, white, transparent),
            radial-gradient(1px 1px at 50px 50px, white, transparent),
            radial-gradient(1px 1px at 130px 80px, white, transparent),
            radial-gradient(2px 2px at 90px 10px, white, transparent);
          background-size: 200px 200px;
          animation: stars-drift 60s linear infinite;
        }

        .stars2 {
          background-image:
            radial-gradient(1px 1px at 10px 10px, rgba(255, 255, 255, 0.5), transparent),
            radial-gradient(1px 1px at 100px 50px, rgba(255, 255, 255, 0.5), transparent);
          background-size: 150px 150px;
          animation: stars-drift 90s linear infinite;
        }

        .stars3 {
          background-image:
            radial-gradient(1px 1px at 75px 25px, rgba(255, 255, 255, 0.3), transparent),
            radial-gradient(1px 1px at 150px 100px, rgba(255, 255, 255, 0.3), transparent);
          background-size: 180px 180px;
          animation: stars-drift 120s linear infinite;
        }

        @keyframes stars-drift {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-200px);
          }
        }

        /* 树干生长动画 */
        @keyframes tree-grow {
          from {
            stroke-dashoffset: 100;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        .tree-trunk {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: tree-grow 2s ease-out forwards;
        }

        .tree-root {
          opacity: 0;
          animation: fade-in 1s ease-out 2s forwards;
        }

        /* 树枝生长动画 */
        @keyframes branch-grow {
          from {
            stroke-dashoffset: 50;
            opacity: 0;
          }
          to {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }

        .tree-branch {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          opacity: 0;
          animation: branch-grow 1s ease-out forwards;
        }

        @keyframes fade-in {
          to {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}
