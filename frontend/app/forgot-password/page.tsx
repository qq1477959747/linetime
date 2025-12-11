'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, KeyRound, Check } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { getErrorMessage } from '@/lib/utils';

type Step = 'email' | 'code' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.push('/login')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回登录
        </button>

        {step === 'email' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-violet-600" />
              </div>
              <h1 className="text-2xl font-semibold">忘记密码</h1>
              <p className="text-muted-foreground mt-2">输入您的邮箱，我们将发送验证码</p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">邮箱地址</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入注册邮箱"
                  required
                  disabled={isLoading}
                  className="w-full mt-1 p-4 rounded-2xl border border-border bg-foreground/5 focus:border-violet-400 focus:outline-none disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-medium transition-colors disabled:opacity-50"
              >
                {isLoading ? '发送中...' : '发送验证码'}
              </button>
            </form>
          </div>
        )}


        {step === 'code' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-violet-600" />
              </div>
              <h1 className="text-2xl font-semibold">重置密码</h1>
              <p className="text-muted-foreground mt-2">
                验证码已发送至 <span className="text-foreground">{maskedEmail}</span>
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">验证码</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="请输入6位验证码"
                  required
                  maxLength={6}
                  disabled={isLoading}
                  className="w-full mt-1 p-4 rounded-2xl border border-border bg-foreground/5 focus:border-violet-400 focus:outline-none disabled:opacity-50 text-center text-2xl tracking-widest"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">新密码</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="请输入新密码（至少8位）"
                  required
                  minLength={8}
                  disabled={isLoading}
                  className="w-full mt-1 p-4 rounded-2xl border border-border bg-foreground/5 focus:border-violet-400 focus:outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">确认新密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入新密码"
                  required
                  minLength={8}
                  disabled={isLoading}
                  className="w-full mt-1 p-4 rounded-2xl border border-border bg-foreground/5 focus:border-violet-400 focus:outline-none disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || code.length !== 6 || !newPassword || !confirmPassword}
                className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-medium transition-colors disabled:opacity-50"
              >
                {isLoading ? '重置中...' : '重置密码'}
              </button>
            </form>

            <button
              onClick={() => setStep('email')}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              没收到验证码？重新发送
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold">密码重置成功</h1>
            <p className="text-muted-foreground">您的密码已成功重置，请使用新密码登录</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-medium transition-colors"
            >
              返回登录
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
