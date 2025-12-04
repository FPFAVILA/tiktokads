export interface FingerprintData {
  userAgent: string;
  language: string;
  languages: string[];
  timezone: string;
  timezoneOffset: number;
  screen: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    colorDepth: number;
    pixelDepth: number;
  };
  canvas: string;
  webgl: string;
  plugins: string[];
  fonts: string[];
  touchSupport: boolean;
  hardwareConcurrency: number;
  deviceMemory: number;
  platform: string;
  doNotTrack: string | null;
  mouseMovement: boolean;
  timeOnPage: number;
}

export class BrowserFingerprint {
  private startTime: number;
  private mouseMovementDetected: boolean = false;

  constructor() {
    this.startTime = Date.now();
    this.initMouseTracking();
  }

  private initMouseTracking() {
    if (typeof window !== 'undefined') {
      const handler = () => {
        this.mouseMovementDetected = true;
        window.removeEventListener('mousemove', handler);
      };
      window.addEventListener('mousemove', handler);
    }
  }

  async collect(): Promise<FingerprintData> {
    const timeOnPage = Math.floor((Date.now() - this.startTime) / 1000);

    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages ? Array.from(navigator.languages) : [],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      screen: {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
      },
      canvas: await this.getCanvasFingerprint(),
      webgl: this.getWebGLFingerprint(),
      plugins: this.getPlugins(),
      fonts: await this.getFonts(),
      touchSupport: this.getTouchSupport(),
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: (navigator as any).deviceMemory || 0,
      platform: navigator.platform,
      doNotTrack: navigator.doNotTrack,
      mouseMovement: this.mouseMovementDetected,
      timeOnPage,
    };
  }

  private async getCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      canvas.width = 200;
      canvas.height = 50;

      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Browser Check 🔒', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Security Verification', 4, 17);

      return canvas.toDataURL();
    } catch {
      return '';
    }
  }

  private getWebGLFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return '';

      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return '';

      const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

      return `${vendor}~${renderer}`;
    } catch {
      return '';
    }
  }

  private getPlugins(): string[] {
    try {
      const plugins: string[] = [];
      for (let i = 0; i < navigator.plugins.length; i++) {
        plugins.push(navigator.plugins[i].name);
      }
      return plugins;
    } catch {
      return [];
    }
  }

  private async getFonts(): Promise<string[]> {
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testFonts = [
      'Arial', 'Verdana', 'Courier New', 'Times New Roman',
      'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
      'Trebuchet MS', 'Impact', 'Lucida Console'
    ];

    const detectedFonts: string[] = [];
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    const baseFontWidths: { [key: string]: number } = {};
    baseFonts.forEach(baseFont => {
      ctx.font = `${testSize} ${baseFont}`;
      baseFontWidths[baseFont] = ctx.measureText(testString).width;
    });

    for (const font of testFonts) {
      let detected = false;
      for (const baseFont of baseFonts) {
        ctx.font = `${testSize} '${font}', ${baseFont}`;
        const width = ctx.measureText(testString).width;
        if (width !== baseFontWidths[baseFont]) {
          detected = true;
          break;
        }
      }
      if (detected) {
        detectedFonts.push(font);
      }
    }

    return detectedFonts;
  }

  private getTouchSupport(): boolean {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    );
  }
}

export function generateFingerprintHash(data: FingerprintData): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
