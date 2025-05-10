import * as dotenv from 'dotenv';
dotenv.config();

import Stripe from 'stripe';

console.log('Stripe secret key:', process.env.STRIPE_SECRET_KEY);

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
});
