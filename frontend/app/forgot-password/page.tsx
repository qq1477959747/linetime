'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, KeyRound, Check, Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { getErrorMessage } from '@/lib/utils';
import {
  LiquidGlassCard,
  LiquidGlassInput,
  LiquidGlassButton,
  FloatingOrb,
  GinkgoLeaves,
} from '@/components/ui/liquid-glass';

type Step = 'email' | 'code' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.forgotPassword(email);
      if (response.data) {
        setMaskedEmail(response.data.masked_email);
        setStep('code');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (newPassword.length < 8) {
      setError('密码至少需要8位');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword(email, code, newPassword);
      setStep('success');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950 dark:via-orange-950 dark:to-yellow-950">
      {/* 银杏叶飘落特效 */}
      <GinkgoLeaves count={12} />

      {/* 动态背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FloatingOrb size="large" color="amber" className="absolute -top-20 -left-20 opacity-40" />
        <FloatingOrb size="medium" color="rose" className="absolute top-1/3 -right-10 opacity-30 animation-delay-1000" />
        <FloatingOrb size="large" color="yellow" className="absolute -bottom-32 left-1/4 opacity-30 animation-delay-2000" />
        
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
          {/* 返回按钮 */}
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-2 text-amber-600/70 hover:text-amber-800 dark:text-amber-400/60 dark:hover:text-amber-200 mb-8 transition-colors animate-fade-in"
          >
            <ArrowLeft className="w-4 h-4" />
            返回登录
          </button>

          {step === 'email' && (
            <div className="animate-slide-up">
              {/* 图标和标题 */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_8px_32px_rgba(251,191,36,0.4)] mb-6">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-2">忘记密码</h1>
                <p className="text-amber-700/70 dark:text-amber-200/60">输入您的邮箱，我们将发送验证码</p>
              </div>

              <LiquidGlassCard intensity="medium" className="p-6 md:p-8">
                {error && (
                  <div className="mb-6 p-4 rounded-xl bg-red-100/80 dark:bg-red-900/30 border border-red-300/50 dark:border-red-700/30">
                    <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleRequestCode} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">邮箱地址</label>
                    <LiquidGlassInput>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="请输入注册邮箱"
                        required
                        disabled={isLoading}
                        className="w-full bg-transparent text-amber-900 dark:text-amber-100 text-sm p-4 rounded-2xl focus:outline-none disabled:opacity-50 placeholder:text-amber-500/50 dark:placeholder:text-amber-400/40"
                      />
                    </LiquidGlassInput>
                  </div>
                  <LiquidGlassButton
                    type="submit"
                    variant="primary"
                    disabled={isLoading || !email}
                    className="w-full"
                  >
                    {isLoading ? '发送中...' : '发送验证码'}
                  </LiquidGlassButton>
                </form>
              </LiquidGlassCard>
            </div>
          )}

          {step === 'code' && (
            <div className="animate-slide-up">
              {/* 图标和标题 */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 shadow-[0_8px_32px_rgba(251,146,60,0.4)] mb-6">
                  <KeyRound className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-2">重置密码</h1>
                <p className="text-amber-700/70 dark:text-amber-200/60">
                  验证码已发送至 <span className="text-amber-600 dark:text-amber-300">{maskedEmail}</span>
                </p>
              </div>

              <LiquidGlassCard intensity="medium" className="p-6 md:p-8">
                {error && (
                  <div className="mb-6 p-4 rounded-xl bg-red-100/80 dark:bg-red-900/30 border border-red-300/50 dark:border-red-700/30">
                    <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">验证码</label>
                    <LiquidGlassInput>
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="请输入6位验证码"
                        required
                        maxLength={6}
                        disabled={isLoading}
                        className="w-full bg-transparent text-amber-900 dark:text-amber-100 text-sm p-4 rounded-2xl focus:outline-none disabled:opacity-50 placeholder:text-amber-500/50 dark:placeholder:text-amber-400/40 text-center text-xl tracking-[0.5em]"
                      />
                    </LiquidGlassInput>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">新密码</label>
                    <LiquidGlassInput>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="请输入新密码（至少8位）"
                          required
                          minLength={8}
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
                  <div>
                    <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">确认新密码</label>
                    <LiquidGlassInput>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="请再次输入新密码"
                          required
                          minLength={8}
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
                  </div>
                  <LiquidGlassButton
                    type="submit"
                    variant="primary"
                    disabled={isLoading || code.length !== 6 || !newPassword || !confirmPassword}
                    className="w-full"
                  >
                    {isLoading ? '重置中...' : '重置密码'}
                  </LiquidGlassButton>
                </form>

                <button
                  onClick={() => setStep('email')}
                  className="w-full mt-4 text-center text-sm text-amber-600/70 hover:text-amber-800 dark:text-amber-400/60 dark:hover:text-amber-200 transition-colors"
                >
                  没收到验证码？重新发送
                </button>
              </LiquidGlassCard>
            </div>
          )}

          {step === 'success' && (
            <div className="animate-slide-up text-center">
              {/* 成功图标 */}
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-[0_8px_32px_rgba(34,197,94,0.4)] mb-6">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-3">密码重置成功</h1>
              <p className="text-amber-700/70 dark:text-amber-200/60 mb-8">您的密码已成功重置，请使用新密码登录</p>
              
              <LiquidGlassButton
                onClick={() => router.push('/login')}
                variant="primary"
                className="w-full max-w-xs mx-auto"
              >
                返回登录
              </LiquidGlassButton>
            </div>
          )}

          {/* 底部装饰文字 */}
          <p className="mt-8 text-center text-xs text-amber-600/50 dark:text-amber-400/40 animate-fade-in animation-delay-500">
            LineTime · 记录美好时光
          </p>
        </div>
      </div>
    </div>
  );
}
