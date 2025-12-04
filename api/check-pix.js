export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type')
      .end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    const response = await fetch(`https://api.pushinpay.com.br/api/transactions/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.PUSHINPAY_TOKEN}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('PushinPay API Error:', errorData);
      throw new Error(`Erro ao consultar PIX: ${response.status}`);
    }

    const data = await response.json();

    return res.status(200).json({
      id: data.id,
      status: data.status,
      value: data.value,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });

  } catch (error) {
    console.error('Error checking PIX:', error);
    return res.status(500).json({
      error: 'Erro ao consultar PIX. Tente novamente.',
      details: error.message
    });
  }
}
