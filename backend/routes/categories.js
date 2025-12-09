import express from 'express';
import { execute, executeOne, executeScalar } from '../db/oracle.js';

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
    
    res.status(201).json({ category_id: categoryId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update category
router.put('/:id', async (req, res) => {
  try {
    const { name, category_type, parent_category_id } = req.body;
    
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
    
    res.json({ category_id: parseInt(req.params.id), ...req.body });
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

