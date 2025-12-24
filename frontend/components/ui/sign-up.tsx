'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';

// 常用邮箱后缀列表
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

// --- TYPE DEFINITIONS ---
export interface SignUpTestimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignUpPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: SignUpTestimonial[];
  onSignUp?: (event: React.FormEvent<HTMLFormElement>) => void;
  onSignIn?: () => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
}

// --- SUB-COMPONENTS ---
const GlassInputWrapper = ({
  children,
  hasError,
}: {
  children: React.ReactNode;
  hasError?: boolean;
}) => (
  <div
    className={`rounded-2xl border ${hasError ? 'border-red-400' : 'border-border'} bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10`}
  >
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: SignUpTestimonial; delay: string }) => (
  <div
    className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-card/40 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-5 w-64`}
  >
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-2xl" alt="avatar" />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium">{testimonial.name}</p>
      <p className="text-muted-foreground">{testimonial.handle}</p>
      <p className="mt-1 text-foreground/80">{testimonial.text}</p>
    </div>
  </div>
);

// 邮箱输入组件
const EmailInput = ({ 
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`flex rounded-2xl border ${hasError ? 'border-red-400' : 'border-border'} bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10`}>
      <input
        type="text"
        value={emailPrefix}
        onChange={(e) => setEmailPrefix(e.target.value.replace(/[@\s]/g, ''))}
        placeholder="邮箱用户名"
        disabled={disabled}
        className="flex-1 bg-transparent text-sm p-4 rounded-l-2xl focus:outline-none disabled:opacity-50 min-w-0"
      />
      <div className="flex items-center text-muted-foreground px-1">@</div>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="flex items-center gap-1 px-3 py-4 text-sm hover:bg-foreground/5 rounded-r-2xl transition-colors disabled:opacity-50"
        >
          <span className="text-foreground">{emailDomain}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-background border border-border rounded-xl shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
            {EMAIL_DOMAINS.map((domain) => (
              <button
                key={domain.value}
                type="button"
                onClick={() => {
                  setEmailDomain(domain.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-foreground/5 transition-colors ${
                  emailDomain === domain.value ? 'text-violet-500 bg-violet-500/10' : ''
                }`}
              >
                <span className="font-medium">{domain.value}</span>
                <span className="text-muted-foreground ml-2 text-xs">{domain.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Hidden input for form submission */}
      <input type="hidden" name="email" value={emailPrefix ? `${emailPrefix}@${emailDomain}` : ''} />
    </div>
  );
};

// --- MAIN COMPONENT ---
export const SignUpPage: React.FC<SignUpPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">创建账号</span>,
  description = '加入我们，开始记录美好时光',
  heroImageSrc,
  testimonials = [],
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
    <div className="h-[100dvh] flex flex-col md:flex-row font-sans w-[100dvw]">
      {/* Left column: sign-up form */}
      <section className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-5">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
              {title}
            </h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">{description}</p>

            <form className="space-y-4" onSubmit={onSignUp}>
              {/* Error message */}
              {errors.submit && (
                <div className="animate-element bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.submit}
                </div>
              )}

              {/* Username */}
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-muted-foreground">用户名</label>
                <GlassInputWrapper hasError={!!errors.username}>
                  <input
                    name="username"
                    type="text"
                    placeholder="3-50 个字符"
                    disabled={isLoading}
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none disabled:opacity-50"
                  />
                </GlassInputWrapper>
                {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username}</p>}
              </div>

              {/* Email */}
              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-muted-foreground">邮箱</label>
                <EmailInput
                  hasError={!!errors.email}
                  disabled={isLoading}
                  emailPrefix={emailPrefix}
                  setEmailPrefix={setEmailPrefix}
                  emailDomain={emailDomain}
                  setEmailDomain={setEmailDomain}
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="animate-element animate-delay-500">
                <label className="text-sm font-medium text-muted-foreground">密码</label>
                <GlassInputWrapper hasError={!!errors.password}>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="至少 8 位，包含字母和数字"
                      disabled={isLoading}
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                      ) : (
                        <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="animate-element animate-delay-600">
                <label className="text-sm font-medium text-muted-foreground">确认密码</label>
                <GlassInputWrapper hasError={!!errors.confirmPassword}>
                  <div className="relative">
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="再次输入密码"
                      disabled={isLoading}
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                      ) : (
                        <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="animate-element animate-delay-700 w-full rounded-2xl bg-violet-600 hover:bg-violet-700 py-4 font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    注册中...
                  </>
                ) : (
                  '创建账号'
                )}
              </button>
            </form>

            <p className="animate-element animate-delay-800 text-center text-sm text-muted-foreground">
              已有账号？{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onSignIn?.();
                }}
                className="text-violet-500 hover:underline transition-colors"
              >
                立即登录
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div
            className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImageSrc})` }}
          ></div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
              {testimonials[1] && (
                <div className="hidden xl:flex">
                  <TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" />
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
