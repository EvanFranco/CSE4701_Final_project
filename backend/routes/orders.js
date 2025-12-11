import express from 'express';
import { execute, executeOne, executeScalar } from '../db/oracle.js';
import { validateAccount, validateLocation, validateCustomer } from '../utils/validators.js';

const router = express.Router();

// Get all orders
router.get('/', async (req, res) => {
  try {
    const result = await execute(`
      SELECT o.*, 
             c.first_name || ' ' || c.last_name as customer_name,
             c.email as customer_email,
             a.account_number,
             a.current_balance as account_balance,
             a.credit_limit as account_credit_limit,
             l.name as location_name
      FROM order_header o
      LEFT JOIN customer c ON o.customer_id = c.customer_id
      LEFT JOIN account a ON o.account_id = a.account_id
      LEFT JOIN location l ON o.location_id = l.location_id
      ORDER BY o.order_id DESC
    `);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await executeOne(
      `SELECT o.*, 
              c.first_name || ' ' || c.last_name as customer_name,
              c.email as customer_email,
              a.account_number,
              a.current_balance as account_balance,
              a.credit_limit as account_credit_limit,
              l.name as location_name
       FROM order_header o
       LEFT JOIN customer c ON o.customer_id = c.customer_id
       LEFT JOIN account a ON o.account_id = a.account_id
       LEFT JOIN location l ON o.location_id = l.location_id
       WHERE o.order_id = :id`,
      [req.params.id]
    );
    if (!result) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const { order_datetime, channel, customer_id, account_id, location_id, total_amount, status } = req.body;
    
    // Validate required fields
    if (!customer_id) {
      return res.status(400).json({ 
        error: 'customer_id is required' 
      });
    }
    
    if (!channel) {
      return res.status(400).json({ 
        error: 'channel is required' 
      });
    }
    
    // Validate channel value
    if (channel !== 'ONLINE' && channel !== 'INSTORE') {
      return res.status(400).json({ 
        error: "channel must be either 'ONLINE' or 'INSTORE'" 
      });
    }
    
    // Validate customer_id exists
    const customerExists = await validateCustomer(customer_id);
    if (!customerExists) {
      return res.status(400).json({ 
        error: `Invalid customer_id: ${customer_id}. Customer does not exist.` 
      });
    }
    
    // Validate foreign keys before inserting
    if (account_id !== null && account_id !== undefined) {
      const accountExists = await validateAccount(account_id);
      if (!accountExists) {
        return res.status(400).json({ 
          error: `Invalid account_id: ${account_id}. Account does not exist.` 
        });
      }
    }
    
    // Validate location_id if provided (it's optional, can be null or omitted)
    if (location_id !== null && location_id !== undefined) {
      const locationExists = await validateLocation(location_id);
      if (!locationExists) {
        return res.status(400).json({ 
          error: `Invalid location_id: ${location_id}. Location does not exist. Note: location_id is optional and can be omitted or set to null.` 
        });
      }
    }
    
    const orderId = await executeScalar('SELECT seq_order_id.NEXTVAL FROM DUAL');
    
    // Handle datetime - convert from ISO format if needed
    let orderDate = order_datetime;
    if (orderDate && orderDate.includes('T')) {
      // Convert ISO datetime to Oracle format
      orderDate = orderDate.replace('T', ' ').substring(0, 19);
    } else if (!orderDate) {
      // Default to current date/time if not provided
      orderDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
    }
    
    await execute(
      `INSERT INTO order_header (order_id, order_datetime, channel, customer_id, account_id, location_id, total_amount, status)
       VALUES (:order_id, TO_DATE(:order_datetime, 'YYYY-MM-DD HH24:MI:SS'), :channel, :customer_id, :account_id, :location_id, :total_amount, :status)`,
      {
        order_id: orderId,
        order_datetime: orderDate,
        channel: channel,
        customer_id: customer_id,
        account_id: account_id || null,
        location_id: location_id || null,
        total_amount: total_amount || null,
        status: status || 'PENDING'
      }
    );
    
    // If order is linked to an account and has a total_amount, add it to account balance (charge the account)
    if (account_id && total_amount && total_amount > 0) {
      const account = await executeOne(
        'SELECT current_balance, credit_limit FROM account WHERE account_id = :account_id',
        { account_id: account_id }
      );
      
      if (account) {
        const newBalance = (account.current_balance || 0) + total_amount;
        
        // Check if new balance would exceed credit limit (if credit_limit is set)
        if (account.credit_limit !== null && account.credit_limit !== undefined) {
          if (newBalance > account.credit_limit) {
            // Rollback order by deleting it
            await execute('DELETE FROM order_header WHERE order_id = :order_id', { order_id: orderId });
            return res.status(400).json({ 
              error: `Order total (${total_amount}) would exceed credit limit. Credit limit: ${account.credit_limit}, Current balance: ${account.current_balance || 0}, New balance would be: ${newBalance}` 
            });
          }
        }
        
        // Update account balance
        await execute(
          `UPDATE account SET current_balance = :new_balance WHERE account_id = :account_id`,
          {
            new_balance: newBalance,
            account_id: account_id
          }
        );
      }
    }
    
    // Fetch the created record from database
    const createdOrder = await executeOne(
      'SELECT * FROM order_header WHERE order_id = :order_id',
      { order_id: orderId }
    );
    
    res.status(201).json(createdOrder);
  } catch (err) {
    // Handle constraint violations
    if (err.errorNum === 2291) {
      // Foreign key constraint violation
      const errorMsg = err.message || '';
      if (errorMsg.includes('FK_ORDER_ACCOUNT')) {
        return res.status(400).json({ 
          error: `Invalid account_id. The specified account does not exist.` 
        });
      } else if (errorMsg.includes('FK_ORDER_LOCATION')) {
        return res.status(400).json({ 
          error: `Invalid location_id. The specified location does not exist.` 
        });
      } else if (errorMsg.includes('FK_ORDER_CUSTOMER')) {
        return res.status(400).json({ 
          error: `Invalid customer_id. The specified customer does not exist.` 
        });
      } else {
        return res.status(400).json({ 
          error: `Foreign key constraint violation: ${errorMsg}` 
        });
      }
    } else if (err.errorNum === 1400) {
      // NOT NULL constraint violation
      return res.status(400).json({ 
        error: `Required field is missing: ${err.message}` 
      });
    } else if (err.errorNum === 2290) {
      // CHECK constraint violation
      const errorMsg = err.message || '';
      if (errorMsg.includes('CHK_ORDER_CHANNEL')) {
        return res.status(400).json({ 
          error: "channel must be either 'ONLINE' or 'INSTORE'" 
        });
      } else {
        return res.status(400).json({ 
          error: `Constraint violation: ${errorMsg}` 
        });
      }
    } else {
      console.error('Order creation error:', err);
      res.status(500).json({ error: err.message || 'Failed to create order' });
    }
  }
});

