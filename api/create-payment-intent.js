const Stripe = require('stripe');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { amount, currency = 'eur', metadata = {} } = req.body || {};

  if (typeof amount !== 'number' || amount < 0.5) {
    return res.status(400).json({ error: 'Montant invalide (minimum 0,50 €)' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Configuration Stripe manquante' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: Object.fromEntries(
        Object.entries(metadata).map(([k, v]) => [k, String(v).substring(0, 500)])
      ),
      automatic_payment_methods: { enabled: true },
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe PaymentIntent error:', err.message);
    res.status(500).json({ error: 'Erreur paiement, veuillez réessayer.' });
  }
};
