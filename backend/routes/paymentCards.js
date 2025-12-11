import express from 'express';
import { execute, executeOne, executeScalar } from '../db/oracle.js';
import { validateCustomer } from '../utils/validators.js';

const router = express.Router();

// Get all payment cards
router.get('/', async (req, res) => {
  try {
    const result = await execute(`
      SELECT pc.*, 
             c.first_name || ' ' || c.last_name as customer_name,
             c.email as customer_email
      FROM payment_card pc
      JOIN customer c ON pc.customer_id = c.customer_id
      ORDER BY pc.card_id DESC
    `);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get payment card by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await executeOne(
      `SELECT pc.*, 
              c.first_name || ' ' || c.last_name as customer_name,
              c.email as customer_email
       FROM payment_card pc
       JOIN customer c ON pc.customer_id = c.customer_id
       WHERE pc.card_id = :id`,
      [req.params.id]
    );
    if (!result) {
      return res.status(404).json({ error: 'Payment card not found' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get payment cards by customer ID
router.get('/customer/:customerId', async (req, res) => {
  try {
    const result = await execute(
      `SELECT pc.*, 
              c.first_name || ' ' || c.last_name as customer_name
       FROM payment_card pc
       JOIN customer c ON pc.customer_id = c.customer_id
       WHERE pc.customer_id = :customer_id
       ORDER BY pc.is_default DESC, pc.card_id DESC`,
      { customer_id: parseInt(req.params.customerId) }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new payment card
router.post('/', async (req, res) => {
  try {
    const { customer_id, card_type, masked_number, expiry_month, expiry_year, billing_address, is_default } = req.body;
    
    // Validate required fields
    if (!customer_id) {
      return res.status(400).json({ error: 'customer_id is required' });
    }
    
    // Validate customer exists
    const customerExists = await validateCustomer(customer_id);
    if (!customerExists) {
      return res.status(400).json({ 
        error: `Invalid customer_id: ${customer_id}. Customer does not exist.` 
      });
    }
    
    const cardId = await executeScalar('SELECT seq_card_id.NEXTVAL FROM DUAL');
    
    // If this is set as default, unset other default cards for this customer
    if (is_default === 'Y' || is_default === true) {
      await execute(
        'UPDATE payment_card SET is_default = \'N\' WHERE customer_id = :customer_id',
        { customer_id: customer_id }
      );
    }
    
    await execute(
      `INSERT INTO payment_card (card_id, customer_id, card_type, masked_number, expiry_month, expiry_year, billing_address, is_default)
       VALUES (:card_id, :customer_id, :card_type, :masked_number, :expiry_month, :expiry_year, :billing_address, :is_default)`,
      {
        card_id: cardId,
        customer_id: customer_id,
        card_type: card_type || null,
        masked_number: masked_number || null,
        expiry_month: expiry_month || null,
        expiry_year: expiry_year || null,
        billing_address: billing_address || null,
        is_default: is_default || 'N'
      }
    );
    
    // Fetch the created record
    const createdCard = await executeOne(
      `SELECT pc.*, 
              c.first_name || ' ' || c.last_name as customer_name
       FROM payment_card pc
       JOIN customer c ON pc.customer_id = c.customer_id
       WHERE pc.card_id = :card_id`,
      { card_id: cardId }
    );
    
    res.status(201).json(createdCard);
  } catch (err) {
    if (err.errorNum === 2291) {
      const errorMsg = err.message || '';
      if (errorMsg.includes('FK_PC_CUSTOMER')) {
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

// Update payment card
router.put('/:id', async (req, res) => {
  try {
    const { customer_id, card_type, masked_number, expiry_month, expiry_year, billing_address, is_default } = req.body;
    
    // Get existing card
    const existingCard = await executeOne(
      'SELECT * FROM payment_card WHERE card_id = :card_id',
      { card_id: parseInt(req.params.id) }
    );
    
    if (!existingCard) {
      return res.status(404).json({ error: 'Payment card not found' });
    }
    
    // Validate customer if provided
    if (customer_id !== undefined && customer_id !== null) {
      const customerExists = await validateCustomer(customer_id);
      if (!customerExists) {
        return res.status(400).json({ 
          error: `Invalid customer_id: ${customer_id}. Customer does not exist.` 
        });
      }
    }
    
    // If setting as default, unset other defaults for this customer
    const finalCustomerId = customer_id || existingCard.customer_id;
    if (is_default === 'Y' || is_default === true) {
      await execute(
        'UPDATE payment_card SET is_default = \'N\' WHERE customer_id = :customer_id AND card_id != :card_id',
        { customer_id: finalCustomerId, card_id: parseInt(req.params.id) }
      );
    }
    
    const updateFields = [];
    const updateBinds = { card_id: parseInt(req.params.id) };
    
    if (customer_id !== undefined) {
      updateFields.push('customer_id = :customer_id');
      updateBinds.customer_id = customer_id;
    }
    if (card_type !== undefined) {
      updateFields.push('card_type = :card_type');
      updateBinds.card_type = card_type || null;
    }
    if (masked_number !== undefined) {
      updateFields.push('masked_number = :masked_number');
      updateBinds.masked_number = masked_number || null;
    }
    if (expiry_month !== undefined) {
      updateFields.push('expiry_month = :expiry_month');
      updateBinds.expiry_month = expiry_month || null;
    }
    if (expiry_year !== undefined) {
      updateFields.push('expiry_year = :expiry_year');
      updateBinds.expiry_year = expiry_year || null;
    }
    if (billing_address !== undefined) {
      updateFields.push('billing_address = :billing_address');
      updateBinds.billing_address = billing_address || null;
    }
    if (is_default !== undefined) {
      updateFields.push('is_default = :is_default');
      updateBinds.is_default = is_default || 'N';
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    await execute(
      `UPDATE payment_card 
       SET ${updateFields.join(', ')}
       WHERE card_id = :card_id`,
      updateBinds
    );
    
    // Fetch updated record
    const updatedCard = await executeOne(
      `SELECT pc.*, 
              c.first_name || ' ' || c.last_name as customer_name
       FROM payment_card pc
       JOIN customer c ON pc.customer_id = c.customer_id
       WHERE pc.card_id = :card_id`,
      { card_id: parseInt(req.params.id) }
    );
    
    res.json(updatedCard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete payment card
router.delete('/:id', async (req, res) => {
  try {
    await execute('DELETE FROM payment_card WHERE card_id = :id', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    if (err.errorNum === 2292) {
      res.status(400).json({ error: 'Cannot delete payment card with existing payments' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;



