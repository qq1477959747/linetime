'use client';

import React, { useEffect, useState } from 'react';

// Liquid Glass 基础容器组件
export const LiquidGlassCard = ({
  children,
  className = '',
  intensity = 'medium',
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: 'light' | 'medium' | 'strong';
}) => {
  const intensityStyles = {
    light: 'bg-white/40 backdrop-blur-md border-white/30',
    medium: 'bg-white/50 backdrop-blur-xl border-white/40',
    strong: 'bg-white/60 backdrop-blur-2xl border-white/50',
  };

  return (
    <div
      className={`
        ${intensityStyles[intensity]}
        rounded-3xl border
        shadow-[0_8px_32px_rgba(0,0,0,0.06)]
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Liquid Glass 输入框
export const LiquidGlassInput = ({
  hasError,
  children,
  className = '',
}: {
  hasError?: boolean;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`
      rounded-2xl border
      ${hasError 
        ? 'border-red-300/50 bg-red-50/50' 
        : 'border-amber-200/40 bg-white/30'
      }
      backdrop-blur-sm
      shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]
      transition-all duration-300
      focus-within:border-amber-300/60
      focus-within:bg-white/50
      focus-within:shadow-[0_0_12px_rgba(251,191,36,0.1)]
      hover:bg-white/40
      ${className}
    `}
  >
    {children}
  </div>
);

// Liquid Glass 按钮
export const LiquidGlassButton = ({
  children,
  variant = 'primary',
  disabled,
  className = '',
  ...props
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const variants = {
    primary: `
      bg-gradient-to-r from-amber-500 to-orange-500
      hover:from-amber-400 hover:to-orange-400
      text-white font-medium
      shadow-[0_4px_20px_rgba(251,191,36,0.4)]
      hover:shadow-[0_6px_30px_rgba(251,191,36,0.5)]
    `,
    secondary: `
      bg-white/15 backdrop-blur-lg
      border border-white/30
      text-foreground
      hover:bg-white/25
      shadow-[0_4px_16px_rgba(0,0,0,0.1)]
    `,
    ghost: `
      bg-transparent
      text-amber-400
      hover:bg-amber-500/10
      border border-transparent
      hover:border-amber-400/30
    `,
  };

  return (
    <button
      disabled={disabled}
      className={`
        ${variants[variant]}
        rounded-2xl py-4 px-6
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.98]
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

// 浮动装饰球 - 暖色调
export const FloatingOrb = ({
  size = 'medium',
  color = 'amber',
  className = '',
}: {
  size?: 'small' | 'medium' | 'large';
  color?: 'amber' | 'orange' | 'yellow' | 'rose';
  className?: string;
}) => {
  const sizes = {
    small: 'w-32 h-32',
    medium: 'w-48 h-48',
    large: 'w-64 h-64',
  };

  const colors = {
    amber: 'from-amber-500/40 to-amber-600/20',
    orange: 'from-orange-500/40 to-orange-600/20',
    yellow: 'from-yellow-500/40 to-yellow-600/20',
    rose: 'from-rose-400/40 to-rose-500/20',
  };

  return (
    <div
      className={`
        ${sizes[size]}
        rounded-full
        bg-gradient-to-br ${colors[color]}
        blur-3xl
        animate-float
        ${className}
      `}
    />
  );
};

// 单个银杏叶组件 - 精美版本
const GinkgoLeaf = ({ 
  style, 
  delay,
  size,
  id,
}: { 
  style: React.CSSProperties;
  delay: number;
  size: number;
  id: number;
}) => {
  const gradientId = `ginkgoGradient-${id}`;
  
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        ...style,
        filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.2))',
        animation: `ginkgo-fall ${10 + Math.random() * 8}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          animation: `ginkgo-sway ${3 + Math.random() * 2}s ease-in-out infinite alternate`,
          animationDelay: `${delay}s`,
          transformOrigin: 'center bottom',
        }}
      >
        {/* 渐变定义：从根部深褐过渡到顶部金黄 */}
        <defs>
          <linearGradient id={gradientId} x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#8e6e22" />
            <stop offset="20%" stopColor="#f1c40f" />
            <stop offset="100%" stopColor="#f39c12" />
          </linearGradient>
        </defs>
        
        {/* 叶柄 */}
        <path 
          d="M50,100 Q52,85 50,75" 
          stroke="#8e6e22" 
          strokeWidth="2" 
          fill="none" 
          strokeLinecap="round"
        />
        
        {/* 叶片主体 - 扇形带中间凹陷 */}
        <path 
          d="M 50,75 
             C 20,75 5,50 10,30 
             Q 15,25 25,28 
             T 40,25
             Q 45,35 50,45  
             Q 55,35 60,25 
             Q 75,22 80,28
             T 90,30
             C 95,50 80,75 50,75 Z" 
          fill={`url(#${gradientId})`}
        />
        
        {/* 叶脉纹理 */}
        <g stroke="#e67e22" strokeWidth="0.5" fill="none" opacity="0.4">
          <path d="M50,75 Q40,60 30,35" />
          <path d="M50,75 Q60,60 70,35" />
          <path d="M50,75 Q50,60 50,30" />
        </g>
      </svg>
    </div>
  );
};

// 银杏叶飘落特效组件
export const GinkgoLeaves = ({ count = 15 }: { count?: number }) => {
  const [leaves, setLeaves] = useState<Array<{
    id: number;
    left: number;
    delay: number;
    size: number;
  }>>([]);

  useEffect(() => {
    const newLeaves = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 12,
      size: 30 + Math.random() * 30,
    }));
    setLeaves(newLeaves);
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {leaves.map((leaf) => (
        <GinkgoLeaf
          key={leaf.id}
          id={leaf.id}
          style={{ left: `${leaf.left}%`, top: '-60px' }}
          delay={leaf.delay}
          size={leaf.size}
        />
      ))}
    </div>
  );
};
