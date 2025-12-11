'use client';

import { useState, useEffect, useMemo } from 'react';
import { Event } from '@/types';

interface MeteorTimelineProps {
  events: Event[];
  spaceId: string;
}

interface MeteorData {
  event: Event;
  id: string;
  startX: number;
  startY: number;
  angle: number;
  length: number;
  duration: number;
  delay: number;
  color: {
    core: string;
    trail: string;
    glow: string;
  };
}

export default function MeteorTimeline({ events, spaceId }: MeteorTimelineProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [hoveredMeteor, setHoveredMeteor] = useState<string | null>(null);
  const [key, setKey] = useState(0); // 用于重置动画

  // 根据月份获取颜色
  const getColorByMonth = (month: number) => {
    const colors = [
      { core: '#60A5FA', trail: '#3B82F6', glow: 'rgba(96, 165, 250, 0.8)' },
      { core: '#818CF8', trail: '#6366F1', glow: 'rgba(129, 140, 248, 0.8)' },
      { core: '#A78BFA', trail: '#8B5CF6', glow: 'rgba(167, 139, 250, 0.8)' },
      { core: '#FDE68A', trail: '#FCD34D', glow: 'rgba(253, 230, 138, 0.8)' },
      { core: '#86EFAC', trail: '#4ADE80', glow: 'rgba(134, 239, 172, 0.8)' },
      { core: '#FCA5A5', trail: '#F87171', glow: 'rgba(252, 165, 165, 0.8)' },
      { core: '#34D399', trail: '#10B981', glow: 'rgba(52, 211, 153, 0.8)' },
      { core: '#2DD4BF', trail: '#14B8A6', glow: 'rgba(45, 212, 191, 0.8)' },
      { core: '#22D3EE', trail: '#06B6D4', glow: 'rgba(34, 211, 238, 0.8)' },
      { core: '#FBBF24', trail: '#F59E0B', glow: 'rgba(251, 191, 36, 0.8)' },
      { core: '#FB923C', trail: '#F97316', glow: 'rgba(251, 146, 60, 0.8)' },
      { core: '#F87171', trail: '#EF4444', glow: 'rgba(248, 113, 113, 0.8)' },
    ];
    return colors[month];
  };

  // 生成流星数据
  const meteors: MeteorData[] = useMemo(() => {
    if (!events.length) return [];

    const sortedEvents = [...events].sort((a, b) =>
      new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    );

    return sortedEvents.map((event, index) => {
      // 随机生成起始位置（右上方区域）
      const startX = 60 + Math.random() * 40; // 60% - 100%
      const startY = Math.random() * 40; // 0% - 40%

      // 流星角度（向左下方，-30° 到 -60°）
      const angle = -30 - Math.random() * 30;

      // 流星长度和速度
      const length = 200 + Math.random() * 150; // 200px - 350px 尾巴长度（更长的彗尾）
      const duration = 12 + Math.random() * 8; // 12-20秒划过（大幅减速，便于点击）

      // 错开出现时间
      const delay = index * 3 + Math.random() * 2; // 更大的间隔

      const date = new Date(event.event_date);
      const month = date.getMonth();

      return {
        event,
        id: event.id,
        startX,
        startY,
        angle,
        length,
        duration,
        delay,
        color: getColorByMonth(month),
      };
    });
  }, [events]);

  return (
    <div className="meteor-timeline-container">
      {/* 多层星空背景 */}
      <div className="stars-background">
        <div className="stars-layer stars-1"></div>
        <div className="stars-layer stars-2"></div>
        <div className="stars-layer stars-3"></div>
        <div className="stars-twinkle"></div>
      </div>

      {/* 标题区域 */}
      <div className="meteor-header">
        <h2 className="meteor-title">流星时光</h2>
        <p className="meteor-subtitle">每颗流星，都是一段永恒的记忆</p>
      </div>

      {/* 流星区域 */}
      <div className="meteor-stage" key={key}>
        {meteors.map((meteor) => (
          <div
            key={meteor.id}
            className={`meteor-wrapper ${hoveredMeteor === meteor.id ? 'paused' : ''}`}
            style={{
              '--start-x': `${meteor.startX}%`,
              '--start-y': `${meteor.startY}%`,
              '--angle': `${meteor.angle}deg`,
              '--duration': `${meteor.duration}s`,
              '--delay': `${meteor.delay}s`,
              '--length': `${meteor.length}px`,
              '--color-core': meteor.color.core,
              '--color-trail': meteor.color.trail,
              '--color-glow': meteor.color.glow,
            } as React.CSSProperties}
            onMouseEnter={() => setHoveredMeteor(meteor.id)}
            onMouseLeave={() => setHoveredMeteor(null)}
            onClick={() => setSelectedEvent(meteor.event)}
          >
            {/* 哈雷彗星样式本体 */}
            <div className="comet">
              {/* 彗核 - 最明亮的核心 */}
              <div className="comet-nucleus"></div>
              {/* 彗发 - 围绕彗核的发光云 */}
              <div className="comet-coma"></div>
              {/* 离子尾 - 细长、直线、蓝色调 */}
              <div className="comet-ion-tail"></div>
              {/* 尘埃尾 - 较宽、弯曲、白/黄色调 */}
              <div className="comet-dust-tail"></div>
              {/* 外围光晕 */}
              <div className="comet-outer-glow"></div>
              {/* 粒子轨迹 */}
              <div className="comet-particles">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>

            {/* 悬停提示 */}
            {hoveredMeteor === meteor.id && (
              <div className="meteor-info">
                <div className="meteor-info-card">
                  {meteor.event.images && meteor.event.images.length > 0 && (
                    <div className="meteor-info-image">
                      <img src={meteor.event.images[0]} alt={meteor.event.title} />
                    </div>
                  )}
                  <div className="meteor-info-content">
                    <h4>{meteor.event.title}</h4>
                    <p className="meteor-info-date">
                      {new Date(meteor.event.event_date).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    {meteor.event.description && (
                      <p className="meteor-info-desc">{meteor.event.description}</p>
                    )}
                    <span className="meteor-info-hint">点击查看详情</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 底部提示 */}
      <div className="meteor-footer">
        <p>悬停流星查看预览 · 点击流星查看完整回忆</p>
      </div>

      {/* 事件详情模态框 */}
      {selectedEvent && (
        <div className="meteor-modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="meteor-modal" onClick={(e) => e.stopPropagation()}>
            <button className="meteor-modal-close" onClick={() => setSelectedEvent(null)}>
              ✕
            </button>

            {selectedEvent.images && selectedEvent.images.length > 0 && (
              <div className="meteor-modal-image">
                <img src={selectedEvent.images[0]} alt={selectedEvent.title} />
                <div className="meteor-modal-image-overlay"></div>
              </div>
            )}

            <div className="meteor-modal-content">
              <h3 className="meteor-modal-title">{selectedEvent.title}</h3>
              <p className="meteor-modal-date">
                {new Date(selectedEvent.event_date).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </p>

              {selectedEvent.description && (
                <p className="meteor-modal-desc">{selectedEvent.description}</p>
              )}

              {selectedEvent.location && (
                <div className="meteor-modal-location">
                  <span>📍</span>
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                <div className="meteor-modal-tags">
                  {selectedEvent.tags.map((tag, idx) => (
                    <span key={idx} className="meteor-modal-tag">#{tag}</span>
                  ))}
                </div>
              )}

              {selectedEvent.images && selectedEvent.images.length > 1 && (
                <div className="meteor-modal-gallery">
                  {selectedEvent.images.slice(1).map((image, idx) => (
                    <div key={idx} className="meteor-modal-gallery-item">
                      <img src={image} alt="" />
                    </div>
                  ))}
                </div>
              )}

              <div className="meteor-modal-actions">
                <a href={`/spaces/${spaceId}/events/${selectedEvent.id}`} className="meteor-modal-btn-primary">
                  查看完整详情
                </a>
                <button onClick={() => setSelectedEvent(null)} className="meteor-modal-btn-secondary">
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap');

        .meteor-timeline-container {
          position: relative;
          width: 100%;
          min-height: 100vh;
          overflow: hidden;
          background: linear-gradient(180deg,
            #0a0a1a 0%,
            #0d1033 30%,
            #1a1a4e 60%,
            #0d1033 80%,
            #0a0a1a 100%
          );
        }

        /* ========== 星空背景 ========== */
        .stars-background {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .stars-layer {
          position: absolute;
          width: 200%;
          height: 200%;
          top: -50%;
          left: -50%;
        }

        .stars-1 {
          background-image:
            radial-gradient(1px 1px at 10% 20%, white, transparent),
            radial-gradient(1.5px 1.5px at 30% 65%, white, transparent),
            radial-gradient(1px 1px at 50% 10%, white, transparent),
            radial-gradient(2px 2px at 70% 40%, white, transparent),
            radial-gradient(1px 1px at 90% 80%, white, transparent),
            radial-gradient(1.5px 1.5px at 15% 90%, white, transparent),
            radial-gradient(1px 1px at 45% 45%, white, transparent),
            radial-gradient(1px 1px at 85% 15%, white, transparent);
          background-size: 250px 250px;
          animation: starsMove 150s linear infinite;
        }

        .stars-2 {
          background-image:
            radial-gradient(1px 1px at 25% 35%, rgba(255,255,255,0.7), transparent),
            radial-gradient(1px 1px at 55% 75%, rgba(255,255,255,0.7), transparent),
            radial-gradient(1.5px 1.5px at 75% 25%, rgba(255,255,255,0.7), transparent),
            radial-gradient(1px 1px at 95% 55%, rgba(255,255,255,0.7), transparent);
          background-size: 300px 300px;
          animation: starsMove 200s linear infinite;
        }

        .stars-3 {
          background-image:
            radial-gradient(1px 1px at 5% 50%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 35% 15%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 65% 85%, rgba(255,255,255,0.5), transparent);
          background-size: 400px 400px;
          animation: starsMove 250s linear infinite;
        }

        /* 闪烁星星 */
        .stars-twinkle {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(2px 2px at 20% 30%, white, transparent),
            radial-gradient(2px 2px at 80% 20%, white, transparent),
            radial-gradient(2px 2px at 40% 70%, white, transparent),
            radial-gradient(2px 2px at 60% 50%, white, transparent),
            radial-gradient(2px 2px at 90% 80%, white, transparent);
          background-size: 500px 500px;
          animation: twinkle 4s ease-in-out infinite;
        }

        @keyframes starsMove {
          from { transform: translateY(0); }
          to { transform: translateY(250px); }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        /* ========== 标题区域 ========== */
        .meteor-header {
          position: relative;
          z-index: 10;
          text-align: center;
          padding: 60px 20px 40px;
        }

        .meteor-title {
          font-family: 'Playfair Display', serif;
          font-size: 4rem;
          font-weight: 700;
          background: linear-gradient(135deg, #22d3ee 0%, #60a5fa 50%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 16px;
          text-shadow: 0 0 60px rgba(34, 211, 238, 0.3);
        }

        .meteor-subtitle {
          color: #64748b;
          font-size: 1.125rem;
          letter-spacing: 0.05em;
        }

        /* ========== 流星舞台 ========== */
        .meteor-stage {
          position: relative;
          z-index: 20;
          width: 100%;
          height: 700px;
          overflow: visible;
        }

        /* ========== 哈雷彗星样式 ========== */
        .meteor-wrapper {
          position: absolute;
          left: var(--start-x);
          top: var(--start-y);
          cursor: pointer;
          animation: cometFly var(--duration) linear var(--delay) infinite;
          z-index: 30;
          padding: 30px;
          margin: -30px;
        }

        .meteor-wrapper.paused {
          animation-play-state: paused;
        }

        .meteor-wrapper:hover {
          z-index: 100;
        }

        /* 彗星飞行动画 - 优雅缓慢的划过 */
        @keyframes cometFly {
          0% {
            transform: translate(0, 0) scale(0.5);
            opacity: 0;
          }
          3% {
            transform: translate(-5vw, 3vh) scale(0.8);
            opacity: 0.6;
          }
          8% {
            transform: translate(-10vw, 6vh) scale(1);
            opacity: 1;
          }
          85% {
            transform: translate(-100vw, 70vh) scale(1);
            opacity: 1;
          }
          95% {
            transform: translate(-115vw, 78vh) scale(0.8);
            opacity: 0.5;
          }
          100% {
            transform: translate(-125vw, 85vh) scale(0.5);
            opacity: 0;
          }
        }

        .comet {
          position: relative;
          transform: rotate(var(--angle));
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .meteor-wrapper:hover .comet {
          transform: rotate(var(--angle)) scale(1.6);
        }

        /* 彗核 - 最明亮的白色核心 */
        .comet-nucleus {
          position: absolute;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: radial-gradient(circle,
            #ffffff 0%,
            #ffffff 25%,
            var(--color-core) 50%,
            transparent 100%
          );
          box-shadow:
            0 0 20px #ffffff,
            0 0 40px var(--color-core),
            0 0 80px var(--color-glow),
            0 0 120px var(--color-glow);
          z-index: 10;
        }

        /* 彗发 - 围绕彗核的发光云 */
        .comet-coma {
          position: absolute;
          width: 80px;
          height: 80px;
          left: -31px;
          top: -31px;
          border-radius: 50%;
          background: radial-gradient(ellipse at center,
            rgba(255, 255, 255, 0.5) 0%,
            var(--color-glow) 25%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 70%
          );
          filter: blur(5px);
          z-index: 5;
          animation: comaPulse 3s ease-in-out infinite;
        }

        @keyframes comaPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; }
        }

        /* 离子尾 - 细长、直线、蓝色调（指向背离太阳的方向） */
        .comet-ion-tail {
          position: absolute;
          left: 9px;
          top: 50%;
          transform: translateY(-50%);
          width: var(--length);
          height: 8px;
          background: linear-gradient(90deg,
            var(--color-core) 0%,
            var(--color-trail) 10%,
            rgba(100, 150, 255, 0.6) 30%,
            rgba(100, 150, 255, 0.3) 60%,
            transparent 100%
          );
          border-radius: 4px;
          opacity: 0.95;
          z-index: 3;
        }

        /* 离子尾的细线延伸 */
        .comet-ion-tail::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: calc(var(--length) * 2);
          height: 2px;
          background: linear-gradient(90deg,
            var(--color-trail) 0%,
            rgba(150, 180, 255, 0.5) 20%,
            rgba(150, 180, 255, 0.2) 50%,
            transparent 100%
          );
        }

        /* 尘埃尾 - 较宽、稍微弯曲、黄白色调 */
        .comet-dust-tail {
          position: absolute;
          left: 12px;
          top: -8px;
          width: calc(var(--length) * 0.9);
          height: 40px;
          background: linear-gradient(95deg,
            rgba(255, 255, 255, 0.6) 0%,
            rgba(255, 248, 220, 0.5) 15%,
            rgba(255, 240, 200, 0.3) 40%,
            rgba(255, 235, 180, 0.15) 65%,
            transparent 100%
          );
          clip-path: polygon(0% 50%, 3% 25%, 100% 15%, 100% 85%, 3% 75%);
          filter: blur(2px);
          opacity: 0.75;
          z-index: 2;
        }

        /* 尘埃尾的扩散层 */
        .comet-dust-tail::after {
          content: '';
          position: absolute;
          left: 0;
          top: -15px;
          width: calc(var(--length) * 0.7);
          height: 70px;
          background: linear-gradient(100deg,
            rgba(255, 255, 255, 0.2) 0%,
            rgba(255, 248, 220, 0.15) 25%,
            rgba(255, 240, 200, 0.05) 50%,
            transparent 70%
          );
          clip-path: polygon(0% 50%, 8% 15%, 100% 5%, 100% 95%, 8% 85%);
          filter: blur(5px);
        }

        /* 外围光晕 */
        .comet-outer-glow {
          position: absolute;
          width: 120px;
          height: 120px;
          left: -51px;
          top: -51px;
          border-radius: 50%;
          background: radial-gradient(circle,
            var(--color-glow) 0%,
            rgba(255, 255, 255, 0.1) 40%,
            transparent 70%
          );
          filter: blur(20px);
          opacity: 0.6;
          animation: outerGlowPulse 4s ease-in-out infinite;
          z-index: 1;
        }

        @keyframes outerGlowPulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }

        /* 粒子轨迹 - 模拟彗星脱落的碎片 */
        .comet-particles {
          position: absolute;
          left: 20px;
          top: 0;
          width: calc(var(--length) * 0.5);
          height: 20px;
          z-index: 4;
        }

        .comet-particles span {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 0 6px var(--color-core);
          animation: particleDrift 2s ease-out infinite;
        }

        .comet-particles span:nth-child(1) {
          left: 10%;
          top: 30%;
          animation-delay: 0s;
        }
        .comet-particles span:nth-child(2) {
          left: 25%;
          top: 60%;
          animation-delay: 0.4s;
          width: 2px;
          height: 2px;
        }
        .comet-particles span:nth-child(3) {
          left: 40%;
          top: 40%;
          animation-delay: 0.8s;
        }
        .comet-particles span:nth-child(4) {
          left: 55%;
          top: 70%;
          animation-delay: 1.2s;
          width: 2px;
          height: 2px;
        }
        .comet-particles span:nth-child(5) {
          left: 70%;
          top: 50%;
          animation-delay: 1.6s;
          width: 1px;
          height: 1px;
        }

        @keyframes particleDrift {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(15px, 8px) scale(0.3);
          }
        }

        /* ========== 悬停信息卡 ========== */
        .meteor-info {
          position: absolute;
          top: 40px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          animation: infoAppear 0.3s ease-out;
          pointer-events: none;
        }

        @keyframes infoAppear {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }

        .meteor-info-card {
          width: 300px;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          overflow: hidden;
          box-shadow:
            0 25px 50px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(34, 211, 238, 0.3),
            0 0 30px rgba(34, 211, 238, 0.1);
        }

        .meteor-info-image {
          width: 100%;
          height: 150px;
          overflow: hidden;
        }

        .meteor-info-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .meteor-info-content {
          padding: 16px 20px 20px;
        }

        .meteor-info-content h4 {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          line-height: 1.4;
        }

        .meteor-info-date {
          color: #22d3ee;
          font-size: 12px;
          margin-bottom: 10px;
        }

        .meteor-info-desc {
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .meteor-info-hint {
          display: block;
          text-align: center;
          color: #64748b;
          font-size: 11px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* ========== 底部 ========== */
        .meteor-footer {
          position: relative;
          z-index: 10;
          text-align: center;
          padding: 40px 20px 60px;
        }

        .meteor-footer p {
          color: #475569;
          font-size: 14px;
        }

        /* ========== 模态框 ========== */
        .meteor-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(10px);
          padding: 20px;
        }

        .meteor-modal {
          position: relative;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border-radius: 20px;
          box-shadow:
            0 25px 80px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(34, 211, 238, 0.2);
        }

        .meteor-modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.5);
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          z-index: 10;
          transition: all 0.2s;
        }

        .meteor-modal-close:hover {
          background: rgba(0, 0, 0, 0.8);
          transform: scale(1.1);
        }

        .meteor-modal-image {
          position: relative;
          width: 100%;
          height: 280px;
          overflow: hidden;
        }

        .meteor-modal-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .meteor-modal-image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 50%, #0f172a 100%);
        }

        .meteor-modal-content {
          padding: 24px 32px 32px;
        }

        .meteor-modal-title {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          font-weight: 700;
          color: white;
          margin-bottom: 12px;
          line-height: 1.3;
        }

        .meteor-modal-date {
          color: #22d3ee;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .meteor-modal-desc {
          color: #cbd5e1;
          font-size: 16px;
          line-height: 1.8;
          margin-bottom: 20px;
        }

        .meteor-modal-location {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #94a3b8;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .meteor-modal-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 24px;
        }

        .meteor-modal-tag {
          padding: 6px 14px;
          background: rgba(34, 211, 238, 0.15);
          color: #22d3ee;
          font-size: 13px;
          border-radius: 20px;
          border: 1px solid rgba(34, 211, 238, 0.3);
        }

        .meteor-modal-gallery {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 24px;
        }

        .meteor-modal-gallery-item {
          aspect-ratio: 1;
          border-radius: 12px;
          overflow: hidden;
        }

        .meteor-modal-gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }

        .meteor-modal-gallery-item:hover img {
          transform: scale(1.1);
        }

        .meteor-modal-actions {
          display: flex;
          gap: 12px;
        }

        .meteor-modal-btn-primary {
          flex: 1;
          padding: 14px 24px;
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
          color: white;
          font-weight: 600;
          font-size: 15px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          text-align: center;
          text-decoration: none;
          transition: all 0.2s;
        }

        .meteor-modal-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(6, 182, 212, 0.3);
        }

        .meteor-modal-btn-secondary {
          padding: 14px 24px;
          background: rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          font-weight: 600;
          font-size: 15px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .meteor-modal-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
          color: white;
        }
      `}</style>
    </div>
  );
}
