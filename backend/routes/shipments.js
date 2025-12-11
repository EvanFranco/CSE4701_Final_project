import express from 'express';
import { execute, executeOne, executeScalar } from '../db/oracle.js';
import { validateOrder, validateShipper } from '../utils/validators.js';

const router = express.Router();

// Get all shipments
router.get('/', async (req, res) => {
  try {
    const result = await execute(`
      SELECT s.*, 
             oh.order_datetime,
             oh.channel,
             oh.total_amount,
             oh.status as order_status,
             c.first_name || ' ' || c.last_name as customer_name,
             sh.name as shipper_name,
             sh.phone as shipper_phone
      FROM shipment s
      JOIN order_header oh ON s.order_id = oh.order_id
      LEFT JOIN customer c ON oh.customer_id = c.customer_id
      JOIN shipper sh ON s.shipper_id = sh.shipper_id
      ORDER BY s.shipment_id DESC
    `);
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
    
    // Validate foreign keys before inserting
    if (order_id !== null && order_id !== undefined) {
      const orderExists = await validateOrder(order_id);
      if (!orderExists) {
        return res.status(400).json({ 
          error: `Invalid order_id: ${order_id}. Order does not exist.` 
        });
      }
    }
    
    if (shipper_id !== null && shipper_id !== undefined) {
      const shipperExists = await validateShipper(shipper_id);
      if (!shipperExists) {
        return res.status(400).json({ 
          error: `Invalid shipper_id: ${shipper_id}. Shipper does not exist.` 
        });
      }
    }
    
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
    
    // Fetch the created record from database
    const createdShipment = await executeOne(
      'SELECT * FROM shipment WHERE shipment_id = :shipment_id',
      { shipment_id: shipmentId }
    );
    
    res.status(201).json(createdShipment);
  } catch (err) {
    if (err.errorNum === 2291) { // Foreign key constraint violation
      const errorMsg = err.message || '';
      if (errorMsg.includes('FK_SHIPMENT_ORDER')) {
        return res.status(400).json({ 
          error: `Invalid order_id. The specified order does not exist.` 
        });
      } else if (errorMsg.includes('FK_SHIPMENT_SHIPPER')) {
        return res.status(400).json({ 
          error: `Invalid shipper_id. The specified shipper does not exist.` 
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

export default router;

