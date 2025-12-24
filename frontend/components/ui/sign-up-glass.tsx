'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, ChevronDown, Sparkles, User, Mail, Lock, CheckCircle } from 'lucide-react';
import {
  LiquidGlassCard,
  LiquidGlassInput,
  LiquidGlassButton,
  FloatingOrb,
  GinkgoLeaves,
} from './liquid-glass';

const EMAIL_DOMAINS = [
  { value: 'qq.com', label: 'QQ邮箱' },
  { value: '163.com', label: '网易邮箱' },
  { value: '126.com', label: '126邮箱' },
  { value: 'gmail.com', label: 'Gmail' },
  { value: 'outlook.com', label: 'Outlook' },
  { value: 'foxmail.com', label: 'Foxmail' },
  { value: 'sina.com', label: '新浪邮箱' },
  { value: 'aliyun.com', label: '阿里云邮箱' },
  { value: 'icloud.com', label: 'iCloud' },
  { value: 'hotmail.com', label: 'Hotmail' },
];

interface SignUpGlassPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  onSignUp?: (event: React.FormEvent<HTMLFormElement>) => void;
  onSignIn?: () => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
}

// 玻璃风格邮箱选择器
const GlassEmailInput = ({
  hasError,
  disabled,
  emailPrefix,
  setEmailPrefix,
  emailDomain,
  setEmailDomain,
}: {
  hasError?: boolean;
  disabled?: boolean;
  emailPrefix: string;
  setEmailPrefix: (value: string) => void;
  emailDomain: string;
  setEmailDomain: (value: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right - 200 + window.scrollX,
        width: 200,
      });
    }
  }, [isOpen]);

  const handleSelectDomain = (domain: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEmailDomain(domain);
    setIsOpen(false);
  };

  const handleToggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsOpen(!isOpen);
  };

  const dropdownContent = isOpen && typeof window !== 'undefined' ? createPortal(
    <div
      className="fixed rounded-xl overflow-hidden backdrop-blur-xl bg-white/90 dark:bg-amber-900/90 border border-amber-200/50 dark:border-amber-700/30 shadow-2xl py-1 max-h-60 overflow-y-auto"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        zIndex: 99999,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {EMAIL_DOMAINS.map((domain) => (
        <div
          key={domain.value}
          onMouseDown={(e) => handleSelectDomain(domain.value, e)}
          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-amber-100/80 dark:hover:bg-amber-800/50 transition-colors cursor-pointer select-none ${
            emailDomain === domain.value ? 'text-amber-600 dark:text-amber-300 bg-amber-100/50 dark:bg-amber-800/30' : 'text-amber-800 dark:text-amber-200'
          }`}
        >
          <span className="font-medium">{domain.value}</span>
          <span className="text-amber-500/60 dark:text-amber-400/50 ml-2 text-xs">{domain.label}</span>
        </div>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`
          flex rounded-2xl border
          ${hasError ? 'border-red-300/50 bg-red-50/50' : 'border-amber-200/40 bg-white/30'}
          backdrop-blur-sm
          transition-all duration-300
          focus-within:border-amber-300/60
          focus-within:bg-white/50
        `}
      >
        <input
          type="text"
          value={emailPrefix}
          onChange={(e) => setEmailPrefix(e.target.value.replace(/[@\s]/g, ''))}
          placeholder="邮箱用户名"
          disabled={disabled}
          className="flex-1 bg-transparent text-amber-900 dark:text-amber-100 text-sm p-4 rounded-l-2xl focus:outline-none disabled:opacity-50 min-w-0 placeholder:text-amber-500/50 dark:placeholder:text-amber-400/40"
        />
        <div className="flex items-center text-amber-500/60 px-1">@</div>
        <button
          ref={buttonRef}
          type="button"
          onMouseDown={handleToggleDropdown}
          disabled={disabled}
          className="flex items-center gap-1 px-3 py-4 text-sm hover:bg-amber-100/30 dark:hover:bg-amber-800/20 rounded-r-2xl transition-colors disabled:opacity-50"
        >
          <span className="text-amber-700 dark:text-amber-300">{emailDomain}</span>
          <ChevronDown className={`w-4 h-4 text-amber-500/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {dropdownContent}
      <input type="hidden" name="email" value={emailPrefix ? `${emailPrefix}@${emailDomain}` : ''} />
    </div>
  );
};

export const SignUpGlassPage: React.FC<SignUpGlassPageProps> = ({
  title = '创建账号',
  description = '加入 LineTime，与亲朋好友一起记录美好时光',
  onSignUp,
  onSignIn,
  isLoading = false,
  errors = {},
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailPrefix, setEmailPrefix] = useState('');
  const [emailDomain, setEmailDomain] = useState('qq.com');

  return (
    <div className="min-h-[100dvh] w-full relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950 dark:via-orange-950 dark:to-yellow-950">
      {/* 银杏叶飘落特效 */}
      <GinkgoLeaves count={15} />

      {/* 动态背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FloatingOrb size="large" color="orange" className="absolute -top-20 -right-20 opacity-40" />
        <FloatingOrb size="medium" color="amber" className="absolute top-1/2 -left-10 opacity-30 animation-delay-1000" />
        <FloatingOrb size="large" color="yellow" className="absolute -bottom-32 right-1/4 opacity-30 animation-delay-2000" />
        <FloatingOrb size="small" color="rose" className="absolute top-1/4 left-1/3 opacity-40 animation-delay-3000" />

        {/* 网格背景 */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(180,83,9,0.2) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(180,83,9,0.2) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* 主内容 */}
      <div className="relative z-10 min-h-[100dvh] flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          {/* Logo 和标题区域 */}
          <div className="text-center mb-6 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_8px_32px_rgba(251,191,36,0.4)] mb-5">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-amber-900 dark:text-amber-100 mb-2 tracking-tight">
              {title}
            </h1>
            <p className="text-amber-700/70 dark:text-amber-200/60 text-sm md:text-base">{description}</p>
          </div>

          {/* 玻璃卡片 */}
          <LiquidGlassCard intensity="medium" className="p-6 md:p-8 animate-slide-up">
            <form className="space-y-4" onSubmit={onSignUp}>
              {/* 错误提示 */}
              {errors.submit && (
                <div className="p-4 rounded-xl bg-red-100/80 dark:bg-red-900/30 border border-red-300/50 dark:border-red-700/30">
                  <p className="text-red-600 dark:text-red-300 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {errors.submit}
                  </p>
                </div>
              )}

              {/* 用户名 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  <User className="w-4 h-4" />
                  用户名
                </label>
                <LiquidGlassInput hasError={!!errors.username}>
                  <input
                    name="username"
                    type="text"
                    placeholder="3-50 个字符"
                    disabled={isLoading}
                    className="w-full bg-transparent text-amber-900 dark:text-amber-100 text-sm p-4 rounded-2xl focus:outline-none disabled:opacity-50 placeholder:text-amber-500/50 dark:placeholder:text-amber-400/40"
                  />
                </LiquidGlassInput>
                {errors.username && <p className="mt-1.5 text-sm text-red-500">{errors.username}</p>}
              </div>

              {/* 邮箱 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  <Mail className="w-4 h-4" />
                  邮箱
                </label>
                <GlassEmailInput
                  hasError={!!errors.email}
                  disabled={isLoading}
                  emailPrefix={emailPrefix}
                  setEmailPrefix={setEmailPrefix}
                  emailDomain={emailDomain}
                  setEmailDomain={setEmailDomain}
                />
                {errors.email && <p className="mt-1.5 text-sm text-red-500">{errors.email}</p>}
              </div>

              {/* 密码 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  <Lock className="w-4 h-4" />
                  密码
                </label>
                <LiquidGlassInput hasError={!!errors.password}>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="至少 8 位，包含字母和数字"
                      disabled={isLoading}
                      className="w-full bg-transparent text-amber-900 dark:text-amber-100 text-sm p-4 pr-12 rounded-2xl focus:outline-none disabled:opacity-50 placeholder:text-amber-500/50 dark:placeholder:text-amber-400/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-amber-500/60 hover:text-amber-700 dark:hover:text-amber-300 transition-colors" />
                      ) : (
                        <Eye className="w-5 h-5 text-amber-500/60 hover:text-amber-700 dark:hover:text-amber-300 transition-colors" />
                      )}
                    </button>
                  </div>
                </LiquidGlassInput>
                {errors.password && <p className="mt-1.5 text-sm text-red-500">{errors.password}</p>}
              </div>

              {/* 确认密码 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  确认密码
                </label>
                <LiquidGlassInput hasError={!!errors.confirmPassword}>
                  <div className="relative">
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="再次输入密码"
                      disabled={isLoading}
                      className="w-full bg-transparent text-amber-900 dark:text-amber-100 text-sm p-4 pr-12 rounded-2xl focus:outline-none disabled:opacity-50 placeholder:text-amber-500/50 dark:placeholder:text-amber-400/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5 text-amber-500/60 hover:text-amber-700 dark:hover:text-amber-300 transition-colors" />
                      ) : (
                        <Eye className="w-5 h-5 text-amber-500/60 hover:text-amber-700 dark:hover:text-amber-300 transition-colors" />
                      )}
                    </button>
                  </div>
                </LiquidGlassInput>
                {errors.confirmPassword && <p className="mt-1.5 text-sm text-red-500">{errors.confirmPassword}</p>}
              </div>

              <LiquidGlassButton
                type="submit"
                variant="primary"
                disabled={isLoading}
                className="w-full mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    注册中...
                  </span>
                ) : '创建账号'}
              </LiquidGlassButton>
            </form>

            {/* 登录链接 */}
            <p className="mt-6 text-center text-sm text-amber-600/70 dark:text-amber-400/60">
              已有账号？{' '}
              <button
                type="button"
                onClick={onSignIn}
                className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 transition-colors font-medium"
              >
                立即登录
              </button>
            </p>
          </LiquidGlassCard>

          {/* 底部装饰文字 */}
          <p className="mt-6 text-center text-xs text-amber-600/50 dark:text-amber-400/40 animate-fade-in animation-delay-500">
            LineTime · 记录美好时光
          </p>
        </div>
      </div>
    </div>
  );
};
