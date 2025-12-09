import express from 'express';
import { execute, executeOne, executeScalar } from '../db/oracle.js';

const router = express.Router();

// Get all orders
router.get('/', async (req, res) => {
  try {
    const result = await execute('SELECT * FROM order_header ORDER BY order_id DESC');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await executeOne(
      'SELECT * FROM order_header WHERE order_id = :id',
      [req.params.id]
    );
    if (!result) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const { order_datetime, channel, customer_id, account_id, location_id, total_amount, status } = req.body;
    
    const orderId = await executeScalar('SELECT seq_order_id.NEXTVAL FROM DUAL');
    
    // Handle datetime - convert from ISO format if needed
    let orderDate = order_datetime;
    if (orderDate && orderDate.includes('T')) {
      // Convert ISO datetime to Oracle format
      orderDate = orderDate.replace('T', ' ').substring(0, 19);
    }
    
    await execute(
      `INSERT INTO order_header (order_id, order_datetime, channel, customer_id, account_id, location_id, total_amount, status)
       VALUES (:order_id, TO_DATE(:order_datetime, 'YYYY-MM-DD HH24:MI:SS'), :channel, :customer_id, :account_id, :location_id, :total_amount, :status)`,
      {
        order_id: orderId,
        order_datetime: orderDate || new Date().toISOString().replace('T', ' ').substring(0, 19),
        channel: channel,
        customer_id: customer_id,
        account_id: account_id || null,
        location_id: location_id || null,
        total_amount: total_amount || null,
        status: status || 'PENDING'
      }
    );
    
    res.status(201).json({ order_id: orderId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order
router.put('/:id', async (req, res) => {
  try {
    const { order_datetime, channel, customer_id, account_id, location_id, total_amount, status } = req.body;
    
    // Handle datetime - convert from ISO format if needed
    let orderDate = order_datetime;
    if (orderDate && orderDate.includes('T')) {
      orderDate = orderDate.replace('T', ' ').substring(0, 19);
    }
    
    await execute(
      `UPDATE order_header 
       SET order_datetime = TO_DATE(:order_datetime, 'YYYY-MM-DD HH24:MI:SS'), 
           channel = :channel, customer_id = :customer_id, account_id = :account_id, 
           location_id = :location_id, total_amount = :total_amount, status = :status
       WHERE order_id = :order_id`,
      {
        order_id: parseInt(req.params.id),
        order_datetime: orderDate,
        channel: channel,
        customer_id: customer_id,
        account_id: account_id || null,
        location_id: location_id || null,
        total_amount: total_amount || null,
        status: status || 'PENDING'
      }
    );
    
    res.json({ order_id: parseInt(req.params.id), ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete order
router.delete('/:id', async (req, res) => {
  try {
    await execute('DELETE FROM order_header WHERE order_id = :id', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    if (err.errorNum === 2292) { // Foreign key constraint violation
      res.status(400).json({ error: 'Cannot delete order with existing order lines or payments' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;

