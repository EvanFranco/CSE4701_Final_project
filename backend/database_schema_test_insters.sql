-- =====================================================
-- Sample Data for Electronics Vendor Management System
-- Run this script to populate your database with test data
-- =====================================================

-- Insert Manufacturers
INSERT INTO manufacturer (manufacturer_id, name, country)
VALUES (seq_manufacturer_id.NEXTVAL, 'Samsung Electronics', 'South Korea');
COMMIT;

INSERT INTO manufacturer (manufacturer_id, name, country)
VALUES (seq_manufacturer_id.NEXTVAL, 'Apple Inc.', 'United States');
COMMIT;

INSERT INTO manufacturer (manufacturer_id, name, country)
VALUES (seq_manufacturer_id.NEXTVAL, 'Sony Corporation', 'Japan');
COMMIT;

INSERT INTO manufacturer (manufacturer_id, name, country)
VALUES (seq_manufacturer_id.NEXTVAL, 'LG Electronics', 'South Korea');
COMMIT;

-- Insert Customers
INSERT INTO customer (customer_id, first_name, last_name, email, phone, billing_address, shipping_address, contract_flag)
VALUES (seq_customer_id.NEXTVAL, 'John', 'Doe', 'john.doe@example.com', '555-0100', 
        '123 Main St, New York, NY 10001', '123 Main St, New York, NY 10001', 'Y');
COMMIT;

INSERT INTO customer (customer_id, first_name, last_name, email, phone, billing_address, shipping_address, contract_flag)
VALUES (seq_customer_id.NEXTVAL, 'Jane', 'Smith', 'jane.smith@example.com', '555-0101',
        '456 Oak Ave, Los Angeles, CA 90001', '456 Oak Ave, Los Angeles, CA 90001', 'N');
COMMIT;

INSERT INTO customer (customer_id, first_name, last_name, email, phone, billing_address, shipping_address, contract_flag)
VALUES (seq_customer_id.NEXTVAL, 'Bob', 'Johnson', 'bob.johnson@example.com', '555-0102',
        '789 Pine Rd, Chicago, IL 60601', '789 Pine Rd, Chicago, IL 60601', 'Y');
COMMIT;

-- Insert Locations
INSERT INTO location (location_id, name, location_type, address, city, state, zip, region)
VALUES (seq_location_id.NEXTVAL, 'Main Store', 'STORE', '123 Main St', 'New York', 'NY', '10001', 'Northeast');
COMMIT;

INSERT INTO location (location_id, name, location_type, address, city, state, zip, region)
VALUES (seq_location_id.NEXTVAL, 'West Coast Warehouse', 'WAREHOUSE', '456 Warehouse Blvd', 'Los Angeles', 'CA', '90001', 'West');
COMMIT;

INSERT INTO location (location_id, name, location_type, address, city, state, zip, region)
VALUES (seq_location_id.NEXTVAL, 'Chicago Store', 'STORE', '789 Michigan Ave', 'Chicago', 'IL', '60601', 'Midwest');
COMMIT;

-- Insert Categories
INSERT INTO category (category_id, name, category_type, parent_category_id)
VALUES (seq_category_id.NEXTVAL, 'Electronics', 'MAIN', NULL);
COMMIT;

INSERT INTO category (category_id, name, category_type, parent_category_id)
VALUES (seq_category_id.NEXTVAL, 'Televisions', 'SUBCATEGORY', 
        (SELECT category_id FROM category WHERE name = 'Electronics'));
COMMIT;

INSERT INTO category (category_id, name, category_type, parent_category_id)
VALUES (seq_category_id.NEXTVAL, 'Smartphones', 'SUBCATEGORY',
        (SELECT category_id FROM category WHERE name = 'Electronics'));
COMMIT;

-- Insert Products
INSERT INTO product (product_id, sku, name, description, unit_price, is_bundle, manufacturer_id)
VALUES (seq_product_id.NEXTVAL, 'SAM-TV-001', 'Samsung 55" 4K Smart TV', 
        '55-inch 4K UHD Smart TV with HDR', 599.99, 'N',
        (SELECT manufacturer_id FROM manufacturer WHERE name = 'Samsung Electronics'));
COMMIT;

INSERT INTO product (product_id, sku, name, description, unit_price, is_bundle, manufacturer_id)
VALUES (seq_product_id.NEXTVAL, 'APP-PHONE-001', 'iPhone 15 Pro', 
        'Latest iPhone with A17 Pro chip', 999.99, 'N',
        (SELECT manufacturer_id FROM manufacturer WHERE name = 'Apple Inc.'));
COMMIT;

INSERT INTO product (product_id, sku, name, description, unit_price, is_bundle, manufacturer_id)
VALUES (seq_product_id.NEXTVAL, 'SONY-TV-001', 'Sony 65" OLED TV',
        '65-inch OLED 4K HDR TV', 1299.99, 'N',
        (SELECT manufacturer_id FROM manufacturer WHERE name = 'Sony Corporation'));
