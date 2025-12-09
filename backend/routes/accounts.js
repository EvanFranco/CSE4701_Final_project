import express from 'express';
import { execute, executeOne, executeScalar } from '../db/oracle.js';

const router = express.Router();

// Get all accounts
router.get('/', async (req, res) => {
  try {
    const result = await execute('SELECT * FROM account ORDER BY account_id');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get account by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await executeOne(
      'SELECT * FROM account WHERE account_id = :id',
      [req.params.id]
    );
    if (!result) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new account
router.post('/', async (req, res) => {
  try {
    const { customer_id, account_number, credit_limit, current_balance, opened_date, status } = req.body;
    
    const accountId = await executeScalar('SELECT seq_account_id.NEXTVAL FROM DUAL');
    
    await execute(
      `INSERT INTO account (account_id, customer_id, account_number, credit_limit, current_balance, opened_date, status)
       VALUES (:account_id, :customer_id, :account_number, :credit_limit, :current_balance, 
               TO_DATE(:opened_date, 'YYYY-MM-DD'), :status)`,
      {
        account_id: accountId,
        customer_id: customer_id,
        account_number: account_number,
        credit_limit: credit_limit || null,
        current_balance: current_balance || 0,
        opened_date: opened_date || null,
        status: status || 'ACTIVE'
      }
    );
    
    res.status(201).json({ account_id: accountId, ...req.body });
  } catch (err) {
    if (err.errorNum === 1) { // Unique constraint violation
      res.status(400).json({ error: 'Account number already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Update account
router.put('/:id', async (req, res) => {
  try {
    const { customer_id, account_number, credit_limit, current_balance, opened_date, status } = req.body;
    
    await execute(
      `UPDATE account 
       SET customer_id = :customer_id, account_number = :account_number, 
           credit_limit = :credit_limit, current_balance = :current_balance, 
           opened_date = TO_DATE(:opened_date, 'YYYY-MM-DD'), status = :status
       WHERE account_id = :account_id`,
      {
        account_id: parseInt(req.params.id),
        customer_id: customer_id,
        account_number: account_number,
        credit_limit: credit_limit || null,
        current_balance: current_balance || 0,
        opened_date: opened_date || null,
        status: status || 'ACTIVE'
      }
    );
    
    res.json({ account_id: parseInt(req.params.id), ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete account
router.delete('/:id', async (req, res) => {
  try {
    await execute('DELETE FROM account WHERE account_id = :id', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    if (err.errorNum === 2292) { // Foreign key constraint violation
      res.status(400).json({ error: 'Cannot delete account with existing orders or payments' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;

