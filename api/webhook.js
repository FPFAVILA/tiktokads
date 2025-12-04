export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type, x-pushinpay-token')
      .end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-pushinpay-token');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookToken = req.headers['x-pushinpay-token'];

    if (process.env.PUSHINPAY_WEBHOOK_TOKEN && webhookToken !== process.env.PUSHINPAY_WEBHOOK_TOKEN) {
      console.warn('Invalid webhook token received');
      return res.status(200).json({ received: true });
    }

    const { id, status, value, created_at, updated_at } = req.body;

    console.log('Webhook received:', {
      id,
      status,
      value: value / 100,
      created_at,
      updated_at,
    });

    return res.status(200).json({
      received: true,
      transaction_id: id,
      status: status
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(200).json({ received: true, error: error.message });
  }
}
