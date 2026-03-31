import { NextRequest, NextResponse } from 'next/server';
import { getRepositoryOverrideFromEnv, toGitHubRepositoryUrl } from '@/lib/server/global-config';
import { STORE_KEYS, getStoredValue, readJsonFile, setStoredValue, writeTextFile } from '@/lib/server/data-store';

type SystemConfig = {
  apiManagement: {
    apis: unknown[];
  };
  providerManagement: {
    providers: unknown[];
  };
  configuration: {
    githubProjectPath: string;
    apiTimeout: number;
    maxConcurrentRequests: number;
  };
};

const DEFAULT_SYS_CONFIG: SystemConfig = {
  apiManagement: {
    apis: [],
  },
  providerManagement: {
    providers: [],
  },
  configuration: {
    githubProjectPath: 'https://github.com/bendywork/bendy-music-nextjs',
    apiTimeout: 300000,
    maxConcurrentRequests: 100,
  },
};

const normalizeSystemConfig = (value: Partial<SystemConfig>): SystemConfig => {
  const envRepositoryOverride = getRepositoryOverrideFromEnv();
  const repositoryUrl = envRepositoryOverride
    ? toGitHubRepositoryUrl(envRepositoryOverride)
    : toGitHubRepositoryUrl(value.configuration?.githubProjectPath);

  return {
    ...DEFAULT_SYS_CONFIG,
    ...value,
    apiManagement: value.apiManagement ?? DEFAULT_SYS_CONFIG.apiManagement,
    providerManagement: value.providerManagement ?? DEFAULT_SYS_CONFIG.providerManagement,
    configuration: {
      ...DEFAULT_SYS_CONFIG.configuration,
      ...(value.configuration ?? {}),
      githubProjectPath: repositoryUrl,
    },
  };
};

export async function GET() {
  try {
    const sysConfig = await getStoredValue<SystemConfig>(
      STORE_KEYS.SYS_CONFIG,
      () => readJsonFile('sys.json', DEFAULT_SYS_CONFIG),
    );

    return NextResponse.json(normalizeSystemConfig(sysConfig));
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
    const sysConfig = normalizeSystemConfig((await request.json()) as Partial<SystemConfig>);
    const stored = await setStoredValue(STORE_KEYS.SYS_CONFIG, sysConfig);
    await writeTextFile('sys.json', `${JSON.stringify(stored, null, 2)}\n`);

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
