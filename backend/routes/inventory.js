import express from 'express';
import { execute, executeOne } from '../db/oracle.js';

const router = express.Router();

// Get all inventory
router.get('/', async (req, res) => {
  try {
    const result = await execute(`
      SELECT i.*, p.name as product_name, p.sku
      FROM inventory i
      JOIN product p ON i.product_id = p.product_id
      ORDER BY i.location_id, i.product_id
    `);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get inventory by location and product
router.get('/:locationId/:productId', async (req, res) => {
  try {
    const result = await executeOne(
      'SELECT * FROM inventory WHERE location_id = :location_id AND product_id = :product_id',
      [req.params.locationId, req.params.productId]
    );
    if (!result) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new inventory
router.post('/', async (req, res) => {
  try {
    const { location_id, product_id, quantity_on_hand, reorder_level, reorder_quantity } = req.body;
    
    await execute(
      `INSERT INTO inventory (location_id, product_id, quantity_on_hand, reorder_level, reorder_quantity)
       VALUES (:location_id, :product_id, :quantity_on_hand, :reorder_level, :reorder_quantity)`,
      {
        location_id: location_id,
        product_id: product_id,
        quantity_on_hand: quantity_on_hand || 0,
        reorder_level: reorder_level || null,
        reorder_quantity: reorder_quantity || null
      }
    );
    
    res.status(201).json({ location_id, product_id, ...req.body });
  } catch (err) {
    if (err.errorNum === 1) { // Unique constraint violation
      res.status(400).json({ error: 'Inventory record already exists for this location and product' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Update inventory
router.put('/:locationId/:productId', async (req, res) => {
  try {
    const { quantity_on_hand, reorder_level, reorder_quantity } = req.body;
    
    await execute(
      `UPDATE inventory 
       SET quantity_on_hand = :quantity_on_hand, 
           reorder_level = :reorder_level, 
           reorder_quantity = :reorder_quantity
       WHERE location_id = :location_id AND product_id = :product_id`,
      {
        location_id: parseInt(req.params.locationId),
        product_id: parseInt(req.params.productId),
        quantity_on_hand: quantity_on_hand || 0,
        reorder_level: reorder_level || null,
        reorder_quantity: reorder_quantity || null
      }
    );
    
    res.json({ 
      location_id: parseInt(req.params.locationId), 
      product_id: parseInt(req.params.productId), 
      ...req.body 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

