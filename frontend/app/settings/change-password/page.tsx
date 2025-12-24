'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, KeyRound, Check, Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { getErrorMessage } from '@/lib/utils';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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

    // Check password strength
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      setError('密码必须包含字母和数字');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.changePassword(currentPassword, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold">密码修改成功</h1>
          <p className="text-muted-foreground">您的密码已成功修改</p>
          <button
            onClick={() => router.back()}
            className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-medium transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>

        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-violet-600" />
            </div>
            <h1 className="text-2xl font-semibold">修改密码</h1>
            <p className="text-muted-foreground mt-2">请输入当前密码和新密码</p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">当前密码</label>
              <div className="relative mt-1">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="请输入当前密码"
                  required
                  disabled={isLoading}
                  className="w-full p-4 pr-12 rounded-2xl border border-border bg-foreground/5 focus:border-violet-400 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">新密码</label>
              <div className="relative mt-1">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="请输入新密码（至少8位，包含字母和数字）"
                  required
                  minLength={8}
                  disabled={isLoading}
                  className="w-full p-4 pr-12 rounded-2xl border border-border bg-foreground/5 focus:border-violet-400 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
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
              disabled={isLoading || !newPassword || !confirmPassword || !currentPassword}
              className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? '提交中...' : '修改密码'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
