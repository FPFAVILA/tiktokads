class PixManager {
  constructor() {
    this.loading = false;
    this.error = null;
    this.pixData = null;
    this.isPaid = false;
    this.pollingInterval = null;
    this.onPaymentConfirmed = null;
  }

  async createPix(amount) {
    this.loading = true;
    this.error = null;
    this.isPaid = false;

    try {
      if (amount < 0.01) {
        throw new Error('Valor mínimo é R$ 0,01');
      }

      const response = await fetch('/api/create-pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar PIX');
      }

      const data = await response.json();

      this.pixData = {
        qrCode: data.qr_code,
        qrCodeBase64: data.qr_code_base64,
        amount: data.value / 100,
        transactionId: data.id,
      };

      this.startPolling(data.id);
      return this.pixData;

    } catch (err) {
      this.error = err.message || 'Erro ao gerar PIX';
      console.error('Error creating PIX:', err);
      throw err;
    } finally {
      this.loading = false;
    }
  }

  async checkPixStatus(transactionId) {
    try {
      const response = await fetch(`/api/check-pix?id=${transactionId}`);

      if (!response.ok) {
        throw new Error('Erro ao verificar status do pagamento');
      }

      const data = await response.json();
      return data.status;
    } catch (err) {
      console.error('Error checking PIX status:', err);
      return 'error';
    }
  }

  startPolling(transactionId) {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(async () => {
      const status = await this.checkPixStatus(transactionId);

      if (status === 'paid') {
        this.isPaid = true;
        this.stopPolling();
        if (this.onPaymentConfirmed) {
          this.onPaymentConfirmed();
        }
      } else if (status === 'expired' || status === 'cancelled') {
        this.stopPolling();
        this.error = 'Pagamento expirado ou cancelado';
      }
    }, 3000);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  reset() {
    this.stopPolling();
    this.pixData = null;
    this.error = null;
    this.isPaid = false;
    this.loading = false;
  }

  setOnPaymentConfirmed(callback) {
    this.onPaymentConfirmed = callback;
  }
}

window.PixManager = PixManager;
