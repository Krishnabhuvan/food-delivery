import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
});

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { amount, orderId } = req.body;

    const order = await razorpay.orders.create({
      amount: amount * 100, // convert to paise
      currency: 'INR',
      receipt: orderId,
      notes: { orderId }
    });

    res.status(201).json({
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (err) {
    console.error('CREATE ORDER ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    } = req.body;

    const body = razorpayOrderId + '|' + razorpayPaymentId;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    res.json({
      verified: true,
      paymentId: razorpayPaymentId,
      orderId: razorpayOrderId
    });
  } catch (err) {
    console.error('VERIFY PAYMENT ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};