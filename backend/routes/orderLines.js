import express from 'express';
import { execute, executeOne, executeScalar } from '../db/oracle.js';
import { validateOrder, validateProduct } from '../utils/validators.js';

const router = express.Router();

// Get all order lines
router.get('/', async (req, res) => {
  try {
    const result = await execute(`
      SELECT ol.*, 
             p.name as product_name,
             p.sku as product_sku,
             o.order_datetime,
             o.total_amount as order_total
      FROM order_line ol
      JOIN product p ON ol.product_id = p.product_id
      JOIN order_header o ON ol.order_id = o.order_id
      ORDER BY ol.order_id, ol.line_no
    `);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get order lines by order ID
router.get('/order/:orderId', async (req, res) => {
  try {
    const result = await execute(`
      SELECT ol.*, 
             p.name as product_name,
             p.sku as product_sku,
             p.unit_price as product_unit_price
      FROM order_line ol
      JOIN product p ON ol.product_id = p.product_id
      WHERE ol.order_id = :order_id
      ORDER BY ol.line_no
    `, { order_id: parseInt(req.params.orderId) });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific order line
router.get('/:orderId/:lineNo', async (req, res) => {
  try {
    const result = await executeOne(
      `SELECT ol.*, 
              p.name as product_name,
              p.sku as product_sku,
              o.order_datetime,
              o.total_amount as order_total
       FROM order_line ol
       JOIN product p ON ol.product_id = p.product_id
       JOIN order_header o ON ol.order_id = o.order_id
       WHERE ol.order_id = :order_id AND ol.line_no = :line_no`,
      {
        order_id: parseInt(req.params.orderId),
        line_no: parseInt(req.params.lineNo)
      }
    );
    if (!result) {
      return res.status(404).json({ error: 'Order line not found' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new order line
router.post('/', async (req, res) => {
  try {
    const { order_id, line_no, product_id, quantity, unit_price, discount_amount } = req.body;
    
    // Validate required fields
    if (!order_id) {
      return res.status(400).json({ error: 'order_id is required' });
    }
    if (!product_id) {
      return res.status(400).json({ error: 'product_id is required' });
    }
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'quantity must be greater than 0' });
    }
    
    // Validate foreign keys
    const orderExists = await validateOrder(order_id);
    if (!orderExists) {
      return res.status(400).json({ 
        error: `Invalid order_id: ${order_id}. Order does not exist.` 
      });
    }
    
    const productExists = await validateProduct(product_id);
    if (!productExists) {
      return res.status(400).json({ 
        error: `Invalid product_id: ${product_id}. Product does not exist.` 
      });
    }
    
    // Get product price if unit_price not provided
    let finalUnitPrice = unit_price;
    if (!finalUnitPrice) {
      const product = await executeOne(
        'SELECT unit_price FROM product WHERE product_id = :product_id',
        { product_id: product_id }
      );
      if (product) {
        finalUnitPrice = product.unit_price;
      } else {
        return res.status(400).json({ error: 'unit_price is required if product has no default price' });
      }
    }
    
    // Get next line number if not provided
    let finalLineNo = line_no;
    if (!finalLineNo) {
      const maxLine = await executeScalar(
        'SELECT NVL(MAX(line_no), 0) FROM order_line WHERE order_id = :order_id',
        { order_id: order_id }
      );
      finalLineNo = maxLine + 1;
    }
    
    await execute(
      `INSERT INTO order_line (order_id, line_no, product_id, quantity, unit_price, discount_amount)
       VALUES (:order_id, :line_no, :product_id, :quantity, :unit_price, :discount_amount)`,
      {
        order_id: order_id,
        line_no: finalLineNo,
        product_id: product_id,
        quantity: quantity,
        unit_price: finalUnitPrice,
        discount_amount: discount_amount || null
      }
    );
    
    // Recalculate order total from all order lines
    const orderTotal = await executeScalar(
      `SELECT NVL(SUM((quantity * unit_price) - NVL(discount_amount, 0)), 0)
       FROM order_line
       WHERE order_id = :order_id`,
      { order_id: order_id }
    );
    
    // Update order total_amount
    await execute(
      'UPDATE order_header SET total_amount = :total_amount WHERE order_id = :order_id',
      {
        total_amount: orderTotal,
        order_id: order_id
      }
    );
    
    // If order has account_id, update account balance
    const order = await executeOne(
      'SELECT account_id, total_amount FROM order_header WHERE order_id = :order_id',
      { order_id: order_id }
    );
    
    if (order && order.account_id) {
      const account = await executeOne(
        'SELECT current_balance, credit_limit FROM account WHERE account_id = :account_id',
        { account_id: order.account_id }
      );
      
      if (account) {
        // Calculate the difference in order total
        const oldTotal = order.total_amount || 0;
        const newTotal = orderTotal;
        const difference = newTotal - oldTotal;
        
        if (difference !== 0) {
          const newBalance = (account.current_balance || 0) + difference;
          
          // Check credit limit
          if (account.credit_limit !== null && account.credit_limit !== undefined) {
            if (newBalance > account.credit_limit) {
              // Rollback order line
              await execute(
                'DELETE FROM order_line WHERE order_id = :order_id AND line_no = :line_no',
                { order_id: order_id, line_no: finalLineNo }
              );
              return res.status(400).json({ 
                error: `Adding this item would exceed credit limit. Credit limit: ${account.credit_limit}, Current balance: ${account.current_balance || 0}, New balance would be: ${newBalance}` 
              });
            }
          }
          
          // Update account balance
          await execute(
            `UPDATE account SET current_balance = :new_balance WHERE account_id = :account_id`,
            {
              new_balance: newBalance,
              account_id: order.account_id
            }
          );
        }
      }
    }
    
    // Fetch the created record
    const createdLine = await executeOne(
      `SELECT ol.*, p.name as product_name, p.sku as product_sku
       FROM order_line ol
       JOIN product p ON ol.product_id = p.product_id
       WHERE ol.order_id = :order_id AND ol.line_no = :line_no`,
      {
        order_id: order_id,
        line_no: finalLineNo
      }
    );
    
    res.status(201).json(createdLine);
  } catch (err) {
    if (err.errorNum === 1) {
      res.status(400).json({ error: 'Order line already exists for this order and line number' });
    } else if (err.errorNum === 2291) {
      const errorMsg = err.message || '';
      if (errorMsg.includes('FK_OL_ORDER')) {
        return res.status(400).json({ 
          error: `Invalid order_id. The specified order does not exist.` 
        });
      } else if (errorMsg.includes('FK_OL_PRODUCT')) {
        return res.status(400).json({ 
          error: `Invalid product_id. The specified product does not exist.` 
        });
      } else {
        return res.status(400).json({ 
          error: `Foreign key constraint violation: ${errorMsg}` 
        });
      }
    } else {
      console.error('Order line creation error:', err);
      res.status(500).json({ error: err.message || 'Failed to create order line' });
    }
  }
});

// Update order line
router.put('/:orderId/:lineNo', async (req, res) => {
  try {
    const { product_id, quantity, unit_price, discount_amount } = req.body;
    
    // Get existing order line
    const existingLine = await executeOne(
      'SELECT * FROM order_line WHERE order_id = :order_id AND line_no = :line_no',
      {
        order_id: parseInt(req.params.orderId),
        line_no: parseInt(req.params.lineNo)
      }
    );
    
    if (!existingLine) {
      return res.status(404).json({ error: 'Order line not found' });
    }
    
    // Validate product if provided
    if (product_id !== undefined && product_id !== null) {
      const productExists = await validateProduct(product_id);
      if (!productExists) {
        return res.status(400).json({ 
          error: `Invalid product_id: ${product_id}. Product does not exist.` 
        });
      }
    }
    
    const updateFields = [];
    const updateBinds = {
      order_id: parseInt(req.params.orderId),
      line_no: parseInt(req.params.lineNo)
    };
    
    if (product_id !== undefined) {
      updateFields.push('product_id = :product_id');
      updateBinds.product_id = product_id;
    }
    if (quantity !== undefined) {
      if (quantity <= 0) {
        return res.status(400).json({ error: 'quantity must be greater than 0' });
      }
      updateFields.push('quantity = :quantity');
      updateBinds.quantity = quantity;
    }
    if (unit_price !== undefined) {
      updateFields.push('unit_price = :unit_price');
      updateBinds.unit_price = unit_price;
    }
    if (discount_amount !== undefined) {
      updateFields.push('discount_amount = :discount_amount');
      updateBinds.discount_amount = discount_amount || null;
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    await execute(
      `UPDATE order_line 
       SET ${updateFields.join(', ')}
       WHERE order_id = :order_id AND line_no = :line_no`,
      updateBinds
    );
    
    // Recalculate order total
    const orderTotal = await executeScalar(
      `SELECT NVL(SUM((quantity * unit_price) - NVL(discount_amount, 0)), 0)
       FROM order_line
       WHERE order_id = :order_id`,
      { order_id: parseInt(req.params.orderId) }
    );
    
    await execute(
      'UPDATE order_header SET total_amount = :total_amount WHERE order_id = :order_id',
      {
        total_amount: orderTotal,
        order_id: parseInt(req.params.orderId)
      }
    );
    
    // Update account balance if order has account
    const order = await executeOne(
      'SELECT account_id FROM order_header WHERE order_id = :order_id',
      { order_id: parseInt(req.params.orderId) }
    );
    
    if (order && order.account_id) {
      const account = await executeOne(
        'SELECT current_balance, credit_limit FROM account WHERE account_id = :account_id',
        { account_id: order.account_id }
      );
      
      if (account) {
        const oldTotal = existingLine.quantity * existingLine.unit_price - (existingLine.discount_amount || 0);
        const newQty = quantity !== undefined ? quantity : existingLine.quantity;
        const newPrice = unit_price !== undefined ? unit_price : existingLine.unit_price;
        const newDiscount = discount_amount !== undefined ? discount_amount : existingLine.discount_amount || 0;
        const newTotal = newQty * newPrice - newDiscount;
        const difference = newTotal - oldTotal;
        
        if (difference !== 0) {
          const newBalance = (account.current_balance || 0) + difference;
          
          if (account.credit_limit !== null && account.credit_limit !== undefined) {
            if (newBalance > account.credit_limit) {
              // Rollback update
              await execute(
                `UPDATE order_line 
                 SET product_id = :product_id, quantity = :quantity, unit_price = :unit_price, discount_amount = :discount_amount
                 WHERE order_id = :order_id AND line_no = :line_no`,
                {
                  order_id: parseInt(req.params.orderId),
                  line_no: parseInt(req.params.lineNo),
                  product_id: existingLine.product_id,
                  quantity: existingLine.quantity,
                  unit_price: existingLine.unit_price,
                  discount_amount: existingLine.discount_amount
                }
              );
              return res.status(400).json({ 
                error: `Update would exceed credit limit. Credit limit: ${account.credit_limit}, Current balance: ${account.current_balance || 0}` 
              });
            }
          }
          
          await execute(
            `UPDATE account SET current_balance = :new_balance WHERE account_id = :account_id`,
            {
              new_balance: newBalance,
              account_id: order.account_id
            }
          );
        }
      }
    }
    
    // Fetch updated record
    const updatedLine = await executeOne(
      `SELECT ol.*, p.name as product_name, p.sku as product_sku
       FROM order_line ol
       JOIN product p ON ol.product_id = p.product_id
       WHERE ol.order_id = :order_id AND ol.line_no = :line_no`,
      {
        order_id: parseInt(req.params.orderId),
        line_no: parseInt(req.params.lineNo)
      }
    );
    
    res.json(updatedLine);
  } catch (err) {
    console.error('Order line update error:', err);
    res.status(500).json({ error: err.message || 'Failed to update order line' });
  }
});

// Delete order line
router.delete('/:orderId/:lineNo', async (req, res) => {
  try {
    // Get order line details before deletion
    const orderLine = await executeOne(
      'SELECT * FROM order_line WHERE order_id = :order_id AND line_no = :line_no',
      {
        order_id: parseInt(req.params.orderId),
        line_no: parseInt(req.params.lineNo)
      }
    );
    
    if (!orderLine) {
      return res.status(404).json({ error: 'Order line not found' });
    }
    
    // Delete the order line
    await execute(
      'DELETE FROM order_line WHERE order_id = :order_id AND line_no = :line_no',
      {
        order_id: parseInt(req.params.orderId),
        line_no: parseInt(req.params.lineNo)
      }
    );
    
    // Recalculate order total
    const orderTotal = await executeScalar(
      `SELECT NVL(SUM((quantity * unit_price) - NVL(discount_amount, 0)), 0)
       FROM order_line
       WHERE order_id = :order_id`,
      { order_id: parseInt(req.params.orderId) }
    );
    
    await execute(
      'UPDATE order_header SET total_amount = :total_amount WHERE order_id = :order_id',
      {
        total_amount: orderTotal,
        order_id: parseInt(req.params.orderId)
      }
    );
    
    // Update account balance if order has account
    const order = await executeOne(
      'SELECT account_id FROM order_header WHERE order_id = :order_id',
      { order_id: parseInt(req.params.orderId) }
    );
    
    if (order && order.account_id) {
      const lineTotal = orderLine.quantity * orderLine.unit_price - (orderLine.discount_amount || 0);
      const account = await executeOne(
        'SELECT current_balance FROM account WHERE account_id = :account_id',
        { account_id: order.account_id }
      );
      
      if (account) {
        const newBalance = (account.current_balance || 0) - lineTotal;
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
    res.status(500).json({ error: err.message });
  }
});

export default router;



