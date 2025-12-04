import { FingerprintData } from './fingerprint';

export interface ValidationResult {
  isValid: boolean;
  score: number;
  reasons: string[];
}

export class FingerprintValidator {
  private readonly BOT_USER_AGENTS = [
    'bot', 'crawl', 'spider', 'scrape', 'curl', 'wget', 'python',
    'java', 'http', 'phantom', 'headless', 'selenium', 'webdriver',
    'puppeteer', 'playwright'
  ];

  private readonly SUSPICIOUS_PLATFORMS = [
    'unknown', 'linux armv', 'linux x86_64'
  ];

  validate(data: FingerprintData): ValidationResult {
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
      this.checkHardware(data),
    ];

    const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
    const maxScore = checks.length * 10;
    const finalScore = Math.round((totalScore / maxScore) * 100);

    const failedChecks = checks.filter(check => check.score < 7);
    const reasons = failedChecks.map(check => check.reason);

    return {
      isValid: finalScore >= 70,
      score: finalScore,
      reasons,
    };
  }

  private checkUserAgent(data: FingerprintData): { score: number; reason: string } {
    const ua = data.userAgent.toLowerCase();

    if (!data.userAgent || data.userAgent.length < 20) {
      return { score: 0, reason: 'User-Agent muito curto ou ausente' };
    }

    for (const botPattern of this.BOT_USER_AGENTS) {
      if (ua.includes(botPattern)) {
        return { score: 2, reason: `User-Agent suspeito: contém "${botPattern}"` };
      }
    }

    if (!ua.includes('mozilla') && !ua.includes('chrome') && !ua.includes('safari')) {
      return { score: 3, reason: 'User-Agent não parece de navegador real' };
    }

    return { score: 10, reason: 'User-Agent válido' };
  }

  private checkCanvas(data: FingerprintData): { score: number; reason: string } {
    if (!data.canvas || data.canvas.length < 100) {
      return { score: 0, reason: 'Canvas fingerprint ausente ou inválido' };
    }

    if (data.canvas.startsWith('data:image/png;base64,iVBORw0KGgo')) {
      return { score: 10, reason: 'Canvas fingerprint válido' };
    }

    return { score: 5, reason: 'Canvas fingerprint suspeito' };
  }

  private checkWebGL(data: FingerprintData): { score: number; reason: string } {
    if (!data.webgl || data.webgl.length < 5) {
      return { score: 4, reason: 'WebGL não disponível (pode ser mobile)' };
    }

    if (data.webgl.includes('~')) {
      return { score: 10, reason: 'WebGL fingerprint válido' };
    }

    return { score: 6, reason: 'WebGL fingerprint incompleto' };
  }

  private checkScreen(data: FingerprintData): { score: number; reason: string } {
    const { screen } = data;

    if (!screen.width || !screen.height) {
      return { score: 0, reason: 'Dados de tela ausentes' };
    }

    if (screen.width < 300 || screen.height < 300) {
      return { score: 2, reason: 'Resolução de tela suspeita' };
    }

    if (screen.colorDepth < 16) {
      return { score: 3, reason: 'Profundidade de cor suspeita' };
    }

    const commonResolutions = [
      { w: 1920, h: 1080 }, { w: 1366, h: 768 }, { w: 1536, h: 864 },
      { w: 1440, h: 900 }, { w: 1280, h: 720 }, { w: 2560, h: 1440 },
      { w: 375, h: 667 }, { w: 414, h: 896 }, { w: 390, h: 844 }
    ];

    const isCommon = commonResolutions.some(
      res => Math.abs(res.w - screen.width) < 50 && Math.abs(res.h - screen.height) < 50
    );

    return {
      score: isCommon ? 10 : 7,
      reason: isCommon ? 'Resolução comum' : 'Resolução menos comum mas válida'
    };
  }

  private checkTimezone(data: FingerprintData): { score: number; reason: string } {
    if (!data.timezone) {
      return { score: 0, reason: 'Timezone ausente' };
    }

    const validTimezonePattern = /^[A-Za-z]+\/[A-Za-z_]+$/;
    if (!validTimezonePattern.test(data.timezone)) {
      return { score: 3, reason: 'Timezone em formato inválido' };
    }

    if (typeof data.timezoneOffset !== 'number') {
      return { score: 5, reason: 'Offset de timezone ausente' };
    }

    return { score: 10, reason: 'Timezone válido' };
  }

  private checkLanguage(data: FingerprintData): { score: number; reason: string } {
    if (!data.language) {
      return { score: 0, reason: 'Idioma ausente' };
    }

    if (!data.languages || data.languages.length === 0) {
      return { score: 5, reason: 'Lista de idiomas ausente' };
    }

    if (data.languages.length > 0 && data.languages[0] !== data.language) {
      return { score: 6, reason: 'Inconsistência nos idiomas' };
    }

    return { score: 10, reason: 'Idiomas válidos' };
  }

  private checkPluginsAndFonts(data: FingerprintData): { score: number; reason: string } {
    if (!data.fonts || data.fonts.length === 0) {
      return { score: 3, reason: 'Nenhuma fonte detectada' };
    }

    if (data.fonts.length < 3) {
      return { score: 5, reason: 'Poucas fontes detectadas' };
    }

    return { score: 10, reason: 'Fontes detectadas normalmente' };
  }

  private checkMouseMovement(data: FingerprintData): { score: number; reason: string } {
    if (!data.mouseMovement) {
      return { score: 5, reason: 'Nenhum movimento de mouse detectado (pode ser mobile)' };
    }

    return { score: 10, reason: 'Movimento de mouse detectado' };
  }

  private checkTimeOnPage(data: FingerprintData): { score: number; reason: string } {
    if (data.timeOnPage < 2) {
      return { score: 2, reason: 'Tempo na página muito curto' };
    }

    if (data.timeOnPage > 30) {
      return { score: 7, reason: 'Tempo na página muito longo' };
    }

    return { score: 10, reason: 'Tempo na página adequado' };
  }

  private checkHardware(data: FingerprintData): { score: number; reason: string } {
    if (!data.hardwareConcurrency || data.hardwareConcurrency === 0) {
      return { score: 4, reason: 'Hardware concurrency não disponível' };
    }

    if (data.hardwareConcurrency > 16) {
      return { score: 6, reason: 'Muitos cores de CPU (suspeito)' };
    }

    return { score: 10, reason: 'Hardware normal' };
  }
}
