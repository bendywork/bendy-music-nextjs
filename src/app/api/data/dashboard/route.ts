import { NextRequest, NextResponse } from 'next/server';
import { dashboardService } from '@/lib/dashboard';
import path from 'path';
import { writeFileSync } from 'fs';

export async function GET(request: NextRequest) {
  try {
    // 返回内存中的实时数据
    const dashboardData = dashboardService.getData();
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('获取仪表盘数据失败:', error);
    return NextResponse.json(
      { error: '获取仪表盘数据失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const dashboardData = await request.json();
    const dashboardJsonPath = path.join(process.cwd(), 'data', 'dashboard.json');
    writeFileSync(dashboardJsonPath, JSON.stringify(dashboardData, null, 2), 'utf8');
    return NextResponse.json({ message: '仪表盘数据保存成功' });
  } catch (error) {
    console.error('保存 dashboard.json 失败:', error);
    return NextResponse.json(
      { error: '保存仪表盘数据失败' },
      { status: 500 }
    );
  }
}
