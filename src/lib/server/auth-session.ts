import crypto from 'node:crypto';

export const ADMIN_SESSION_COOKIE_NAME = 'ddmusic_admin_session';
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export interface AdminSessionPayload {
  login: string;
  name: string;
  avatarUrl: string;
  accessToken: string;
  issuedAt: number;
  expiresAt: number;
}

const getSessionSecret = (): string => {
  return (
    process.env.AUTH_SESSION_SECRET ||
    process.env.GITHUB_CLIENT_SECRET ||
    'local-dev-session-secret'
  );
};

const sign = (payloadBase64: string): string => {
  return crypto.createHmac('sha256', getSessionSecret()).update(payloadBase64).digest('base64url');
};

export const createAdminSessionToken = (payload: AdminSessionPayload): string => {
  const payloadBase64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = sign(payloadBase64);
  return `${payloadBase64}.${signature}`;
};

export const verifyAdminSessionToken = (token?: string | null): AdminSessionPayload | null => {
  if (!token) {
    return null;
  }

  const [payloadBase64, signature] = token.split('.');
  if (!payloadBase64 || !signature) {
    return null;
  }

  const expectedSignature = sign(payloadBase64);
  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8')) as AdminSessionPayload;
    if (payload.expiresAt <= Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};
