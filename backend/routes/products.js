import express from 'express';
import { execute, executeOne, executeScalar } from '../db/oracle.js';
import { validateManufacturer } from '../utils/validators.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const result = await execute(`
      SELECT p.*, m.name as manufacturer_name, m.country as manufacturer_country
      FROM product p
      LEFT JOIN manufacturer m ON p.manufacturer_id = m.manufacturer_id
      ORDER BY p.product_id
    `);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await executeOne(
      `SELECT p.*, m.name as manufacturer_name, m.country as manufacturer_country
       FROM product p
       LEFT JOIN manufacturer m ON p.manufacturer_id = m.manufacturer_id
       WHERE p.product_id = :id`,
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
    
    // Validate foreign keys before inserting
    if (manufacturer_id !== null && manufacturer_id !== undefined) {
      const manufacturerExists = await validateManufacturer(manufacturer_id);
      if (!manufacturerExists) {
        return res.status(400).json({ 
          error: `Invalid manufacturer_id: ${manufacturer_id}. Manufacturer does not exist.` 
        });
      }
    }
    
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
    
    // Fetch the created record from database
    const createdProduct = await executeOne(
      'SELECT * FROM product WHERE product_id = :product_id',
      { product_id: productId }
    );
    
    res.status(201).json(createdProduct);
  } catch (err) {
    if (err.errorNum === 1) { // Unique constraint violation
      res.status(400).json({ error: 'SKU already exists' });
    } else if (err.errorNum === 2291) { // Foreign key constraint violation
      const errorMsg = err.message || '';
      if (errorMsg.includes('FK_PRODUCT_MANUFACTURER')) {
        return res.status(400).json({ 
          error: `Invalid manufacturer_id. The specified manufacturer does not exist.` 
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

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { sku, name, description, unit_price, is_bundle, manufacturer_id } = req.body;
    
    // Validate foreign keys before updating
    if (manufacturer_id !== null && manufacturer_id !== undefined) {
      const manufacturerExists = await validateManufacturer(manufacturer_id);
      if (!manufacturerExists) {
        return res.status(400).json({ 
          error: `Invalid manufacturer_id: ${manufacturer_id}. Manufacturer does not exist.` 
        });
      }
    }
    
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
    
    // Fetch the updated record from database
    const updatedProduct = await executeOne(
      'SELECT * FROM product WHERE product_id = :product_id',
      { product_id: parseInt(req.params.id) }
    );
    
    res.json(updatedProduct);
  } catch (err) {
    if (err.errorNum === 2291) { // Foreign key constraint violation
      const errorMsg = err.message || '';
      if (errorMsg.includes('FK_PRODUCT_MANUFACTURER')) {
        return res.status(400).json({ 
          error: `Invalid manufacturer_id. The specified manufacturer does not exist.` 
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

// Get product categories
router.get('/:id/categories', async (req, res) => {
  try {
    const result = await execute(
      `SELECT c.*
       FROM category c
       JOIN product_category pc ON c.category_id = pc.category_id
       WHERE pc.product_id = :product_id
       ORDER BY c.category_id`,
      { product_id: parseInt(req.params.id) }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get product inventory
router.get('/:id/inventory', async (req, res) => {
  try {
    const result = await execute(
      `SELECT i.*, 
              l.name as location_name,
              l.location_type
       FROM inventory i
       JOIN location l ON i.location_id = l.location_id
       WHERE i.product_id = :product_id
       ORDER BY l.name`,
      { product_id: parseInt(req.params.id) }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get product order lines (sales history)
router.get('/:id/order-lines', async (req, res) => {
  try {
    const result = await execute(
      `SELECT ol.*, 
              o.order_datetime,
              o.status as order_status,
              c.first_name || ' ' || c.last_name as customer_name
       FROM order_line ol
       JOIN order_header o ON ol.order_id = o.order_id
       JOIN customer c ON o.customer_id = c.customer_id
       WHERE ol.product_id = :product_id
       ORDER BY o.order_datetime DESC`,
      { product_id: parseInt(req.params.id) }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get bundle components (if this product is a bundle)
router.get('/:id/bundle-components', async (req, res) => {
  try {
    const result = await execute(
      `SELECT bc.*, 
              p.name as component_name,
              p.sku as component_sku,
              p.unit_price as component_price
       FROM bundle_component bc
       JOIN product p ON bc.component_product_id = p.product_id
       WHERE bc.bundle_product_id = :product_id
       ORDER BY bc.component_product_id`,
      { product_id: parseInt(req.params.id) }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get products that include this product as a component
router.get('/:id/bundles', async (req, res) => {
  try {
    const result = await execute(
      `SELECT p.*, 
              bc.quantity
       FROM product p
       JOIN bundle_component bc ON p.product_id = bc.bundle_product_id
       WHERE bc.component_product_id = :product_id
       ORDER BY p.product_id`,
      { product_id: parseInt(req.params.id) }
    );
    res.json(result);
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

