import express from 'express';
import { execute, executeOne, executeScalar } from '../db/oracle.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const result = await execute('SELECT * FROM product ORDER BY product_id');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await executeOne(
      'SELECT * FROM product WHERE product_id = :id',
      [req.params.id]
    );
    if (!result) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new product
router.post('/', async (req, res) => {
  try {
    const { sku, name, description, unit_price, is_bundle, manufacturer_id } = req.body;
    
    const productId = await executeScalar('SELECT seq_product_id.NEXTVAL FROM DUAL');
    
    await execute(
      `INSERT INTO product (product_id, sku, name, description, unit_price, is_bundle, manufacturer_id)
       VALUES (:product_id, :sku, :name, :description, :unit_price, :is_bundle, :manufacturer_id)`,
      {
        product_id: productId,
        sku: sku || null,
        name: name,
        description: description || null,
        unit_price: unit_price,
        is_bundle: is_bundle || 'N',
        manufacturer_id: manufacturer_id || null
      }
    );
    
    res.status(201).json({ product_id: productId, ...req.body });
  } catch (err) {
    if (err.errorNum === 1) { // Unique constraint violation
      res.status(400).json({ error: 'SKU already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { sku, name, description, unit_price, is_bundle, manufacturer_id } = req.body;
    
    await execute(
      `UPDATE product 
       SET sku = :sku, name = :name, description = :description, 
           unit_price = :unit_price, is_bundle = :is_bundle, manufacturer_id = :manufacturer_id
       WHERE product_id = :product_id`,
      {
        product_id: parseInt(req.params.id),
        sku: sku || null,
        name: name,
        description: description || null,
        unit_price: unit_price,
        is_bundle: is_bundle || 'N',
        manufacturer_id: manufacturer_id || null
      }
    );
    
    res.json({ product_id: parseInt(req.params.id), ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    await execute('DELETE FROM product WHERE product_id = :id', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    if (err.errorNum === 2292) { // Foreign key constraint violation
      res.status(400).json({ error: 'Cannot delete product with existing orders or inventory' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;