COMMIT;

INSERT INTO product (product_id, sku, name, description, unit_price, is_bundle, manufacturer_id)
VALUES (seq_product_id.NEXTVAL, 'LG-TV-001', 'LG 50" LED TV',
        '50-inch LED 4K Smart TV', 449.99, 'N',
        (SELECT manufacturer_id FROM manufacturer WHERE name = 'LG Electronics'));
COMMIT;

-- Insert Accounts
INSERT INTO account (account_id, customer_id, account_number, credit_limit, current_balance, opened_date, status)
VALUES (seq_account_id.NEXTVAL,
        (SELECT customer_id FROM customer WHERE email = 'john.doe@example.com'),
        'ACC-' || TO_CHAR(SYSDATE, 'YYYYMMDD') || '-001',
        5000.00, 0.00, SYSDATE, 'ACTIVE');
COMMIT;

INSERT INTO account (account_id, customer_id, account_number, credit_limit, current_balance, opened_date, status)
VALUES (seq_account_id.NEXTVAL,
        (SELECT customer_id FROM customer WHERE email = 'bob.johnson@example.com'),
        'ACC-' || TO_CHAR(SYSDATE, 'YYYYMMDD') || '-002',
        3000.00, 0.00, SYSDATE, 'ACTIVE');
COMMIT;

-- Insert Shippers
INSERT INTO shipper (shipper_id, name, phone, website)
VALUES (seq_shipper_id.NEXTVAL, 'FedEx', '1-800-463-3339', 'https://www.fedex.com');
COMMIT;

INSERT INTO shipper (shipper_id, name, phone, website)
VALUES (seq_shipper_id.NEXTVAL, 'UPS', '1-800-742-5877', 'https://www.ups.com');
COMMIT;

INSERT INTO shipper (shipper_id, name, phone, website)
VALUES (seq_shipper_id.NEXTVAL, 'USPS', '1-800-275-8777', 'https://www.usps.com');
COMMIT;

-- Insert Inventory
INSERT INTO inventory (location_id, product_id, quantity_on_hand, reorder_point, reorder_quantity)
VALUES (
        (SELECT location_id FROM location WHERE name = 'Main Store'),
        (SELECT product_id FROM product WHERE sku = 'SAM-TV-001'),
        25, 10, 50
);
COMMIT;

INSERT INTO inventory (location_id, product_id, quantity_on_hand, reorder_point, reorder_quantity)
VALUES (
        (SELECT location_id FROM location WHERE name = 'Main Store'),
        (SELECT product_id FROM product WHERE sku = 'APP-PHONE-001'),
        15, 5, 20
);
COMMIT;

INSERT INTO inventory (location_id, product_id, quantity_on_hand, reorder_point, reorder_quantity)
VALUES (
        (SELECT location_id FROM location WHERE name = 'West Coast Warehouse'),
        (SELECT product_id FROM product WHERE sku = 'SONY-TV-001'),
        30, 15, 40
);
COMMIT;

-- Insert Product Categories
INSERT INTO product_category (product_id, category_id)
VALUES (
        (SELECT product_id FROM product WHERE sku = 'SAM-TV-001'),
        (SELECT category_id FROM category WHERE name = 'Televisions')
);
COMMIT;

INSERT INTO product_category (product_id, category_id)
VALUES (
        (SELECT product_id FROM product WHERE sku = 'SONY-TV-001'),
        (SELECT category_id FROM category WHERE name = 'Televisions')
);
COMMIT;

INSERT INTO product_category (product_id, category_id)
VALUES (
        (SELECT product_id FROM product WHERE sku = 'LG-TV-001'),
        (SELECT category_id FROM category WHERE name = 'Televisions')
);
COMMIT;

INSERT INTO product_category (product_id, category_id)
VALUES (
        (SELECT product_id FROM product WHERE sku = 'APP-PHONE-001'),
        (SELECT category_id FROM category WHERE name = 'Smartphones')
);
COMMIT;

-- Verify data was inserted
SELECT 'Manufacturers' AS table_name, COUNT(*) AS count FROM manufacturer
UNION ALL SELECT 'Customers', COUNT(*) FROM customer
UNION ALL SELECT 'Locations', COUNT(*) FROM location
UNION ALL SELECT 'Categories', COUNT(*) FROM category
UNION ALL SELECT 'Products', COUNT(*) FROM product
UNION ALL SELECT 'Accounts', COUNT(*) FROM account
UNION ALL SELECT 'Shippers', COUNT(*) FROM shipper
UNION ALL SELECT 'Inventory', COUNT(*) FROM inventory
ORDER BY table_name;
