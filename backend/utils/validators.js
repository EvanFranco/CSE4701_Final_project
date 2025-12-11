import { executeScalar } from '../db/oracle.js';

// Validation helper functions for foreign keys
// All functions return true if the ID exists, false otherwise
// Returns true for null/undefined (optional fields)

export async function validateLocation(locationId) {
  if (!locationId) return true; // null/undefined is valid (optional field)
  const result = await executeScalar(
    'SELECT COUNT(*) FROM location WHERE location_id = :location_id',
    { location_id: locationId }
  );
  return result > 0;
}

export async function validateProduct(productId) {
  if (!productId) return true; // null/undefined is valid (optional field)
  const result = await executeScalar(
    'SELECT COUNT(*) FROM product WHERE product_id = :product_id',
    { product_id: productId }
  );
  return result > 0;
}

export async function validateManufacturer(manufacturerId) {
  if (!manufacturerId) return true; // null/undefined is valid (optional field)
  const result = await executeScalar(
    'SELECT COUNT(*) FROM manufacturer WHERE manufacturer_id = :manufacturer_id',
    { manufacturer_id: manufacturerId }
  );
  return result > 0;
}

export async function validateOrder(orderId) {
  if (!orderId) return true; // null/undefined is valid (optional field)
  const result = await executeScalar(
    'SELECT COUNT(*) FROM order_header WHERE order_id = :order_id',
    { order_id: orderId }
  );
  return result > 0;
}

export async function validateCustomer(customerId) {
  if (!customerId) return true; // null/undefined is valid (optional field)
  const result = await executeScalar(
    'SELECT COUNT(*) FROM customer WHERE customer_id = :customer_id',
    { customer_id: customerId }
  );
  return result > 0;
}

export async function validateAccount(accountId) {
  if (!accountId) return true; // null/undefined is valid (optional field)
  const result = await executeScalar(
    'SELECT COUNT(*) FROM account WHERE account_id = :account_id',
    { account_id: accountId }
  );
  return result > 0;
}

export async function validateShipper(shipperId) {
  if (!shipperId) return true; // null/undefined is valid (optional field)
  const result = await executeScalar(
    'SELECT COUNT(*) FROM shipper WHERE shipper_id = :shipper_id',
    { shipper_id: shipperId }
  );
  return result > 0;
}

export async function validateCategory(categoryId) {
  if (!categoryId) return true; // null/undefined is valid (optional field)
  const result = await executeScalar(
    'SELECT COUNT(*) FROM category WHERE category_id = :category_id',
    { category_id: categoryId }
  );
  return result > 0;
}

export async function validatePaymentCard(cardId) {
  if (!cardId) return true; // null/undefined is valid (optional field)
  const result = await executeScalar(
    'SELECT COUNT(*) FROM payment_card WHERE card_id = :card_id',
    { card_id: cardId }
  );
  return result > 0;
}

