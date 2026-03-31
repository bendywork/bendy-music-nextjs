import { readJsonFile } from '@/lib/server/data-store';

export interface BuildMetadata {
  latestCommitTimestamp: number;
  latestCommitMessage: string;
  latestCommitShortHash: string;
  generatedAt: number;
}

const DEFAULT_BUILD_METADATA: BuildMetadata = {
  latestCommitTimestamp: 0,
  latestCommitMessage: '',
  latestCommitShortHash: '',
  generatedAt: 0,
};

export const readBuildMetadata = async (): Promise<BuildMetadata> => {
  const metadata = await readJsonFile<Partial<BuildMetadata>>('data/build-metadata.json', DEFAULT_BUILD_METADATA);

  return {
    latestCommitTimestamp: Number.isFinite(metadata.latestCommitTimestamp)
      ? Number(metadata.latestCommitTimestamp)
      : DEFAULT_BUILD_METADATA.latestCommitTimestamp,
    latestCommitMessage: typeof metadata.latestCommitMessage === 'string'
      ? metadata.latestCommitMessage
      : DEFAULT_BUILD_METADATA.latestCommitMessage,
    latestCommitShortHash: typeof metadata.latestCommitShortHash === 'string'
      ? metadata.latestCommitShortHash
      : DEFAULT_BUILD_METADATA.latestCommitShortHash,
    generatedAt: Number.isFinite(metadata.generatedAt)
      ? Number(metadata.generatedAt)
      : DEFAULT_BUILD_METADATA.generatedAt,
  };
};
