import express from 'express';
import { execute, executeOne, executeScalar } from '../db/oracle.js';

const router = express.Router();

// Get all shipments
router.get('/', async (req, res) => {
  try {
    const result = await execute('SELECT * FROM shipment ORDER BY shipment_id DESC');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get shipment by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await executeOne(
      'SELECT * FROM shipment WHERE shipment_id = :id',
      [req.params.id]
    );
    if (!result) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new shipment
router.post('/', async (req, res) => {
  try {
    const { order_id, shipper_id, tracking_number, ship_date, delivery_date, shipping_address } = req.body;
    
    const shipmentId = await executeScalar('SELECT seq_shipment_id.NEXTVAL FROM DUAL');
    
    await execute(
      `INSERT INTO shipment (shipment_id, order_id, shipper_id, tracking_number, ship_date, delivery_date, shipping_address)
       VALUES (:shipment_id, :order_id, :shipper_id, :tracking_number, 
               TO_DATE(:ship_date, 'YYYY-MM-DD'), TO_DATE(:delivery_date, 'YYYY-MM-DD'), :shipping_address)`,
      {
        shipment_id: shipmentId,
        order_id: order_id,
        shipper_id: shipper_id,
        tracking_number: tracking_number,
        ship_date: ship_date || null,
        delivery_date: delivery_date || null,
        shipping_address: shipping_address || null
      }
    );
    
    res.status(201).json({ shipment_id: shipmentId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

