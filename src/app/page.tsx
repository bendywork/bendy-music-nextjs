'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const handleViewDocs = () => {
    router.push('/docs');
  };

  const handleEnterBackend = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex flex-col items-center justify-center px-4">
      {/* 像素风格容器 */}
      <div className="w-full max-w-4xl bg-white border-4 border-gray-800 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] p-8 md:p-12">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-red-700 mb-4 tracking-tight flex items-center justify-center gap-4">
            <img src="/logo.svg" alt="ddmusic logo" className="h-12 w-12 md:h-16 md:w-16 object-contain" />
            ddmusic-nextjs
          </h1>
          <p className="text-lg md:text-xl text-gray-600">
            基于 Next.js 的音乐聚合 API 代理服务
          </p>
        </div>

        {/* 像素风格装饰 */}
        <div className="flex justify-center mb-12">
          <div className="grid grid-cols-12 gap-1">
            {Array.from({ length: 144 }).map((_, index) => {
              const colors = ['bg-red-600', 'bg-red-500', 'bg-red-400', 'bg-gray-100', 'bg-gray-200'];
              const randomColor = colors[Math.floor(Math.random() * colors.length)];
              return (
                <div 
                  key={index} 
                  className={`w-2 h-2 md:w-3 md:h-3 ${randomColor} rounded-sm`}
                ></div>
              );
            })}
          </div>
        </div>

        {/* 按钮区域 */}
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button
            onClick={handleViewDocs}
            className="px-8 py-3 bg-red-600 text-white font-bold rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] hover:bg-red-700 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] transition-all transform hover:-translate-x-1 hover:-translate-y-1"
          >
            📚 查看文档
          </button>
          <button
            onClick={handleEnterBackend}
            className="px-8 py-3 bg-gray-800 text-white font-bold rounded-md shadow-[4px_4px_0px_0px_rgba(220,38,38,0.8)] hover:bg-gray-700 hover:shadow-[2px_2px_0px_0px_rgba(220,38,38,0.8)] transition-all transform hover:-translate-x-1 hover:-translate-y-1"
          >
            🔧 进入后台
          </button>
        </div>

        {/* 底部信息 */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>© 2024 ddmusic-nextjs | 顶点音乐团队版权所有</p>
            <p>尊重开源项目，请勿使用本项目从事商业用途</p>
        </div>
      </div>
    </div>
  );
}