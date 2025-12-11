import express from 'express';
import { execute, executeOne } from '../db/oracle.js';
import { validateLocation, validateProduct } from '../utils/validators.js';

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
    
    // Validate foreign keys before inserting
    if (location_id !== null && location_id !== undefined) {
      const locationExists = await validateLocation(location_id);
      if (!locationExists) {
        return res.status(400).json({ 
          error: `Invalid location_id: ${location_id}. Location does not exist.` 
        });
      }
    }
    
    if (product_id !== null && product_id !== undefined) {
      const productExists = await validateProduct(product_id);
      if (!productExists) {
        return res.status(400).json({ 
          error: `Invalid product_id: ${product_id}. Product does not exist.` 
        });
      }
    }
    
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
    
    // Fetch the created record from database
    const createdInventory = await executeOne(
      `SELECT i.*, p.name as product_name, p.sku
       FROM inventory i
       JOIN product p ON i.product_id = p.product_id
       WHERE i.location_id = :location_id AND i.product_id = :product_id`,
      { location_id: location_id, product_id: product_id }
    );
    
    res.status(201).json(createdInventory);
  } catch (err) {
    if (err.errorNum === 1) { // Unique constraint violation
      res.status(400).json({ error: 'Inventory record already exists for this location and product' });
    } else if (err.errorNum === 2291) { // Foreign key constraint violation
      const errorMsg = err.message || '';
      if (errorMsg.includes('FK_INV_LOCATION')) {
        return res.status(400).json({ 
          error: `Invalid location_id. The specified location does not exist.` 
        });
      } else if (errorMsg.includes('FK_INV_PRODUCT')) {
        return res.status(400).json({ 
          error: `Invalid product_id. The specified product does not exist.` 
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
    
    // Fetch the updated record from database
    const updatedInventory = await executeOne(
      `SELECT i.*, p.name as product_name, p.sku
       FROM inventory i
       JOIN product p ON i.product_id = p.product_id
       WHERE i.location_id = :location_id AND i.product_id = :product_id`,
      { 
        location_id: parseInt(req.params.locationId), 
        product_id: parseInt(req.params.productId) 
      }
    );
    
    res.json(updatedInventory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

