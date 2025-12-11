import express from 'express';
import { execute, executeOne, executeScalar } from '../db/oracle.js';

const router = express.Router();

// Get all shippers
router.get('/', async (req, res) => {
  try {
    const result = await execute('SELECT * FROM shipper ORDER BY shipper_id');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get shipper by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await executeOne(
      'SELECT * FROM shipper WHERE shipper_id = :id',
      [req.params.id]
    );
    if (!result) {
      return res.status(404).json({ error: 'Shipper not found' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get shipments by shipper ID
router.get('/:id/shipments', async (req, res) => {
  try {
    const result = await execute(
      `SELECT s.*, 
              o.order_id,
              o.order_datetime,
              o.total_amount as order_total
       FROM shipment s
       JOIN order_header o ON s.order_id = o.order_id
       WHERE s.shipper_id = :shipper_id
       ORDER BY s.shipment_id DESC`,
      { shipper_id: parseInt(req.params.id) }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new shipper
router.post('/', async (req, res) => {
  try {
    const { name, phone, website } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    
    const shipperId = await executeScalar('SELECT seq_shipper_id.NEXTVAL FROM DUAL');
    
    await execute(
      `INSERT INTO shipper (shipper_id, name, phone, website)
       VALUES (:shipper_id, :name, :phone, :website)`,
      {
        shipper_id: shipperId,
        name: name,
        phone: phone || null,
        website: website || null
      }
    );
    
    // Fetch the created record
    const createdShipper = await executeOne(
      'SELECT * FROM shipper WHERE shipper_id = :shipper_id',
      { shipper_id: shipperId }
    );
    
    res.status(201).json(createdShipper);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update shipper
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, website } = req.body;
    
    const updateFields = [];
    const updateBinds = { shipper_id: parseInt(req.params.id) };
    
    if (name !== undefined) {
      updateFields.push('name = :name');
      updateBinds.name = name;
    }
    if (phone !== undefined) {
      updateFields.push('phone = :phone');
      updateBinds.phone = phone || null;
    }
    if (website !== undefined) {
      updateFields.push('website = :website');
      updateBinds.website = website || null;
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    await execute(
      `UPDATE shipper 
       SET ${updateFields.join(', ')}
       WHERE shipper_id = :shipper_id`,
      updateBinds
    );
    
    // Fetch updated record
    const updatedShipper = await executeOne(
      'SELECT * FROM shipper WHERE shipper_id = :shipper_id',
      { shipper_id: parseInt(req.params.id) }
    );
    
    if (!updatedShipper) {
      return res.status(404).json({ error: 'Shipper not found' });
    }
    
    res.json(updatedShipper);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete shipper
router.delete('/:id', async (req, res) => {
  try {
    await execute('DELETE FROM shipper WHERE shipper_id = :id', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    if (err.errorNum === 2292) {
      res.status(400).json({ error: 'Cannot delete shipper with existing shipments' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;



