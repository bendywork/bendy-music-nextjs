import iconv from 'iconv-lite';

const SUSPICIOUS_CHAR_PATTERN = /[鍔鍙鍚鍛鍜鍝鍥鍦鍧鍩鍫鍬鎺鎴鎵鏁鏂鏃鏉鏍鏄浠姝缁缂缃绠绯闂闃闆闇闊闈閰閿鐧璇璁璋淇櫥鐜鏈欏鈹鉁宀楝]/;
const REPLACEMENT_CHAR_PATTERN = /�/;
const DIRECT_REPLACEMENTS: Record<string, string> = {
  'LinuxDO 鍏泭API': 'LinuxDO 公益API',
  '宀戦楝?': '岑鬼',
  '宀戦楝奸煶涔怉PI': '岑鬼音乐API',
};

const suspiciousCount = (value: string): number => {
  return [...value].reduce((count, char) => {
    return count + (SUSPICIOUS_CHAR_PATTERN.test(char) ? 1 : 0);
  }, 0);
};

const repairLine = (line: string): string => {
  if (!SUSPICIOUS_CHAR_PATTERN.test(line)) {
    return line;
  }

  const candidate = iconv.decode(iconv.encode(line, 'gbk'), 'utf8');
  if (candidate === line || REPLACEMENT_CHAR_PATTERN.test(candidate)) {
    return line;
  }

  return suspiciousCount(candidate) < suspiciousCount(line)
    ? candidate
    : line;
};

export const repairMojibakeText = (value: string): string => {
  let normalized = value;
  for (const [source, target] of Object.entries(DIRECT_REPLACEMENTS)) {
    normalized = normalized.replaceAll(source, target);
  }

  if (!SUSPICIOUS_CHAR_PATTERN.test(normalized)) {
    return normalized;
  }

  return normalized
    .split(/\r?\n/)
    .map(repairLine)
    .join('\n');
};

export const repairMojibakeValue = <T>(value: T): T => {
  if (typeof value === 'string') {
    return repairMojibakeText(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => repairMojibakeValue(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, repairMojibakeValue(entryValue)]),
    ) as T;
  }

  return value;
};
