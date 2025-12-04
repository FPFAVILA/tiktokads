import type { NextApiRequest, NextApiResponse } from 'next';
import { FingerprintValidator } from '../../lib/validator';
import { FingerprintData, generateFingerprintHash } from '../../lib/fingerprint';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_COOKIE_NAME = '_verify_token';

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface ValidationResponse {
  success: boolean;
  score?: number;
  message: string;
  reasons?: string[];
}

function getRateLimitKey(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0])
    : req.socket.remoteAddress || 'unknown';
  return ip;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const limit = rateLimitStore.get(key);

  if (!limit || now > limit.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + 60 * 60 * 1000,
    });
    return { allowed: true, remaining: 2 };
  }

  if (limit.count >= 3) {
    return { allowed: false, remaining: 0 };
  }

  limit.count++;
  return { allowed: true, remaining: 3 - limit.count };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ValidationResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  const rateLimitKey = getRateLimitKey(req);
  const { allowed, remaining } = checkRateLimit(rateLimitKey);

  if (!allowed) {
    return res.status(429).json({
      success: false,
      message: 'Too many attempts. Try again later.',
    });
  }

  try {
    const fingerprintData: FingerprintData = req.body;

    if (!fingerprintData || !fingerprintData.userAgent) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fingerprint data',
      });
    }

    const validator = new FingerprintValidator();
    const result = validator.validate(fingerprintData);

    console.log(`[VALIDATION] IP: ${rateLimitKey}, Score: ${result.score}, Valid: ${result.isValid}`);

    if (!result.isValid) {
      return res.status(403).json({
        success: false,
        score: result.score,
        message: 'Verification failed',
        reasons: result.reasons,
      });
    }

    const fingerprintHash = generateFingerprintHash(fingerprintData);
    const now = Math.floor(Date.now() / 1000);

    const token = jwt.sign(
      {
        fp: fingerprintHash,
        iat: now,
        exp: now + 86400,
      },
      JWT_SECRET,
      { algorithm: 'HS256' }
    );

    res.setHeader(
      'Set-Cookie',
      `${TOKEN_COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
    );

    return res.status(200).json({
      success: true,
      score: result.score,
      message: 'Verification successful',
    });
  } catch (error) {
    console.error('[VALIDATION ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
