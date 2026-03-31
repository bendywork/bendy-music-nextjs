import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_SYSTEM_CONFIG_PAYLOAD, normalizeSystemConfigPayload, type SystemConfigPayload } from '@/lib/admin-config';
import { getRepositoryOverrideFromEnv, toGitHubRepositoryUrl } from '@/lib/server/global-config';
import { writeTextFile } from '@/lib/server/data-store';
import { loadSystemConfig, saveSystemConfig } from '@/lib/server/admin-config-store';

const normalizeSystemConfig = (value: Partial<SystemConfigPayload>): SystemConfigPayload => {
  const normalizedValue = normalizeSystemConfigPayload(value);
  const envRepositoryOverride = getRepositoryOverrideFromEnv();
  const repositoryUrl = envRepositoryOverride
    ? toGitHubRepositoryUrl(envRepositoryOverride)
    : toGitHubRepositoryUrl(value.configuration?.githubProjectPath);

  return {
    ...normalizedValue,
    configuration: {
      ...DEFAULT_SYSTEM_CONFIG_PAYLOAD.configuration,
      ...normalizedValue.configuration,
      githubProjectPath: repositoryUrl,
    },
  };
};

const writeSysFileSafely = async (content: string): Promise<void> => {
  try {
    await writeTextFile('sys.json', content);
  } catch (error) {
    console.warn('Failed to write sys.json; keeping database value only:', error);
  }
};

export async function GET() {
  try {
    return NextResponse.json(normalizeSystemConfig(await loadSystemConfig()));
  } catch (error) {
    console.error('Failed to read system config:', error);
    return NextResponse.json(
      { error: 'Failed to read system config' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sysConfig = normalizeSystemConfig((await request.json()) as Partial<SystemConfigPayload>);
    const stored = await saveSystemConfig(sysConfig);
    await writeSysFileSafely(`${JSON.stringify(stored, null, 2)}\n`);

    return NextResponse.json({
      message: 'System config saved',
      data: stored,
    });
  } catch (error) {
    console.error('Failed to save system config:', error);
    return NextResponse.json(
      { error: 'Failed to save system config' },
      { status: 500 },
    );
  }
}
