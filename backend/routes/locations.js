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
      { id: req.params.id }
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
    
    res.status(201).json({ location_id: locationId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update location
router.put('/:id', async (req, res) => {
  try {
    const { name, location_type, address, city, state, zip, region } = req.body;
    
    await execute(
      `UPDATE location 
       SET name = :name, location_type = :location_type, address = :address, 
           city = :city, state = :state, zip = :zip, region = :region
       WHERE location_id = :location_id`,
      {
        location_id: parseInt(req.params.id),
        name: name,
        location_type: location_type,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        region: region || null
      }
    );
    
    res.json({ location_id: parseInt(req.params.id), ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

