import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // 读取根目录下的 sys.json 文件
    const sysJsonPath = path.join(process.cwd(), 'sys.json');
    const sysJsonContent = fs.readFileSync(sysJsonPath, 'utf8');
    
    // 解析 JSON 内容
    const sysConfig = JSON.parse(sysJsonContent);
    
    // 返回 JSON 响应
    return NextResponse.json(sysConfig);
  } catch (error) {
    console.error('读取 sys.json 失败:', error);
    return NextResponse.json(
      { error: '读取系统配置失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 获取请求体中的配置数据
    const sysConfig = await request.json();
    
    // 写入根目录下的 sys.json 文件
    const sysJsonPath = path.join(process.cwd(), 'sys.json');
    fs.writeFileSync(sysJsonPath, JSON.stringify(sysConfig, null, 2), 'utf8');
    
    // 返回成功响应
    return NextResponse.json({ message: '系统配置保存成功' });
  } catch (error) {
    console.error('保存 sys.json 失败:', error);
    return NextResponse.json(
      { error: '保存系统配置失败' },
      { status: 500 }
    );
  }
}
