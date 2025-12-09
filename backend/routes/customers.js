import express from 'express';
import { execute, executeOne, executeScalar } from '../db/oracle.js';

const router = express.Router();

// Get all customers
router.get('/', async (req, res) => {
  try {
    const result = await execute('SELECT * FROM customer ORDER BY customer_id');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await executeOne(
      'SELECT * FROM customer WHERE customer_id = :id',
      [req.params.id]
    );
    if (!result) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new customer
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, billing_address, shipping_address, contract_flag } = req.body;
    
    // Get next ID from sequence
    const customerId = await executeScalar('SELECT seq_customer_id.NEXTVAL FROM DUAL');
    
    await execute(
      `INSERT INTO customer (customer_id, first_name, last_name, email, phone, billing_address, shipping_address, contract_flag)
       VALUES (:customer_id, :first_name, :last_name, :email, :phone, :billing_address, :shipping_address, :contract_flag)`,
      {
        customer_id: customerId,
        first_name: first_name || null,
        last_name: last_name || null,
        email: email || null,
        phone: phone || null,
        billing_address: billing_address || null,
        shipping_address: shipping_address || null,
        contract_flag: contract_flag || 'N'
      }
    );
    
    res.status(201).json({ customer_id: customerId, ...req.body });
  } catch (err) {
    if (err.errorNum === 1) { // Unique constraint violation
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, billing_address, shipping_address, contract_flag } = req.body;
    
    await execute(
      `UPDATE customer 
       SET first_name = :first_name, last_name = :last_name, email = :email, 
           phone = :phone, billing_address = :billing_address, 
           shipping_address = :shipping_address, contract_flag = :contract_flag
       WHERE customer_id = :customer_id`,
      {
        customer_id: parseInt(req.params.id),
        first_name: first_name || null,
        last_name: last_name || null,
        email: email || null,
        phone: phone || null,
        billing_address: billing_address || null,
        shipping_address: shipping_address || null,
        contract_flag: contract_flag || 'N'
      }
    );
    
    res.json({ customer_id: parseInt(req.params.id), ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    await execute('DELETE FROM customer WHERE customer_id = :id', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    if (err.errorNum === 2292) { // Foreign key constraint violation
      res.status(400).json({ error: 'Cannot delete customer with existing orders or accounts' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;

