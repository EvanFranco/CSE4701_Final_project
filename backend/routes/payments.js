import express from 'express';
import { execute, executeOne, executeScalar } from '../db/oracle.js';

const router = express.Router();

// Get all payments
router.get('/', async (req, res) => {
  try {
    const result = await execute('SELECT * FROM payment ORDER BY payment_id DESC');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get payment by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await executeOne(
      'SELECT * FROM payment WHERE payment_id = :id',
      [req.params.id]
    );
    if (!result) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new payment
router.post('/', async (req, res) => {
  try {
    const { order_id, payment_method, amount, payment_date, card_id, account_id } = req.body;
    
    const paymentId = await executeScalar('SELECT seq_payment_id.NEXTVAL FROM DUAL');
    
    await execute(
      `INSERT INTO payment (payment_id, order_id, payment_method, amount, payment_date, card_id, account_id)
       VALUES (:payment_id, :order_id, :payment_method, :amount, 
               TO_DATE(:payment_date, 'YYYY-MM-DD'), :card_id, :account_id)`,
      {
        payment_id: paymentId,
        order_id: order_id,
        payment_method: payment_method,
        amount: amount,
        payment_date: payment_date,
        card_id: card_id || null,
        account_id: account_id || null
      }
    );
    
    res.status(201).json({ payment_id: paymentId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

