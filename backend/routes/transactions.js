import express from 'express';
import { execute, executeOne } from '../db/oracle.js';

const router = express.Router();

/**
 * POST /api/transactions
 * Body:
 * {
 *   customer_id,
 *   account_id,
 *   location_id,
 *   product_id,
 *   quantity
 * }
 */
router.post('/', async (req, res) => {
  const { customer_id, account_id, location_id, product_id, quantity } = req.body;

  // Basic validation of required fields
  if (!customer_id || !account_id || !location_id || !product_id || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Load the account
    const account = await executeOne(
      'SELECT current_balance FROM account WHERE account_id = :id',
      [account_id]
    );
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // 2. Load the product to get unit_price
    const product = await executeOne(
      'SELECT unit_price FROM product WHERE product_id = :id',
      [product_id]
    );
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // 3. Load inventory at the given location
    const inventory = await executeOne(
      `SELECT quantity_on_hand
         FROM inventory
        WHERE location_id = :loc
          AND product_id = :prod`,
      [location_id, product_id]
    );
    if (!inventory) {
      return res.status(404).json({ error: 'Inventory record not found for this location/product' });
    }

    const qty = Number(quantity);
    const unitPrice = Number(product.unit_price);
    const totalCost = unitPrice * qty;

    // 4. Check inventory availability
    if (inventory.quantity_on_hand < qty) {
      return res.status(400).json({ error: 'Not enough quantity on hand' });
    }

    // 5. Check account balance (here: simple “stored value” model)
    if (account.current_balance < totalCost) {
      return res.status(400).json({ error: 'Insufficient account balance' });
    }

    // 6. Subtract from account balance
    await execute(
      `UPDATE account 
          SET current_balance = current_balance - :amount 
        WHERE account_id = :id`,
      [totalCost, account_id]
    );

    // 7. Subtract from inventory
    await execute(
      `UPDATE inventory
          SET quantity_on_hand = quantity_on_hand - :qty
        WHERE location_id = :loc
          AND product_id  = :prod`,
      [qty, location_id, product_id]
    );

    // 8. Return updated info
    const updatedAccount = await executeOne(
      'SELECT * FROM account WHERE account_id = :id',
      [account_id]
    );
    const updatedInventory = await executeOne(
      'SELECT * FROM inventory WHERE location_id = :loc AND product_id = :prod',
      [location_id, product_id]
    );

    res.status(201).json({
      message: 'Transaction completed successfully',
      total_cost: totalCost,
      account: updatedAccount,
      inventory: updatedInventory
    });
  } catch (err) {
    console.error('Transaction error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
