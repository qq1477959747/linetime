'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { SignInPage } from '@/components/ui/sign-in';
import { useAuthStore } from '@/stores/useAuthStore';
import { authApi, spaceApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithCode, isLoading, isAuthenticated } = useAuthStore();
  const [error, setError] = useState<string>('');

  // 登录成功后的跳转逻辑
  const handleLoginSuccess = useCallback(async () => {
    const { fetchUser, clearDefaultSpace } = useAuthStore.getState();
    await fetchUser();
    const currentUser = useAuthStore.getState().user;

    if (currentUser?.default_space_id) {
      try {
        await spaceApi.getById(currentUser.default_space_id);
        router.push(`/spaces/${currentUser.default_space_id}`);
      } catch {
        await clearDefaultSpace();
        router.push('/spaces');
      }
    } else {
      router.push('/spaces');
    }
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) {
      handleLoginSuccess();
    }
  }, [isAuthenticated, handleLoginSuccess]);

  // 密码登录
  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const formData = new FormData(event.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const rememberMe = formData.get('rememberMe') === 'on';

    if (!username?.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!password || password.length < 8) {
      setError('密码至少 8 位');
      return;
    }

    try {
      await login({ username, password }, rememberMe);
      await handleLoginSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // 发送登录验证码
  const handleSendCode = async (email: string) => {
    setError('');
    await authApi.sendLoginCode(email);
  };

  // 验证码登录
  const handleCodeLogin = async (email: string, code: string, rememberMe: boolean) => {
    setError('');
    try {
      await loginWithCode(email, code, rememberMe);
      await handleLoginSuccess();
    } catch (err) {
      throw err; // 让组件内部处理错误显示
    }
  };

  const handleResetPassword = () => {
    router.push('/forgot-password');
  };

  const handleCreateAccount = () => {
    router.push('/register');
  };

  return (
    <SignInPage
      title={
        <span className="font-semibold text-foreground tracking-tight">
          欢迎回来
        </span>
      }
      description="登录您的账号，继续记录美好时光"
      heroImageSrc="https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1920&q=80"
      onSignIn={handleSignIn}
      onSendCode={handleSendCode}
      onCodeLogin={handleCodeLogin}
      onResetPassword={handleResetPassword}
      onCreateAccount={handleCreateAccount}
      isLoading={isLoading}
      error={error}
    />
  );
}
