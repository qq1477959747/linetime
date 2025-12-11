'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import { SignUpPage } from '@/components/ui/sign-up';
import { useAuthStore } from '@/stores/useAuthStore';
import { spaceApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export default function RegisterPage() {
  const router = useRouter();
  const { register, googleLogin, isLoading, isAuthenticated } = useAuthStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const googleInitialized = useRef(false);

  // 常用邮箱域名白名单
  const allowedEmailDomains = [
    'qq.com', '163.com', '126.com', 'sina.com', 'sina.cn',
    'sohu.com', 'yeah.net', '139.com', 'wo.cn', '189.cn',
    'aliyun.com', 'foxmail.com',
    'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com',
    'icloud.com', 'live.com', 'msn.com', 'aol.com',
    'protonmail.com', 'zoho.com'
  ];

  const isAllowedEmailDomain = (email: string): boolean => {
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    const domain = parts[1].toLowerCase();
    return allowedEmailDomains.includes(domain);
  };

  // 登录/注册成功后的跳转逻辑
  const handleAuthSuccess = useCallback(async () => {
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
    setErrors({});
    setIsGoogleLoading(true);

    try {
      await googleLogin(response.credential);
      await handleAuthSuccess();
    } catch (err) {
      setErrors({ submit: getErrorMessage(err) });
    } finally {
      setIsGoogleLoading(false);
    }
  }, [googleLogin, handleAuthSuccess]);

  // 初始化 Google Sign-In
  useEffect(() => {
    if (isAuthenticated) {
      handleAuthSuccess();
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
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

    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      const checkGoogle = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkGoogle);
          initializeGoogle();
        }
      }, 100);

      setTimeout(() => clearInterval(checkGoogle), 5000);
    }
  }, [isAuthenticated, handleGoogleCredentialResponse, handleAuthSuccess]);

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    const newErrors: Record<string, string> = {};

    // 验证用户名
    if (!username?.trim()) {
      newErrors.username = '请输入用户名';
    } else if (username.length < 3) {
      newErrors.username = '用户名至少 3 位';
    } else if (username.length > 50) {
      newErrors.username = '用户名最多 50 位';
    }

    // 验证邮箱
    if (!email?.trim()) {
      newErrors.email = '请输入邮箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '邮箱格式不正确';
    } else if (!isAllowedEmailDomain(email)) {
      newErrors.email = '请使用常用邮箱注册';
    }

    // 验证密码
    if (!password) {
      newErrors.password = '请输入密码';
    } else if (password.length < 8) {
      newErrors.password = '密码至少 8 位';
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      newErrors.password = '密码必须包含字母和数字';
    }

    // 验证确认密码
    if (!confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = '两次密码输入不一致';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await register({ username, email, password });
      router.push('/spaces');
    } catch (err) {
      setErrors({ submit: getErrorMessage(err) });
    }
  };

  const handleGoogleSignUp = () => {
    setErrors({});

    if (!GOOGLE_CLIENT_ID) {
      setErrors({ submit: 'Google 登录未配置，请联系管理员' });
      return;
    }

    if (!window.google?.accounts?.id) {
      setErrors({ submit: 'Google 登录服务加载中，请稍后重试' });
      return;
    }

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        const reason = notification.getNotDisplayedReason();
        if (reason === 'opt_out_or_no_session') {
          setErrors({ submit: '请先登录您的 Google 账号，或允许弹出窗口' });
        } else if (reason === 'suppressed_by_user') {
          setErrors({ submit: 'Google 登录已被禁用，请在浏览器设置中启用' });
        } else {
          setErrors({ submit: '无法显示 Google 登录，请检查浏览器设置或稍后重试' });
        }
      }
    });
  };

  const handleSignIn = () => {
    router.push('/login');
  };

  return (
    <SignUpPage
      title={
        <span className="font-semibold text-foreground tracking-tight">
          创建账号
        </span>
      }
      description="加入 LineTime，与亲朋好友一起记录美好时光"
      heroImageSrc="https://images.unsplash.com/photo-1462275646964-a0e3571f4f7f?w=1920&q=80"
      onSignUp={handleSignUp}
      onGoogleSignUp={handleGoogleSignUp}
      onSignIn={handleSignIn}
      isLoading={isLoading || isGoogleLoading}
      errors={errors}
    />
  );
}
