import Link from 'next/link';
import { Button } from '@/components/ui';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
          {/* Logo 和标题 */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">
              LineTime
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl">
              记录生活每一刻，与亲友共享美好时光
            </p>
          </div>

          {/* 功能介绍 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 w-full max-w-5xl">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="text-lg font-semibold mb-2">图片分享</h3>
              <p className="text-gray-600 text-sm">
                上传照片，记录生活点滴，与家人朋友共享美好瞬间
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-lg font-semibold mb-2">时间轴</h3>
              <p className="text-gray-600 text-sm">
                按时间线组织事件，清晰查看每个重要时刻
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-semibold mb-2">共享空间</h3>
              <p className="text-gray-600 text-sm">
                创建私密空间，邀请亲友加入，共同记录美好回忆
              </p>
            </div>
          </div>

          {/* CTA 按钮 */}
          <div className="flex gap-4">
            <Link href="/login">
              <Button size="lg">立即登录</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg">注册账号</Button>
            </Link>
          </div>

          {/* 底部信息 */}
          <div className="mt-16 text-center text-gray-500 text-sm">
            <p>一个简洁、私密的家庭相册应用</p>
          </div>
        </div>
      </div>
    </div>
  );
}
