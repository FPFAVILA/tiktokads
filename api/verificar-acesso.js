// API de Verificação de Acesso
// Valida fingerprint e gera token JWT

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production-min-32-chars';
const TOKEN_COOKIE_NAME = '_site_access_token';

// Rate limiting in-memory
const rateLimitStore = new Map();

// Validador de fingerprint
class FingerprintValidator {
  constructor() {
    this.BOT_USER_AGENTS = [
      'bot', 'crawl', 'spider', 'scrape', 'curl', 'wget', 'python',
      'java', 'http', 'phantom', 'headless', 'selenium', 'webdriver',
      'puppeteer', 'playwright'
    ];
  }

  validate(data) {
    const checks = [
      this.checkUserAgent(data),
      this.checkCanvas(data),
      this.checkWebGL(data),
      this.checkScreen(data),
      this.checkTimezone(data),
      this.checkLanguage(data),
      this.checkPluginsAndFonts(data),
      this.checkMouseMovement(data),
      this.checkTimeOnPage(data),
      this.checkHardware(data)
    ];

    const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
    const maxScore = checks.length * 10;
    const finalScore = Math.round((totalScore / maxScore) * 100);

    const failedChecks = checks.filter(check => check.score < 7);
    const reasons = failedChecks.map(check => check.reason);

    return {
      isValid: finalScore >= 70,
      score: finalScore,
      reasons
    };
  }

  checkUserAgent(data) {
    const ua = (data.userAgent || '').toLowerCase();

    if (!data.userAgent || data.userAgent.length < 20) {
      return { score: 0, reason: 'User-Agent ausente ou curto' };
    }

    for (const botPattern of this.BOT_USER_AGENTS) {
      if (ua.includes(botPattern)) {
        return { score: 2, reason: 'User-Agent suspeito: ' + botPattern };
      }
    }

    if (!ua.includes('mozilla') && !ua.includes('chrome') && !ua.includes('safari')) {
      return { score: 3, reason: 'User-Agent não parece navegador real' };
    }

    return { score: 10, reason: 'User-Agent válido' };
  }

  checkCanvas(data) {
    if (!data.canvas || data.canvas.length < 100) {
      return { score: 0, reason: 'Canvas fingerprint ausente' };
    }

    if (data.canvas.startsWith('data:image/png;base64,iVBORw0KGgo')) {
      return { score: 10, reason: 'Canvas válido' };
    }

    return { score: 5, reason: 'Canvas suspeito' };
  }

  checkWebGL(data) {
    if (!data.webgl || data.webgl.length < 5) {
      return { score: 4, reason: 'WebGL não disponível (mobile ok)' };
    }

    if (data.webgl.includes('~')) {
      return { score: 10, reason: 'WebGL válido' };
    }

    return { score: 6, reason: 'WebGL incompleto' };
  }

  checkScreen(data) {
    const screen = data.screen || {};

    if (!screen.width || !screen.height) {
      return { score: 0, reason: 'Dados de tela ausentes' };
    }

    if (screen.width < 300 || screen.height < 300) {
      return { score: 2, reason: 'Resolução suspeita' };
    }

    return { score: 10, reason: 'Resolução válida' };
  }

  checkTimezone(data) {
    if (!data.timezone) {
      return { score: 0, reason: 'Timezone ausente' };
    }

    const validPattern = /^[A-Za-z]+\/[A-Za-z_]+$/;
    if (!validPattern.test(data.timezone)) {
      return { score: 3, reason: 'Timezone inválido' };
    }

    return { score: 10, reason: 'Timezone válido' };
  }

  checkLanguage(data) {
    if (!data.language) {
      return { score: 0, reason: 'Idioma ausente' };
    }

    if (!data.languages || data.languages.length === 0) {
      return { score: 5, reason: 'Lista de idiomas ausente' };
    }

    return { score: 10, reason: 'Idiomas válidos' };
  }

  checkPluginsAndFonts(data) {
    if (!data.fonts || data.fonts.length === 0) {
      return { score: 3, reason: 'Nenhuma fonte detectada' };
    }

    if (data.fonts.length < 3) {
      return { score: 5, reason: 'Poucas fontes' };
    }

    return { score: 10, reason: 'Fontes detectadas' };
  }

  checkMouseMovement(data) {
    if (!data.mouseMovement) {
      return { score: 5, reason: 'Sem movimento de mouse (mobile ok)' };
    }

    return { score: 10, reason: 'Movimento detectado' };
  }

  checkTimeOnPage(data) {
    if (data.timeOnPage < 2) {
      return { score: 2, reason: 'Tempo muito curto' };
    }

    if (data.timeOnPage > 30) {
      return { score: 7, reason: 'Tempo muito longo' };
    }

    return { score: 10, reason: 'Tempo adequado' };
  }

  checkHardware(data) {
    if (!data.hardwareConcurrency || data.hardwareConcurrency === 0) {
      return { score: 4, reason: 'Hardware info ausente' };
    }

    return { score: 10, reason: 'Hardware normal' };
  }
}

// Rate limiting
function getRateLimitKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0]) : req.socket?.remoteAddress || 'unknown';
  return ip;
}

function checkRateLimit(key) {
  const now = Date.now();
  const limit = rateLimitStore.get(key);

  if (!limit || now > limit.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + 60 * 60 * 1000 // 1 hora
    });
    return { allowed: true, remaining: 2 };
  }

  if (limit.count >= 3) {
    return { allowed: false, remaining: 0 };
  }

  limit.count++;
  return { allowed: true, remaining: 3 - limit.count };
}

// Gerar JWT simples (sem library)
function generateJWT(payload, secret) {
  function base64UrlEncode(str) {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  const header = { alg: 'HS256', typ: 'JWT' };
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));

  const crypto = require('crypto');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(headerEncoded + '.' + payloadEncoded)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return headerEncoded + '.' + payloadEncoded + '.' + signature;
}

// Hash simples para fingerprint
function generateFingerprintHash(data) {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  // Rate limiting
  const rateLimitKey = getRateLimitKey(req);
  const { allowed, remaining } = checkRateLimit(rateLimitKey);

  if (!allowed) {
    return res.status(429).json({
      success: false,
      message: 'Muitas tentativas. Tente novamente mais tarde.'
    });
  }

  try {
    const fingerprintData = req.body;

    if (!fingerprintData || !fingerprintData.userAgent) {
      return res.status(400).json({
        success: false,
        message: 'Dados de fingerprint inválidos'
      });
    }

    // Validar fingerprint
    const validator = new FingerprintValidator();
    const result = validator.validate(fingerprintData);

    console.log(`[VALIDATION] IP: ${rateLimitKey}, Score: ${result.score}, Valid: ${result.isValid}`);

    if (!result.isValid) {
      return res.status(403).json({
        success: false,
        score: result.score,
        message: 'Verificação falhou',
        reasons: result.reasons
      });
    }

    // Gerar token
    const fingerprintHash = generateFingerprintHash(fingerprintData);
    const now = Math.floor(Date.now() / 1000);

    const token = generateJWT({
      fp: fingerprintHash,
      iat: now,
      exp: now + 86400 // 24 horas
    }, JWT_SECRET);

    // Configurar cookie
    res.setHeader(
      'Set-Cookie',
      `${TOKEN_COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
    );

    return res.status(200).json({
      success: true,
      score: result.score,
      message: 'Verificação bem-sucedida'
    });
  } catch (error) {
    console.error('[VALIDATION ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}
