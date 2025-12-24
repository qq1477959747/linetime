'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

// --- TYPE DEFINITIONS ---
export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

type LoginMode = 'password' | 'code';

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onSendCode?: (email: string) => Promise<void>;
  onCodeLogin?: (email: string, code: string, rememberMe: boolean) => Promise<void>;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  isLoading?: boolean;
  error?: string;
}

// --- SUB-COMPONENTS ---
const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial; delay: string }) => (
  <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-card/40 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-5 w-64`}>
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-2xl" alt="avatar" />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium">{testimonial.name}</p>
      <p className="text-muted-foreground">{testimonial.handle}</p>
      <p className="mt-1 text-foreground/80">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---
export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Welcome</span>,
  description = 'Access your account and continue your journey with us',
  heroImageSrc,
  testimonials = [],
  onSignIn,
  onSendCode,
  onCodeLogin,
  onResetPassword,
  onCreateAccount,
  isLoading = false,
  error,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>('password');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (!email?.trim()) {
      setLocalError('请输入邮箱');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError('邮箱格式不正确');
      return;
    }

    setLocalError('');
    setIsSendingCode(true);
    try {
      await onSendCode?.(email);
      setCodeSent(true);
      setCountdown(60);
    } catch (err: any) {
      setLocalError(err?.message || '发送验证码失败');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email?.trim()) {
      setLocalError('请输入邮箱');
      return;
    }
    if (!code || code.length !== 6) {
      setLocalError('请输入6位验证码');
      return;
    }

    setLocalError('');
    try {
      await onCodeLogin?.(email, code, rememberMe);
    } catch (err: any) {
      setLocalError(err?.message || '登录失败');
    }
  };

  const displayError = error || localError;

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-sans w-[100dvw]">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
              {title}
            </h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">{description}</p>

            {/* Login mode tabs */}
            <div className="animate-element animate-delay-250 flex rounded-2xl border border-border p-1 bg-foreground/5">
              <button
                type="button"
                onClick={() => { setLoginMode('password'); setLocalError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${
                  loginMode === 'password'
                    ? 'bg-violet-600 text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Lock className="w-4 h-4" />
                密码登录
              </button>
              <button
                type="button"
                onClick={() => { setLoginMode('code'); setLocalError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${
                  loginMode === 'code'
                    ? 'bg-violet-600 text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Mail className="w-4 h-4" />
                验证码登录
              </button>
            </div>

            {/* Error message */}
            {displayError && (
              <div className="animate-element bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {displayError}
              </div>
            )}

            {loginMode === 'password' ? (
              /* Password login form */
              <form className="space-y-5" onSubmit={onSignIn}>
                <div className="animate-element animate-delay-300">
                  <label className="text-sm font-medium text-muted-foreground">用户名 / 邮箱</label>
                  <GlassInputWrapper>
                    <input
                      name="username"
                      type="text"
                      placeholder="请输入用户名或邮箱"
                      disabled={isLoading}
                      className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none disabled:opacity-50"
                    />
                  </GlassInputWrapper>
                </div>

                <div className="animate-element animate-delay-400">
                  <label className="text-sm font-medium text-muted-foreground">密码</label>
                  <GlassInputWrapper>
                    <div className="relative">
                      <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="请输入密码"
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
                </div>

                <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="rememberMe" className="w-4 h-4 rounded" />
                    <span className="text-foreground/90">记住我</span>
                  </label>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onResetPassword?.();
                    }}
                    className="hover:underline text-violet-500 transition-colors"
                  >
                    忘记密码？
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="animate-element animate-delay-600 w-full rounded-2xl bg-violet-600 hover:bg-violet-700 py-4 font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      登录中...
                    </>
                  ) : (
                    '登录'
                  )}
                </button>
              </form>
            ) : (
              /* Code login form */
              <form className="space-y-5" onSubmit={handleCodeLogin}>
                <div className="animate-element animate-delay-300">
                  <label className="text-sm font-medium text-muted-foreground">邮箱</label>
                  <GlassInputWrapper>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="请输入注册邮箱"
                      disabled={isLoading || isSendingCode}
                      className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none disabled:opacity-50"
                    />
                  </GlassInputWrapper>
                </div>

                <div className="animate-element animate-delay-400">
                  <label className="text-sm font-medium text-muted-foreground">验证码</label>
                  <div className="flex gap-3">
                    <GlassInputWrapper>
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6位验证码"
                        maxLength={6}
                        disabled={isLoading}
                        className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none disabled:opacity-50"
                      />
                    </GlassInputWrapper>
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={countdown > 0 || isLoading || isSendingCode}
                      className="shrink-0 px-6 rounded-2xl border border-violet-500 text-violet-500 hover:bg-violet-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {isSendingCode ? '发送中...' : countdown > 0 ? `${countdown}s` : codeSent ? '重新发送' : '获取验证码'}
                    </button>
                  </div>
                </div>

                <div className="animate-element animate-delay-500 flex items-center text-sm">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-foreground/90">记住我</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !codeSent}
                  className="animate-element animate-delay-600 w-full rounded-2xl bg-violet-600 hover:bg-violet-700 py-4 font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      登录中...
                    </>
                  ) : (
                    '登录'
                  )}
                </button>
              </form>
            )}

            <p className="animate-element animate-delay-700 text-center text-sm text-muted-foreground">
              还没有账号？{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onCreateAccount?.();
                }}
                className="text-violet-500 hover:underline transition-colors"
              >
                立即注册
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
              {testimonials[2] && (
                <div className="hidden 2xl:flex">
                  <TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" />
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
