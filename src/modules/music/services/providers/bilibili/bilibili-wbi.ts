import crypto from 'crypto';

const MIXIN_KEY_ENC_TAB = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5,
  49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24,
  55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63,
  57, 62, 11, 36, 20, 34, 44, 52,
];

interface WbiKey {
  img_key: string;
  sub_key: string;
}

let cachedWbiKey: WbiKey | null = null;

function getMixinKey(original: string): string {
  let temp = '';
  MIXIN_KEY_ENC_TAB.forEach((n) => {
    temp += original[n];
  });
  return temp.slice(0, 32);
}

async function fetchWbiKey(): Promise<WbiKey> {
  const response = await fetch('https://api.bilibili.com/x/web-interface/nav', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://www.bilibili.com',
    },
  });
  const json = await response.json();
  const imgUrl: string = json.data.wbi_img.img_url;
  const subUrl: string = json.data.wbi_img.sub_url;
  return {
    img_key: imgUrl.slice(imgUrl.lastIndexOf('/') + 1, imgUrl.lastIndexOf('.')),
    sub_key: subUrl.slice(subUrl.lastIndexOf('/') + 1, subUrl.lastIndexOf('.')),
  };
}

function clearWbiKey(): void {
  cachedWbiKey = null;
}

async function getWbiKey(): Promise<WbiKey> {
  if (cachedWbiKey) return cachedWbiKey;
  const key = await fetchWbiKey();
  cachedWbiKey = key;
  return key;
}

export async function encWbi(params: Record<string, string | number>): Promise<string> {
  const { img_key, sub_key } = await getWbiKey();
  const mixinKey = getMixinKey(img_key + sub_key);
  const currTime = Math.round(Date.now() / 1000);
  const chrFilter = /[!'()*]/g;

  const merged = Object.assign({}, params, { wts: currTime });
  const query: string[] = [];

  Object.keys(merged)
    .sort()
    .forEach((key) => {
      query.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(
          String(merged[key]).replace(chrFilter, '')
        )}`
      );
    });

  const queryString = query.join('&');
  const wbiSign = crypto.createHash('md5').update(queryString + mixinKey).digest('hex');

  return `${queryString}&w_rid=${wbiSign}`;
}

export async function wrapWbiRequest(url: string, params: Record<string, string | number>): Promise<any> {
  try {
    const signedQuery = await encWbi(params);
    const targetUrl = `${url}?${signedQuery}`;
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.bilibili.com',
      },
    });
    return response.json();
  } catch {
    clearWbiKey();
    try {
      const signedQuery = await encWbi(params);
      const targetUrl = `${url}?${signedQuery}`;
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.bilibili.com',
        },
      });
      return response.json();
    } catch {
      return undefined;
    }
  }
}
