import express from 'express';
import { execute, executeOne, executeScalar } from '../db/oracle.js';

const router = express.Router();

// Get all locations
router.get('/', async (req, res) => {
  try {
    const result = await execute('SELECT * FROM location ORDER BY location_id');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get location by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await executeOne(
      'SELECT * FROM location WHERE location_id = :id',
      [req.params.id]
    );
    if (!result) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new location
router.post('/', async (req, res) => {
  try {
    const { name, location_type, address, city, state, zip, region } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    
    if (!location_type) {
      return res.status(400).json({ error: 'location_type is required' });
    }
    
    // Validate location_type value
    if (location_type !== 'STORE' && location_type !== 'WAREHOUSE') {
      return res.status(400).json({ 
        error: "location_type must be either 'STORE' or 'WAREHOUSE'" 
      });
    }
    
    const locationId = await executeScalar('SELECT seq_location_id.NEXTVAL FROM DUAL');
    
    await execute(
      `INSERT INTO location (location_id, name, location_type, address, city, state, zip, region)
       VALUES (:location_id, :name, :location_type, :address, :city, :state, :zip, :region)`,
      {
        location_id: locationId,
        name: name,
        location_type: location_type,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        region: region || null
      }
    );
    
    // Fetch the created record from database
    const createdLocation = await executeOne(
      'SELECT * FROM location WHERE location_id = :location_id',
      { location_id: locationId }
    );
    
    res.status(201).json(createdLocation);
  } catch (err) {
    if (err.errorNum === 1400) {
      // NOT NULL constraint violation
      return res.status(400).json({ 
        error: `Required field is missing: ${err.message}` 
      });
    } else if (err.errorNum === 2290) {
      // CHECK constraint violation
      const errorMsg = err.message || '';
      if (errorMsg.includes('CHK_LOCATION_TYPE')) {
        return res.status(400).json({ 
          error: "location_type must be either 'STORE' or 'WAREHOUSE'" 
        });
      } else {
        return res.status(400).json({ 
          error: `Constraint violation: ${errorMsg}` 
        });
      }
    } else {
      console.error('Location creation error:', err);
      res.status(500).json({ error: err.message || 'Failed to create location' });
    }
  }
});

// Update location
router.put('/:id', async (req, res) => {
  try {
    const { name, location_type, address, city, state, zip, region } = req.body;
    
    // Validate location_type value if provided
    if (location_type !== undefined) {
      if (!location_type) {
        return res.status(400).json({ 
          error: 'location_type cannot be null' 
        });
      }
      if (location_type !== 'STORE' && location_type !== 'WAREHOUSE') {
        return res.status(400).json({ 
          error: "location_type must be either 'STORE' or 'WAREHOUSE'" 
        });
      }
    }
    
    // Build dynamic UPDATE query based on provided fields
    const updateFields = [];
    const updateBinds = { location_id: parseInt(req.params.id) };
    
    if (name !== undefined) {
      updateFields.push('name = :name');
      updateBinds.name = name;
    }
    if (location_type !== undefined) {
      updateFields.push('location_type = :location_type');
      updateBinds.location_type = location_type;
    }
    if (address !== undefined) {
      updateFields.push('address = :address');
      updateBinds.address = address || null;
    }
    if (city !== undefined) {
      updateFields.push('city = :city');
      updateBinds.city = city || null;
    }
    if (state !== undefined) {
      updateFields.push('state = :state');
      updateBinds.state = state || null;
    }
    if (zip !== undefined) {
      updateFields.push('zip = :zip');
      updateBinds.zip = zip || null;
    }
    if (region !== undefined) {
      updateFields.push('region = :region');
      updateBinds.region = region || null;
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    await execute(
      `UPDATE location 
       SET ${updateFields.join(', ')}
       WHERE location_id = :location_id`,
      updateBinds
    );
    
    // Fetch the updated record from database
    const updatedLocation = await executeOne(
      'SELECT * FROM location WHERE location_id = :location_id',
      { location_id: parseInt(req.params.id) }
    );
    
    if (!updatedLocation) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json(updatedLocation);
  } catch (err) {
    if (err.errorNum === 1400) {
      // NOT NULL constraint violation
      return res.status(400).json({ 
        error: `Required field is missing: ${err.message}` 
      });
    } else if (err.errorNum === 2290) {
      // CHECK constraint violation
      const errorMsg = err.message || '';
      if (errorMsg.includes('CHK_LOCATION_TYPE')) {
        return res.status(400).json({ 
          error: "location_type must be either 'STORE' or 'WAREHOUSE'" 
        });
      } else {
        return res.status(400).json({ 
          error: `Constraint violation: ${errorMsg}` 
        });
      }
    } else {
      console.error('Location update error:', err);
      res.status(500).json({ error: err.message || 'Failed to update location' });
    }
  }
});

// Get location inventory
router.get('/:id/inventory', async (req, res) => {
  try {
    const result = await execute(
      `SELECT i.*, 
              p.name as product_name,
              p.sku as product_sku,
              p.unit_price as product_price
       FROM inventory i
       JOIN product p ON i.product_id = p.product_id
       WHERE i.location_id = :location_id
       ORDER BY p.name`,
      { location_id: parseInt(req.params.id) }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get location orders
router.get('/:id/orders', async (req, res) => {
  try {
    const result = await execute(
      `SELECT o.*, 
              c.first_name || ' ' || c.last_name as customer_name,
              a.account_number
       FROM order_header o
       JOIN customer c ON o.customer_id = c.customer_id
       LEFT JOIN account a ON o.account_id = a.account_id
       WHERE o.location_id = :location_id
       ORDER BY o.order_id DESC`,
      { location_id: parseInt(req.params.id) }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete location
router.delete('/:id', async (req, res) => {
  try {
    await execute('DELETE FROM location WHERE location_id = :id', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    if (err.errorNum === 2292) {
      // Foreign key constraint violation
      res.status(400).json({ error: 'Cannot delete location with existing inventory, orders, or reorders' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;

