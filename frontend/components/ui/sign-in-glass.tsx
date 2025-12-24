'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, Sparkles } from 'lucide-react';
import {
  LiquidGlassCard,
  LiquidGlassInput,
  LiquidGlassButton,
  FloatingOrb,
  GinkgoLeaves,
} from './liquid-glass';

type LoginMode = 'password' | 'code';

interface SignInGlassPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onSendCode?: (email: string) => Promise<void>;
  onCodeLogin?: (email: string, code: string, rememberMe: boolean) => Promise<void>;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  isLoading?: boolean;
  error?: string;
}

export const SignInGlassPage: React.FC<SignInGlassPageProps> = ({
  title = '欢迎回来',
  description = '登录您的账号，继续记录美好时光',
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
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [localError, setLocalError] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    const emailInput = document.querySelector('input[name="loginEmail"]') as HTMLInputElement;
    const emailValue = emailInput?.value?.trim();
    
    if (!emailValue) {
      setLocalError('请输入邮箱');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setLocalError('邮箱格式不正确');
      return;
    }

    setLocalError('');
    setIsSendingCode(true);
    try {
      await onSendCode?.(emailValue);
      setCodeSent(true);
      setCountdown(60);
    } catch (err: any) {
      setLocalError(err?.message || '发送验证码失败');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleCodeLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const emailValue = (formData.get('loginEmail') as string)?.trim();
    const codeValue = (formData.get('loginCode') as string)?.trim();
    const rememberMe = formData.get('codeRememberMe') === 'on';

    if (!emailValue) {
      setLocalError('请输入邮箱');
      return;
    }
    if (!codeValue || codeValue.length !== 6) {
      setLocalError('请输入6位验证码');
      return;
    }

    setLocalError('');
    try {
      await onCodeLogin?.(emailValue, codeValue, rememberMe);
    } catch (err: any) {
      setLocalError(err?.message || '登录失败');
    }
  };

  const displayError = error || localError;

  return (
    <div className="min-h-[100dvh] w-full relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950 dark:via-orange-950 dark:to-yellow-950">
      {/* 银杏叶飘落特效 */}
      <GinkgoLeaves count={18} />

      {/* 动态背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FloatingOrb size="large" color="amber" className="absolute -top-20 -left-20 opacity-40" />
        <FloatingOrb size="medium" color="orange" className="absolute top-1/3 -right-10 opacity-30 animation-delay-1000" />
        <FloatingOrb size="large" color="yellow" className="absolute -bottom-32 left-1/4 opacity-30 animation-delay-2000" />
        <FloatingOrb size="small" color="rose" className="absolute bottom-1/4 right-1/3 opacity-40 animation-delay-3000" />
        
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
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_8px_32px_rgba(251,191,36,0.4)] mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-amber-900 dark:text-amber-100 mb-2 tracking-tight">
              {title}
            </h1>
            <p className="text-amber-700/70 dark:text-amber-200/60 text-sm md:text-base">{description}</p>
          </div>

          {/* 玻璃卡片 */}
          <LiquidGlassCard intensity="medium" className="p-6 md:p-8 animate-slide-up bg-white/40 dark:bg-amber-900/30 border-amber-200/50 dark:border-amber-700/30">
            {/* 登录模式切换 */}
            <div className="flex rounded-xl bg-amber-100/50 dark:bg-amber-900/30 p-1 mb-6">
              <button
                type="button"
                onClick={() => { setLoginMode('password'); setLocalError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                  loginMode === 'password'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg'
                    : 'text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100'
                }`}
              >
                <Lock className="w-4 h-4" />
                密码登录
              </button>
              <button
                type="button"
                onClick={() => { setLoginMode('code'); setLocalError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                  loginMode === 'code'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg'
                    : 'text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100'
                }`}
              >
                <Mail className="w-4 h-4" />
                验证码登录
              </button>
            </div>

            {/* 错误提示 */}
            {displayError && (
              <div className="mb-6 p-4 rounded-xl bg-red-100/80 dark:bg-red-900/30 border border-red-300/50 dark:border-red-700/30">
                <p className="text-red-600 dark:text-red-300 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {displayError}
                </p>
              </div>
            )}

            {loginMode === 'password' ? (
              <form className="space-y-5" onSubmit={onSignIn}>
                <div>
                  <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">用户名 / 邮箱</label>
                  <LiquidGlassInput>
                    <input
                      name="username"
                      type="text"
                      placeholder="请输入用户名或邮箱"
                      disabled={isLoading}
                      className="w-full bg-transparent text-amber-900 dark:text-amber-100 text-sm p-4 rounded-2xl focus:outline-none disabled:opacity-50 placeholder:text-amber-500/50 dark:placeholder:text-amber-400/40"
                    />
                  </LiquidGlassInput>
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">密码</label>
                  <LiquidGlassInput>
                    <div className="relative">
                      <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="请输入密码"
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
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input type="checkbox" name="rememberMe" className="peer sr-only" />
                      <div className="w-5 h-5 rounded-md border border-amber-400/50 bg-white/30 dark:bg-amber-900/30 peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all" />
                      <svg className="absolute top-1 left-1 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-amber-700 dark:text-amber-300 group-hover:text-amber-900 dark:group-hover:text-amber-100 transition-colors">记住我</span>
                  </label>
                  <button
                    type="button"
                    onClick={onResetPassword}
                    className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 transition-colors"
                  >
                    忘记密码？
                  </button>
                </div>

                <LiquidGlassButton
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      登录中...
                    </span>
                  ) : '登录'}
                </LiquidGlassButton>
              </form>
            ) : (
              <form className="space-y-5" onSubmit={handleCodeLogin}>
                <div>
                  <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">邮箱</label>
                  <LiquidGlassInput>
                    <input
                      name="loginEmail"
                      type="email"
                      placeholder="请输入注册邮箱"
                      disabled={isLoading || isSendingCode}
                      className="w-full bg-transparent text-amber-900 dark:text-amber-100 text-sm p-4 rounded-2xl focus:outline-none disabled:opacity-50 placeholder:text-amber-500/50 dark:placeholder:text-amber-400/40"
                    />
                  </LiquidGlassInput>
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">验证码</label>
                  <div className="flex gap-3">
                    <LiquidGlassInput className="flex-1">
                      <input
                        name="loginCode"
                        type="text"
                        placeholder="6位验证码"
                        maxLength={6}
                        disabled={isLoading}
                        className="w-full bg-transparent text-amber-900 dark:text-amber-100 text-sm p-4 rounded-2xl focus:outline-none disabled:opacity-50 placeholder:text-amber-500/50 dark:placeholder:text-amber-400/40"
                      />
                    </LiquidGlassInput>
                    <LiquidGlassButton
                      type="button"
                      variant="secondary"
                      onClick={handleSendCode}
                      disabled={countdown > 0 || isLoading || isSendingCode}
                      className="shrink-0 !py-0 px-5 text-sm text-amber-700 dark:text-amber-300"
                    >
                      {isSendingCode ? '发送中...' : countdown > 0 ? `${countdown}s` : codeSent ? '重新发送' : '获取验证码'}
                    </LiquidGlassButton>
                  </div>
                </div>

                <div className="flex items-center text-sm">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input type="checkbox" name="codeRememberMe" className="peer sr-only" />
                      <div className="w-5 h-5 rounded-md border border-amber-400/50 bg-white/30 dark:bg-amber-900/30 peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all" />
                      <svg className="absolute top-1 left-1 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-amber-700 dark:text-amber-300 group-hover:text-amber-900 dark:group-hover:text-amber-100 transition-colors">记住我</span>
                  </label>
                </div>

                <LiquidGlassButton
                  type="submit"
                  variant="primary"
                  disabled={isLoading || !codeSent}
                  className="w-full"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      登录中...
                    </span>
                  ) : '登录'}
                </LiquidGlassButton>
              </form>
            )}

            {/* 注册链接 */}
            <p className="mt-6 text-center text-sm text-amber-600/70 dark:text-amber-400/60">
              还没有账号？{' '}
              <button
                type="button"
                onClick={onCreateAccount}
                className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 transition-colors font-medium"
              >
                立即注册
              </button>
            </p>
          </LiquidGlassCard>

          {/* 底部装饰文字 */}
          <p className="mt-8 text-center text-xs text-amber-600/50 dark:text-amber-400/40 animate-fade-in animation-delay-500">
            LineTime · 记录美好时光
          </p>
        </div>
      </div>
    </div>
  );
};
