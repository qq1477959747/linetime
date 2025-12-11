'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import { SignInPage } from '@/components/ui/sign-in';
import { useAuthStore } from '@/stores/useAuthStore';
import { spaceApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export default function LoginPage() {
  const router = useRouter();
  const { login, googleLogin, isLoading, isAuthenticated } = useAuthStore();
  const [error, setError] = useState<string>('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const googleInitialized = useRef(false);

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

  // Google 登录回调
  const handleGoogleCredentialResponse = useCallback(async (response: google.accounts.id.CredentialResponse) => {
    setError('');
    setIsGoogleLoading(true);

    try {
      await googleLogin(response.credential);
      await handleLoginSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsGoogleLoading(false);
    }
  }, [googleLogin, handleLoginSuccess]);

  // 初始化 Google Sign-In
  useEffect(() => {
    if (isAuthenticated) {
      handleLoginSuccess();
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      console.warn('Google Client ID not configured');
      return;
    }

    if (googleInitialized.current) {
      return;
    }

    const initializeGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        googleInitialized.current = true;
      }
    };

    // 如果 Google 脚本已加载，直接初始化
    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      // 等待脚本加载
      const checkGoogle = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkGoogle);
          initializeGoogle();
        }
      }, 100);

      // 5秒后停止检查
      setTimeout(() => clearInterval(checkGoogle), 5000);
    }
  }, [isAuthenticated, handleGoogleCredentialResponse, handleLoginSuccess]);

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

  const handleGoogleSignIn = () => {
    setError('');

    if (!GOOGLE_CLIENT_ID) {
      setError('Google 登录未配置，请联系管理员');
      return;
    }

    if (!window.google?.accounts?.id) {
      setError('Google 登录服务加载中，请稍后重试');
      return;
    }

    // 使用 Google One Tap
    window.google.accounts.id.prompt();
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
      onGoogleSignIn={handleGoogleSignIn}
      onResetPassword={handleResetPassword}
      onCreateAccount={handleCreateAccount}
      isLoading={isLoading || isGoogleLoading}
      error={error}
    />
  );
}
