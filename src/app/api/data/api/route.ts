import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // 读取 data/api.json 文件
    const apiJsonPath = path.join(process.cwd(), 'data', 'api.json');
    const apiJsonContent = fs.readFileSync(apiJsonPath, 'utf8');
    
    // 解析 JSON 内容
    const apiConfig = JSON.parse(apiJsonContent);
    
    // 返回 JSON 响应
    return NextResponse.json(apiConfig);
  } catch (error) {
    console.error('读取 api.json 失败:', error);
    return NextResponse.json(
      { error: '读取接口配置失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 获取请求体中的配置数据
    const apiConfig = await request.json();
    
    // 写入 data/api.json 文件
    const apiJsonPath = path.join(process.cwd(), 'data', 'api.json');
    fs.writeFileSync(apiJsonPath, JSON.stringify(apiConfig, null, 2), 'utf8');
    
    // 返回成功响应
    return NextResponse.json({ message: '接口配置保存成功' });
  } catch (error) {
    console.error('保存 api.json 失败:', error);
    return NextResponse.json(
      { error: '保存接口配置失败' },
      { status: 500 }
    );
  }
}
