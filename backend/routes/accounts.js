import express from 'express';
import { execute, executeOne, executeScalar } from '../db/oracle.js';
import { validateCustomer } from '../utils/validators.js';

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

// Get account by ID or account number
router.get('/:id', async (req, res) => {
  try {
    // Try to parse as number first (account_id), otherwise treat as account_number
    const isNumeric = /^\d+$/.test(req.params.id);
    
    let result;
    if (isNumeric) {
      // Search by account_id
      result = await executeOne(
        'SELECT * FROM account WHERE account_id = :id',
        [req.params.id]
      );
    } else {
      // Search by account_number
      result = await executeOne(
        'SELECT * FROM account WHERE account_number = :account_number',
        { account_number: req.params.id }
      );
    }
    
    if (!result) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get account by account number (explicit route)
router.get('/number/:accountNumber', async (req, res) => {
  try {
    const result = await executeOne(
      'SELECT * FROM account WHERE account_number = :account_number',
      { account_number: req.params.accountNumber }
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
    
    // Validate foreign keys before inserting
    if (customer_id !== null && customer_id !== undefined) {
      const customerExists = await validateCustomer(customer_id);
      if (!customerExists) {
        return res.status(400).json({ 
          error: `Invalid customer_id: ${customer_id}. Customer does not exist.` 
        });
      }
    }
    
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
    
    // Fetch the created record from database
    const createdAccount = await executeOne(
      'SELECT * FROM account WHERE account_id = :account_id',
      { account_id: accountId }
    );
    
    res.status(201).json(createdAccount);
  } catch (err) {
    if (err.errorNum === 1) { // Unique constraint violation
      res.status(400).json({ error: 'Account number already exists' });
    } else if (err.errorNum === 2291) { // Foreign key constraint violation
      const errorMsg = err.message || '';
      if (errorMsg.includes('FK_ACCOUNT_CUSTOMER')) {
        return res.status(400).json({ 
          error: `Invalid customer_id. The specified customer does not exist.` 
        });
      } else {
        return res.status(400).json({ 
          error: `Foreign key constraint violation: ${errorMsg}` 
        });
      }
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Update account
router.put('/:id', async (req, res) => {
  try {
    const { customer_id, account_number, credit_limit, current_balance, opened_date, status } = req.body;
    
    // Validate foreign keys before updating
    if (customer_id !== null && customer_id !== undefined) {
      const customerExists = await validateCustomer(customer_id);
      if (!customerExists) {
        return res.status(400).json({ 
          error: `Invalid customer_id: ${customer_id}. Customer does not exist.` 
        });
      }
    }
    
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
    
    // Fetch the updated record from database
    const updatedAccount = await executeOne(
      'SELECT * FROM account WHERE account_id = :account_id',
      { account_id: parseInt(req.params.id) }
    );
    
    res.json(updatedAccount);
  } catch (err) {
    if (err.errorNum === 2291) { // Foreign key constraint violation
      const errorMsg = err.message || '';
      if (errorMsg.includes('FK_ACCOUNT_CUSTOMER')) {
        return res.status(400).json({ 
          error: `Invalid customer_id. The specified customer does not exist.` 
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

// Get account orders
router.get('/:id/orders', async (req, res) => {
  try {
    const result = await execute(
      `SELECT o.*, 
              c.first_name || ' ' || c.last_name as customer_name,
              l.name as location_name
       FROM order_header o
       JOIN customer c ON o.customer_id = c.customer_id
       LEFT JOIN location l ON o.location_id = l.location_id
       WHERE o.account_id = :account_id
       ORDER BY o.order_id DESC`,
      { account_id: parseInt(req.params.id) }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get account payments
router.get('/:id/payments', async (req, res) => {
  try {
    const result = await execute(
      `SELECT p.*, 
              o.order_id,
              o.total_amount as order_total,
              o.status as order_status
       FROM payment p
       JOIN order_header o ON p.order_id = o.order_id
       WHERE p.account_id = :account_id
       ORDER BY p.payment_id DESC`,
      { account_id: parseInt(req.params.id) }
    );
    res.json(result);
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

