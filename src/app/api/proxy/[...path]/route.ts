import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleProxyRequest(request, path);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleProxyRequest(request, path);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleProxyRequest(request, path);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleProxyRequest(request, path);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleProxyRequest(request, path);
}

async function handleProxyRequest(request: NextRequest, path: string[]) {
  try {
    // 这里可以根据path或请求头来决定转发到哪个服务商
    // 暂时硬编码一个示例，实际应该从数据库或配置中读取
    const serviceProvider = 'A'; // 可以是 'A' 或 'B'
    
    // 根据服务商选择不同的API地址
    let targetUrl: string;
    if (serviceProvider === 'A') {
      targetUrl = `https://api.service-a.com/${path.join('/')}`;
    } else {
      targetUrl = `https://api.service-b.com/${path.join('/')}`;
    }
    
    // 复制请求头，移除Next.js特定的头
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('x-forwarded-host');
    headers.delete('x-forwarded-proto');
    
    // 获取请求体
    const body = request.method !== 'GET' ? await request.text() : undefined;
    
    // 发送请求到目标API
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });
    
    // 复制响应头
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('x-proxy-service', serviceProvider);
    responseHeaders.set('x-proxy-time', new Date().toISOString());
    
    // 返回响应
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Proxy Error:', error);
    return new NextResponse(JSON.stringify({ error: 'Proxy server error', details: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}