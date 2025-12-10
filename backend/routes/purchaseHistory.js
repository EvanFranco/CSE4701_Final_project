import express from 'express';
import { execute } from '../db/oracle.js';

const router = express.Router();

// Get customer purchase history
router.get('/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    
    let result;
    try {
      result = await execute(
        `SELECT * FROM customer_purchase_history 
         WHERE customer_id = :customer_id 
         ORDER BY order_datetime DESC`,
        { customer_id: customerId }
      );
    } catch (err) {
      if (err.errorNum === 942) { // Table or view does not exist
        return res.status(500).json({ 
          error: 'Purchase history view does not exist. Please run the database_schema.sql script to create the customer_purchase_history view.' 
        });
      }
      throw err;
    }
    
    // Convert Oracle result to JSON (result is already an array of objects with lowercase keys)
    const purchases = result.map(row => ({
      customer_id: row.customer_id,
      email: row.email,
      customer_name: row.customer_name,
      order_id: row.order_id,
      order_datetime: row.order_datetime,
      channel: row.channel,
      total_amount: row.total_amount,
      order_status: row.order_status,
      product_id: row.product_id,
      product_name: row.product_name,
      sku: row.sku,
      quantity: row.quantity,
      unit_price: row.unit_price,
      discount_amount: row.discount_amount,
      warehouse_name: row.warehouse_name,
      location_type: row.location_type
    }));
    
    res.json(purchases);
  } catch (err) {
    console.error('Purchase history error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

