export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type')
      .end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { value } = req.body;

    if (!value || value < 0.01) {
      return res.status(400).json({ error: 'Valor mínimo é R$ 0,01' });
    }

    const valueInCents = Math.round(value * 100);

    const webhookUrl = `${req.headers.origin || 'https://' + req.headers.host}/api/webhook`;

    const response = await fetch('https://api.pushinpay.com.br/api/pix/cashIn', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PUSHINPAY_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: valueInCents,
        webhook_url: webhookUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('PushinPay API Error:', errorData);
      throw new Error(`Erro ao gerar PIX: ${response.status}`);
    }

    const data = await response.json();

    return res.status(200).json({
      id: data.id,
      qr_code: data.qr_code,
      qr_code_base64: data.qr_code_base64,
      status: data.status,
      value: data.value,
    });

  } catch (error) {
    console.error('Error creating PIX:', error);
    return res.status(500).json({
      error: 'Erro ao gerar PIX. Tente novamente.',
      details: error.message
    });
  }
}
