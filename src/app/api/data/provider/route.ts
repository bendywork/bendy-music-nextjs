import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // 读取 data/provider.json 文件
    const providerJsonPath = path.join(process.cwd(), 'data', 'provider.json');
    const providerJsonContent = fs.readFileSync(providerJsonPath, 'utf8');
    
    // 解析 JSON 内容
    const providerConfig = JSON.parse(providerJsonContent);
    
    // 返回 JSON 响应
    return NextResponse.json(providerConfig);
  } catch (error) {
    console.error('读取 provider.json 失败:', error);
    return NextResponse.json(
      { error: '读取服务商配置失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 获取请求体中的配置数据
    const providerConfig = await request.json();
    
    // 写入 data/provider.json 文件
    const providerJsonPath = path.join(process.cwd(), 'data', 'provider.json');
    fs.writeFileSync(providerJsonPath, JSON.stringify(providerConfig, null, 2), 'utf8');
    
    // 返回成功响应
    return NextResponse.json({ message: '服务商配置保存成功' });
  } catch (error) {
    console.error('保存 provider.json 失败:', error);
    return NextResponse.json(
      { error: '保存服务商配置失败' },
      { status: 500 }
    );
  }
}
