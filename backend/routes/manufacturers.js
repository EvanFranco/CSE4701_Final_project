import express from 'express';
import { execute, executeOne, executeScalar } from '../db/oracle.js';

const router = express.Router();

// Get all manufacturers
router.get('/', async (req, res) => {
  try {
    const result = await execute('SELECT * FROM manufacturer ORDER BY manufacturer_id');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get manufacturer by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await executeOne(
      'SELECT * FROM manufacturer WHERE manufacturer_id = :id',
      [req.params.id]
    );
    if (!result) {
      return res.status(404).json({ error: 'Manufacturer not found' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new manufacturer
router.post('/', async (req, res) => {
  try {
    const { name, country } = req.body;
    
    const manufacturerId = await executeScalar('SELECT seq_manufacturer_id.NEXTVAL FROM DUAL');
    
    await execute(
      `INSERT INTO manufacturer (manufacturer_id, name, country)
       VALUES (:manufacturer_id, :name, :country)`,
      {
        manufacturer_id: manufacturerId,
        name: name,
        country: country || null
      }
    );
    
    // Fetch the created record from database
    const createdManufacturer = await executeOne(
      'SELECT * FROM manufacturer WHERE manufacturer_id = :manufacturer_id',
      { manufacturer_id: manufacturerId }
    );
    
    res.status(201).json(createdManufacturer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update manufacturer
router.put('/:id', async (req, res) => {
  try {
    const { name, country } = req.body;
    
    await execute(
      `UPDATE manufacturer 
       SET name = :name, country = :country
       WHERE manufacturer_id = :manufacturer_id`,
      {
        manufacturer_id: parseInt(req.params.id),
        name: name,
        country: country || null
      }
    );
    
    // Fetch the updated record from database
    const updatedManufacturer = await executeOne(
      'SELECT * FROM manufacturer WHERE manufacturer_id = :manufacturer_id',
      { manufacturer_id: parseInt(req.params.id) }
    );
    
    res.json(updatedManufacturer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get manufacturer products
router.get('/:id/products', async (req, res) => {
  try {
    const result = await execute(
      `SELECT p.*, 
              COUNT(DISTINCT ol.order_id) as order_count,
              SUM(ol.quantity) as total_quantity_sold
       FROM product p
       LEFT JOIN order_line ol ON p.product_id = ol.product_id
       WHERE p.manufacturer_id = :manufacturer_id
       GROUP BY p.product_id, p.sku, p.name, p.description, p.unit_price, p.is_bundle, p.manufacturer_id
       ORDER BY p.product_id`,
      { manufacturer_id: parseInt(req.params.id) }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete manufacturer
router.delete('/:id', async (req, res) => {
  try {
    await execute('DELETE FROM manufacturer WHERE manufacturer_id = :id', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    if (err.errorNum === 2292) { // Foreign key constraint violation
      res.status(400).json({ error: 'Cannot delete manufacturer with existing products' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;

