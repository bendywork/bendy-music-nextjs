import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// 服务器端组件，在服务器端读取并渲染文档内容
export default function DocsPage() {
  let docContent = '';
  let error = '';

  try {
    // 读取项目根目录下的 doc/doc.html 文件
    const docHtmlPath = join(process.cwd(), 'doc', 'doc.html');
    
    if (existsSync(docHtmlPath)) {
      docContent = readFileSync(docHtmlPath, 'utf8');
    } else {
      error = '文档文件不存在';
    }
  } catch (err) {
    console.error('加载文档失败:', err);
    error = '加载文档失败，请稍后再试';
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">错误</h1>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  // 直接返回原始 HTML 内容
  return (
    <div dangerouslySetInnerHTML={{ __html: docContent }} />
  );
}