// Update order
router.put('/:id', async (req, res) => {
  try {
    const { order_datetime, channel, customer_id, account_id, location_id, total_amount, status } = req.body;
    
    // Validate required fields if provided
    if (customer_id !== undefined && !customer_id) {
      return res.status(400).json({ 
        error: 'customer_id cannot be null' 
      });
    }
    
    if (channel !== undefined) {
      if (!channel) {
        return res.status(400).json({ 
          error: 'channel cannot be null' 
        });
      }
      // Validate channel value
      if (channel !== 'ONLINE' && channel !== 'INSTORE') {
        return res.status(400).json({ 
          error: "channel must be either 'ONLINE' or 'INSTORE'" 
        });
      }
    }
    
    // Validate customer_id exists if provided
    if (customer_id !== undefined && customer_id !== null) {
      const customerExists = await validateCustomer(customer_id);
      if (!customerExists) {
        return res.status(400).json({ 
          error: `Invalid customer_id: ${customer_id}. Customer does not exist.` 
        });
      }
    }
    
    // Validate foreign keys before updating
    if (account_id !== null && account_id !== undefined) {
      const accountExists = await validateAccount(account_id);
      if (!accountExists) {
        return res.status(400).json({ 
          error: `Invalid account_id: ${account_id}. Account does not exist.` 
        });
      }
    }
    
    if (location_id !== null && location_id !== undefined) {
      const locationExists = await validateLocation(location_id);
      if (!locationExists) {
        return res.status(400).json({ 
          error: `Invalid location_id: ${location_id}. Location does not exist.` 
        });
      }
    }
    
    // Handle datetime - convert from ISO format if needed
    let orderDate = order_datetime;
    if (orderDate && orderDate.includes('T')) {
      orderDate = orderDate.replace('T', ' ').substring(0, 19);
    }
    
    // Build dynamic UPDATE query based on provided fields
    const updateFields = [];
    const updateBinds = { order_id: parseInt(req.params.id) };
    
    if (orderDate !== undefined) {
      updateFields.push('order_datetime = TO_DATE(:order_datetime, \'YYYY-MM-DD HH24:MI:SS\')');
      updateBinds.order_datetime = orderDate;
    }
    if (channel !== undefined) {
      updateFields.push('channel = :channel');
      updateBinds.channel = channel;
    }
    if (customer_id !== undefined) {
      updateFields.push('customer_id = :customer_id');
      updateBinds.customer_id = customer_id;
    }
    if (account_id !== undefined) {
      updateFields.push('account_id = :account_id');
      updateBinds.account_id = account_id || null;
    }
    if (location_id !== undefined) {
      updateFields.push('location_id = :location_id');
      updateBinds.location_id = location_id || null;
    }
    if (total_amount !== undefined) {
      updateFields.push('total_amount = :total_amount');
      updateBinds.total_amount = total_amount || null;
    }
    if (status !== undefined) {
      updateFields.push('status = :status');
      updateBinds.status = status || 'PENDING';
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    await execute(
      `UPDATE order_header 
       SET ${updateFields.join(', ')}
       WHERE order_id = :order_id`,
      updateBinds
    );
    
    // Fetch the updated record from database
    const updatedOrder = await executeOne(
      'SELECT * FROM order_header WHERE order_id = :order_id',
      { order_id: parseInt(req.params.id) }
    );
    
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(updatedOrder);
  } catch (err) {
    // Handle constraint violations
    if (err.errorNum === 2291) {
      // Foreign key constraint violation
      const errorMsg = err.message || '';
      if (errorMsg.includes('FK_ORDER_ACCOUNT')) {
        return res.status(400).json({ 
          error: `Invalid account_id. The specified account does not exist.` 
        });
      } else if (errorMsg.includes('FK_ORDER_LOCATION')) {
        return res.status(400).json({ 
          error: `Invalid location_id. The specified location does not exist.` 
        });
      } else if (errorMsg.includes('FK_ORDER_CUSTOMER')) {
        return res.status(400).json({ 
          error: `Invalid customer_id. The specified customer does not exist.` 
        });
      } else {
        return res.status(400).json({ 
          error: `Foreign key constraint violation: ${errorMsg}` 
        });
      }
    } else if (err.errorNum === 1400) {
      // NOT NULL constraint violation
      return res.status(400).json({ 
        error: `Required field is missing: ${err.message}` 
      });
    } else if (err.errorNum === 2290) {
      // CHECK constraint violation
      const errorMsg = err.message || '';
      if (errorMsg.includes('CHK_ORDER_CHANNEL')) {
        return res.status(400).json({ 
          error: "channel must be either 'ONLINE' or 'INSTORE'" 
        });
      } else {
        return res.status(400).json({ 
          error: `Constraint violation: ${errorMsg}` 
        });
      }
    } else {
      console.error('Order update error:', err);
      res.status(500).json({ error: err.message || 'Failed to update order' });
    }
  }
});

// Get order lines for an order
router.get('/:id/lines', async (req, res) => {
  try {
    const result = await execute(
      `SELECT ol.*, 
              p.name as product_name,
              p.sku as product_sku
       FROM order_line ol
       JOIN product p ON ol.product_id = p.product_id
       WHERE ol.order_id = :order_id
       ORDER BY ol.line_no`,
      { order_id: parseInt(req.params.id) }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get payments for an order
router.get('/:id/payments', async (req, res) => {
  try {
    const result = await execute(
      `SELECT p.*, 
              a.account_number,
              pc.masked_number as card_masked_number
       FROM payment p
       LEFT JOIN account a ON p.account_id = a.account_id
       LEFT JOIN payment_card pc ON p.card_id = pc.card_id
       WHERE p.order_id = :order_id
       ORDER BY p.payment_id DESC`,
      { order_id: parseInt(req.params.id) }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get shipments for an order
router.get('/:id/shipments', async (req, res) => {
  try {
    const result = await execute(
      `SELECT s.*, 
              sh.name as shipper_name,
              sh.phone as shipper_phone
       FROM shipment s
       JOIN shipper sh ON s.shipper_id = sh.shipper_id
       WHERE s.order_id = :order_id
       ORDER BY s.shipment_id DESC`,
      { order_id: parseInt(req.params.id) }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get online orders without shipments (pending shipment)
router.get('/online/pending-shipment', async (req, res) => {
  try {
    const result = await execute(
      `SELECT oh.*, 
              c.first_name || ' ' || c.last_name as customer_name,
              c.email as customer_email,
              c.shipping_address,
              a.account_number
       FROM order_header oh
       JOIN customer c ON oh.customer_id = c.customer_id
       LEFT JOIN account a ON oh.account_id = a.account_id
       WHERE oh.channel = 'ONLINE'
         AND oh.order_id NOT IN (SELECT DISTINCT order_id FROM shipment)
       ORDER BY oh.order_datetime DESC`
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete order
router.delete('/:id', async (req, res) => {
  try {
    // Get order details before deletion to reverse account balance if needed
    const order = await executeOne(
      'SELECT account_id, total_amount FROM order_header WHERE order_id = :order_id',
      { order_id: parseInt(req.params.id) }
    );
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Delete the order
    await execute('DELETE FROM order_header WHERE order_id = :id', [req.params.id]);
    
    // If order was linked to an account and had a total_amount, reverse the account balance change
    if (order.account_id && order.total_amount && order.total_amount > 0) {
      const account = await executeOne(
        'SELECT current_balance FROM account WHERE account_id = :account_id',
        { account_id: order.account_id }
      );
      
      if (account) {
        const newBalance = (account.current_balance || 0) - order.total_amount;
        await execute(
          `UPDATE account SET current_balance = :new_balance WHERE account_id = :account_id`,
          {
            new_balance: newBalance,
            account_id: order.account_id
          }
        );
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    if (err.errorNum === 2292) { // Foreign key constraint violation
      res.status(400).json({ error: 'Cannot delete order with existing order lines or payments' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;

