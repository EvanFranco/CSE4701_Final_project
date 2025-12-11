import express from 'express';
import { execute, executeOne, executeScalar } from '../db/oracle.js';
import { validateOrder, validatePaymentCard, validateAccount } from '../utils/validators.js';

const router = express.Router();

// Get all payments
router.get('/', async (req, res) => {
  try {
    const result = await execute(`
      SELECT p.*,
             o.order_id,
             o.total_amount as order_total,
             o.status as order_status,
             a.account_number,
             a.current_balance as account_balance,
             a.credit_limit as account_credit_limit,
             pc.masked_number as card_masked_number
      FROM payment p
      LEFT JOIN order_header o ON p.order_id = o.order_id
      LEFT JOIN account a ON p.account_id = a.account_id
      LEFT JOIN payment_card pc ON p.card_id = pc.card_id
      ORDER BY p.payment_id DESC
    `);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get payment by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await executeOne(
      `SELECT p.*,
              o.order_id,
              o.total_amount as order_total,
              o.status as order_status,
              a.account_number,
              a.current_balance as account_balance,
              a.credit_limit as account_credit_limit,
              pc.masked_number as card_masked_number
       FROM payment p
       LEFT JOIN order_header o ON p.order_id = o.order_id
       LEFT JOIN account a ON p.account_id = a.account_id
       LEFT JOIN payment_card pc ON p.card_id = pc.card_id
       WHERE p.payment_id = :id`,
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
    
    // Validate foreign keys before inserting
    if (order_id !== null && order_id !== undefined) {
      const orderExists = await validateOrder(order_id);
      if (!orderExists) {
        return res.status(400).json({ 
          error: `Invalid order_id: ${order_id}. Order does not exist.` 
        });
      }
    }
    
    if (card_id !== null && card_id !== undefined) {
      const cardExists = await validatePaymentCard(card_id);
      if (!cardExists) {
        return res.status(400).json({ 
          error: `Invalid card_id: ${card_id}. Payment card does not exist.` 
        });
      }
    }
    
    if (account_id !== null && account_id !== undefined) {
      const accountExists = await validateAccount(account_id);
      if (!accountExists) {
        return res.status(400).json({ 
          error: `Invalid account_id: ${account_id}. Account does not exist.` 
        });
      }
    }
    
    const paymentId = await executeScalar('SELECT seq_payment_id.NEXTVAL FROM DUAL');
    
    // Insert payment
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
    
    // If payment is linked to an account, subtract the payment amount from account balance
    // (Payments reduce debt, so they're always allowed - no credit limit check needed)
    if (account_id) {
      const account = await executeOne(
        'SELECT current_balance FROM account WHERE account_id = :account_id',
        { account_id: account_id }
      );
      
      if (account) {
        const newBalance = (account.current_balance || 0) - amount;
        
        // Update account balance (payments reduce what the customer owes)
        await execute(
          `UPDATE account SET current_balance = :new_balance WHERE account_id = :account_id`,
          {
            new_balance: newBalance,
            account_id: account_id
          }
        );
      }
    }
    
    // Fetch the created record from database
    const createdPayment = await executeOne(
      'SELECT * FROM payment WHERE payment_id = :payment_id',
      { payment_id: paymentId }
    );
    
    res.status(201).json(createdPayment);
  } catch (err) {
    if (err.errorNum === 2291) { // Foreign key constraint violation
      const errorMsg = err.message || '';
      if (errorMsg.includes('FK_PAYMENT_ORDER')) {
        return res.status(400).json({ 
          error: `Invalid order_id. The specified order does not exist.` 
        });
      } else if (errorMsg.includes('FK_PAYMENT_CARD')) {
        return res.status(400).json({ 
          error: `Invalid card_id. The specified payment card does not exist.` 
        });
      } else if (errorMsg.includes('FK_PAYMENT_ACCOUNT')) {
        return res.status(400).json({ 
          error: `Invalid account_id. The specified account does not exist.` 
        });
      } else {
        return res.status(400).json({ 
          error: `Foreign key constraint violation: ${errorMsg}` 
        });
      }
    }
    res.status(500).json({ error: err.message });
  }
});

// Delete payment
router.delete('/:id', async (req, res) => {
  try {
    // Get payment details before deletion to reverse account balance if needed
    const payment = await executeOne(
      'SELECT account_id, amount FROM payment WHERE payment_id = :payment_id',
      { payment_id: parseInt(req.params.id) }
    );
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // Delete the payment
    await execute('DELETE FROM payment WHERE payment_id = :id', [req.params.id]);
    
    // If payment was linked to an account, reverse the account balance change (add back the amount)
    if (payment.account_id && payment.amount && payment.amount > 0) {
      const account = await executeOne(
        'SELECT current_balance FROM account WHERE account_id = :account_id',
        { account_id: payment.account_id }
      );
      
      if (account) {
        const newBalance = (account.current_balance || 0) + payment.amount;
        await execute(
          `UPDATE account SET current_balance = :new_balance WHERE account_id = :account_id`,
          {
            new_balance: newBalance,
            account_id: payment.account_id
          }
        );
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

