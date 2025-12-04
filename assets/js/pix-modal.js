class PixPaymentModal {
  constructor() {
    this.pixManager = new PixManager();
    this.modal = null;
    this.amount = 0;
    this.copied = false;
    this.onSuccess = null;
    this.init();
  }

  init() {
    this.createModal();
    this.attachEventListeners();
    this.pixManager.setOnPaymentConfirmed(() => this.handlePaymentSuccess());
  }

  createModal() {
    const modalHTML = `
      <div id="pix-modal" class="pix-modal-overlay">
        <div class="pix-modal-content">
          <div class="pix-modal-header">
            <h2 class="pix-modal-title">Pagamento via PIX</h2>
            <button class="pix-modal-close" id="pix-modal-close">&times;</button>
          </div>
          <div class="pix-modal-body">
            <div class="pix-amount-box">
              <div class="pix-amount-label">Valor a pagar</div>
              <div class="pix-amount-value" id="pix-modal-amount">R$ 0,00</div>
            </div>

            <div id="pix-modal-loading" class="pix-loading-container" style="display: none;">
              <div class="pix-spinner"></div>
              <div class="pix-loading-text">Gerando QR Code...</div>
            </div>

            <div id="pix-modal-error" class="pix-error-container" style="display: none;">
              <div class="pix-error-text"></div>
              <button class="pix-retry-btn" id="pix-retry-btn">Tentar novamente</button>
            </div>

            <div id="pix-modal-content-area" style="display: none;">
              <div class="pix-qrcode-container">
                <div class="pix-qrcode-wrapper">
                  <canvas id="pix-qrcode-canvas" class="pix-qrcode-canvas"></canvas>
                </div>
                <div class="pix-qrcode-hint">
                  <svg class="pix-qrcode-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  <span>Escaneie com seu app de banco</span>
                </div>
              </div>

              <div class="pix-code-section">
                <div class="pix-code-label">Ou copie o código PIX:</div>
                <div class="pix-code-box">
                  <div class="pix-code-text" id="pix-code-text"></div>
                </div>
                <button class="pix-copy-btn" id="pix-copy-btn">
                  <svg class="pix-copy-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <span id="pix-copy-text">Copiar Código PIX</span>
                </button>
              </div>

              <div class="pix-instructions-box">
                <div class="pix-instructions-title">Como pagar:</div>
                <ol class="pix-instructions-list">
                  <li>Abra o app do seu banco</li>
                  <li>Escolha pagar com PIX</li>
                  <li>Escaneie o QR Code ou cole o código</li>
                  <li>Confirme o pagamento</li>
                </ol>
              </div>

              <div class="pix-status-box">
                <div class="pix-status-spinner"></div>
                <div class="pix-status-text">Aguardando pagamento...</div>
              </div>
            </div>

            <div id="pix-modal-success" class="pix-success-container" style="display: none;">
              <div class="pix-success-icon-wrapper">
                <svg class="pix-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div class="pix-success-title">Saque Solicitado com Sucesso!</div>
              <div class="pix-success-text">Tempo de processamento: 2 dias úteis</div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('pix-modal');
  }

  attachEventListeners() {
    const closeBtn = document.getElementById('pix-modal-close');
    const retryBtn = document.getElementById('pix-retry-btn');
    const copyBtn = document.getElementById('pix-copy-btn');

    closeBtn.addEventListener('click', () => this.close());

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    retryBtn.addEventListener('click', () => this.generatePix());
    copyBtn.addEventListener('click', () => this.copyCode());
  }

  async open(amount, onSuccess) {
    this.amount = amount;
    this.onSuccess = onSuccess;
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    document.getElementById('pix-modal-amount').textContent = `R$ ${amount.toFixed(2).replace('.', ',')}`;

    await this.generatePix();
  }

  close() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
    this.pixManager.reset();
    this.hideAllStates();
    this.copied = false;
  }

  hideAllStates() {
    document.getElementById('pix-modal-loading').style.display = 'none';
    document.getElementById('pix-modal-error').style.display = 'none';
    document.getElementById('pix-modal-content-area').style.display = 'none';
    document.getElementById('pix-modal-success').style.display = 'none';
  }

  showLoading() {
    this.hideAllStates();
    document.getElementById('pix-modal-loading').style.display = 'flex';
  }

  showError(message) {
    this.hideAllStates();
    const errorContainer = document.getElementById('pix-modal-error');
    errorContainer.querySelector('.pix-error-text').textContent = message;
    errorContainer.style.display = 'block';
  }

  showContent() {
    this.hideAllStates();
    document.getElementById('pix-modal-content-area').style.display = 'block';
  }

  showSuccess() {
    this.hideAllStates();
    document.getElementById('pix-modal-success').style.display = 'flex';
  }

  async generatePix() {
    this.showLoading();

    try {
      const pixData = await this.pixManager.createPix(this.amount);
      await this.renderQRCode(pixData.qrCode);
      document.getElementById('pix-code-text').textContent = pixData.qrCode;
      this.showContent();
    } catch (error) {
      this.showError(error.message || 'Erro ao gerar PIX. Tente novamente.');
    }
  }

  async renderQRCode(code) {
    const canvas = document.getElementById('pix-qrcode-canvas');

    // Aguarda até 5 segundos pela biblioteca carregar
    let attempts = 0;
    while (typeof QRCode === 'undefined' && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (typeof QRCode === 'undefined') {
      console.error('QRCode library not loaded after waiting');
      throw new Error('Erro ao carregar biblioteca QR Code. Por favor, recarregue a página.');
    }

    try {
      await QRCode.toCanvas(canvas, code, {
        width: 240,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      console.log('QR Code gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      throw new Error('Erro ao gerar QR Code. Tente novamente.');
    }
  }

  copyCode() {
    const code = document.getElementById('pix-code-text').textContent;
    const copyBtn = document.getElementById('pix-copy-btn');
    const copyText = document.getElementById('pix-copy-text');

    navigator.clipboard.writeText(code).then(() => {
      this.copied = true;
      copyBtn.classList.add('copied');
      copyText.textContent = 'Código Copiado!';

      setTimeout(() => {
        this.copied = false;
        copyBtn.classList.remove('copied');
        copyText.textContent = 'Copiar Código PIX';
      }, 3000);
    }).catch(err => {
      console.error('Error copying code:', err);
      alert('Erro ao copiar código. Tente novamente.');
    });
  }

  handlePaymentSuccess() {
    this.showSuccess();

    setTimeout(() => {
      if (this.onSuccess) {
        this.onSuccess();
      }
      this.close();
    }, 3000);
  }
}

window.pixPaymentModal = new PixPaymentModal();
