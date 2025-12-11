'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button, Input } from '@/components/ui';
import { getErrorMessage } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 常用邮箱域名白名单
  const allowedEmailDomains = [
    // 国内邮箱
    'qq.com', '163.com', '126.com', 'sina.com', 'sina.cn',
    'sohu.com', 'yeah.net', '139.com', 'wo.cn', '189.cn',
    'aliyun.com', 'foxmail.com',
    // 国际邮箱
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 用户名验证
    if (!formData.username.trim()) {
      newErrors.username = '请输入用户名';
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少 3 位';
    } else if (formData.username.length > 50) {
      newErrors.username = '用户名最多 50 位';
    }

    // 邮箱验证
    if (!formData.email.trim()) {
      newErrors.email = '请输入邮箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确';
    } else if (!isAllowedEmailDomain(formData.email)) {
      newErrors.email = '请使用常用邮箱注册(如 QQ、163、Gmail 等)';
    }

    // 密码验证
    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 8) {
      newErrors.password = '密码至少 8 位';
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = '密码必须包含字母和数字';
    }

    // 确认密码验证
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次密码输入不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      router.push('/spaces');
    } catch (error) {
      setErrors({ submit: getErrorMessage(error) });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">LineTime</h1>
          <p className="text-gray-600">创建您的账号</p>
        </div>

        {/* 注册表单 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 全局错误提示 */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {errors.submit}
              </div>
            )}

            {/* 用户名 */}
            <Input
              label="用户名"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              error={errors.username}
              placeholder="3-50 个字符"
              disabled={isLoading}
            />

            {/* 邮箱 */}
            <Input
              label="邮箱"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              placeholder="请使用常用邮箱 (QQ、163、Gmail等)"
              disabled={isLoading}
            />

            {/* 密码 */}
            <Input
              label="密码"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
              placeholder="至少 8 位，包含字母和数字"
              disabled={isLoading}
            />

            {/* 确认密码 */}
            <Input
              label="确认密码"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              error={errors.confirmPassword}
              placeholder="再次输入密码"
              disabled={isLoading}
            />

            {/* 注册按钮 */}
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              注册
            </Button>
          </form>

          {/* 登录链接 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              已有账号？{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                立即登录
              </Link>
            </p>
          </div>
        </div>

        {/* 返回首页 */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
