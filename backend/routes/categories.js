import express from 'express';
import { execute, executeOne, executeScalar } from '../db/oracle.js';
import { validateCategory } from '../utils/validators.js';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const result = await execute('SELECT * FROM category ORDER BY category_id');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await executeOne(
      'SELECT * FROM category WHERE category_id = :id',
      [req.params.id]
    );
    if (!result) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new category
router.post('/', async (req, res) => {
  try {
    const { name, category_type, parent_category_id } = req.body;
    
    // Validate foreign keys before inserting
    if (parent_category_id !== null && parent_category_id !== undefined) {
      const parentExists = await validateCategory(parent_category_id);
      if (!parentExists) {
        return res.status(400).json({ 
          error: `Invalid parent_category_id: ${parent_category_id}. Parent category does not exist.` 
        });
      }
    }
    
    const categoryId = await executeScalar('SELECT seq_category_id.NEXTVAL FROM DUAL');
    
    await execute(
      `INSERT INTO category (category_id, name, category_type, parent_category_id)
       VALUES (:category_id, :name, :category_type, :parent_category_id)`,
      {
        category_id: categoryId,
        name: name,
        category_type: category_type || null,
        parent_category_id: parent_category_id || null
      }
    );
    
    // Fetch the created record from database
    const createdCategory = await executeOne(
      'SELECT * FROM category WHERE category_id = :category_id',
      { category_id: categoryId }
    );
    
    res.status(201).json(createdCategory);
  } catch (err) {
    if (err.errorNum === 2291) { // Foreign key constraint violation
      const errorMsg = err.message || '';
      if (errorMsg.includes('FK_CATEGORY_PARENT')) {
        return res.status(400).json({ 
          error: `Invalid parent_category_id. The specified parent category does not exist.` 
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

// Update category
router.put('/:id', async (req, res) => {
  try {
    const { name, category_type, parent_category_id } = req.body;
    
    // Validate foreign keys before updating
    if (parent_category_id !== null && parent_category_id !== undefined) {
      // Prevent self-reference
      if (parent_category_id === parseInt(req.params.id)) {
        return res.status(400).json({ 
          error: 'Category cannot be its own parent.' 
        });
      }
      
      const parentExists = await validateCategory(parent_category_id);
      if (!parentExists) {
        return res.status(400).json({ 
          error: `Invalid parent_category_id: ${parent_category_id}. Parent category does not exist.` 
        });
      }
    }
    
    await execute(
      `UPDATE category 
       SET name = :name, category_type = :category_type, parent_category_id = :parent_category_id
       WHERE category_id = :category_id`,
      {
        category_id: parseInt(req.params.id),
        name: name,
        category_type: category_type || null,
        parent_category_id: parent_category_id || null
      }
    );
    
    // Fetch the updated record from database
    const updatedCategory = await executeOne(
      'SELECT * FROM category WHERE category_id = :category_id',
      { category_id: parseInt(req.params.id) }
    );
    
    res.json(updatedCategory);
  } catch (err) {
    if (err.errorNum === 2291) { // Foreign key constraint violation
      const errorMsg = err.message || '';
      if (errorMsg.includes('FK_CATEGORY_PARENT')) {
        return res.status(400).json({ 
          error: `Invalid parent_category_id. The specified parent category does not exist.` 
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

// Get category products
router.get('/:id/products', async (req, res) => {
  try {
    const result = await execute(
      `SELECT p.*, 
              m.name as manufacturer_name
       FROM product p
       JOIN product_category pc ON p.product_id = pc.product_id
       LEFT JOIN manufacturer m ON p.manufacturer_id = m.manufacturer_id
       WHERE pc.category_id = :category_id
       ORDER BY p.name`,
      { category_id: parseInt(req.params.id) }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get child categories
router.get('/:id/children', async (req, res) => {
  try {
    const result = await execute(
      'SELECT * FROM category WHERE parent_category_id = :category_id ORDER BY category_id',
      { category_id: parseInt(req.params.id) }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get parent category
router.get('/:id/parent', async (req, res) => {
  try {
    const category = await executeOne(
      'SELECT parent_category_id FROM category WHERE category_id = :category_id',
      { category_id: parseInt(req.params.id) }
    );
    
    if (!category || !category.parent_category_id) {
      return res.json(null);
    }
    
    const parent = await executeOne(
      'SELECT * FROM category WHERE category_id = :category_id',
      { category_id: category.parent_category_id }
    );
    
    res.json(parent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    await execute('DELETE FROM category WHERE category_id = :id', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    if (err.errorNum === 2292) { // Foreign key constraint violation
      res.status(400).json({ error: 'Cannot delete category with existing products or child categories' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;

