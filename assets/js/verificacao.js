// Sistema de Verificação de Acesso
// Coleta fingerprint do navegador e valida com a API

(function() {
  const startTime = Date.now();
  let mouseMovement = false;
  let progress = 0;

  // Detectar movimento do mouse
  window.addEventListener('mousemove', function() {
    mouseMovement = true;
  }, { once: true });

  // Atualizar UI
  function updateProgress(percent, status) {
    progress = percent;
    document.getElementById('progress-fill').style.width = percent + '%';
    document.getElementById('progress-percent').textContent = percent + '%';
    document.getElementById('status').textContent = status;

    // Ativar checks visuais
    if (percent > 25) document.getElementById('check-1').classList.add('active');
    if (percent > 55) document.getElementById('check-2').classList.add('active');
    if (percent > 75) document.getElementById('check-3').classList.add('active');
  }

  // Coletar fingerprint do navegador
  async function collectFingerprint() {
    updateProgress(15, 'Analisando navegador...');
    await sleep(800);

    updateProgress(35, 'Coletando dados de segurança...');
    await sleep(1200);

    updateProgress(55, 'Gerando impressão digital...');
    await sleep(800);

    const fingerprint = {
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
        pixelDepth: screen.pixelDepth
      },
      canvas: await getCanvasFingerprint(),
      webgl: getWebGLFingerprint(),
      plugins: getPlugins(),
      fonts: await getFonts(),
      touchSupport: getTouchSupport(),
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: navigator.deviceMemory || 0,
      platform: navigator.platform,
      doNotTrack: navigator.doNotTrack,
      mouseMovement: mouseMovement,
      timeOnPage: Math.floor((Date.now() - startTime) / 1000)
    };

    return fingerprint;
  }

  // Canvas fingerprint
  async function getCanvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      canvas.width = 200;
      canvas.height = 50;

      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Verification Check', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Security System', 4, 17);

      return canvas.toDataURL();
    } catch {
      return '';
    }
  }

  // WebGL fingerprint
  function getWebGLFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return '';

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return '';

      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

      return vendor + '~' + renderer;
    } catch {
      return '';
    }
  }

  // Plugins
  function getPlugins() {
    try {
      const plugins = [];
      for (let i = 0; i < navigator.plugins.length; i++) {
        plugins.push(navigator.plugins[i].name);
      }
      return plugins;
    } catch {
      return [];
    }
  }

  // Fontes detectadas
  async function getFonts() {
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testFonts = [
      'Arial', 'Verdana', 'Courier New', 'Times New Roman',
      'Georgia', 'Palatino', 'Garamond', 'Bookman'
    ];

    const detectedFonts = [];
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    const baseFontWidths = {};
    baseFonts.forEach(baseFont => {
      ctx.font = testSize + ' ' + baseFont;
      baseFontWidths[baseFont] = ctx.measureText(testString).width;
    });

    for (const font of testFonts) {
      let detected = false;
      for (const baseFont of baseFonts) {
        ctx.font = testSize + " '" + font + "', " + baseFont;
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

  // Touch support
  function getTouchSupport() {
    return 'ontouchstart' in window ||
           navigator.maxTouchPoints > 0 ||
           navigator.msMaxTouchPoints > 0;
  }

  // Helper: sleep
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Enviar para API
  async function validateAccess(fingerprint) {
    updateProgress(75, 'Validando acesso...');

    try {
      const response = await fetch('/api/verificar-acesso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fingerprint),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        updateProgress(100, 'Verificação completa!');
        await sleep(500);

        // Redirecionar para o site
        window.location.href = '/';
      } else {
        updateProgress(0, 'Verificação falhou');
        document.getElementById('status').classList.add('error');

        await sleep(2000);
        window.location.href = '/bloqueado.html';
      }
    } catch (error) {
      console.error('Erro na verificação:', error);
      updateProgress(0, 'Erro ao verificar. Tente novamente.');
      document.getElementById('status').classList.add('error');

      await sleep(2000);
      window.location.href = '/bloqueado.html';
    }
  }

  // Iniciar verificação
  async function init() {
    try {
      const fingerprint = await collectFingerprint();
      await validateAccess(fingerprint);
    } catch (error) {
      console.error('Erro na coleta:', error);
      updateProgress(0, 'Erro ao coletar dados');
      document.getElementById('status').classList.add('error');

      await sleep(2000);
      window.location.href = '/bloqueado.html';
    }
  }

  // Aguardar 2 segundos antes de iniciar (mínimo de permanência)
  setTimeout(init, 2000);
})();
