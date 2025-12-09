-- =====================================================
-- Electronics Vendor Management System
-- Database Schema Creation Script
-- PostgreSQL Version
-- =====================================================

-- Drop tables in reverse dependency order (if needed for clean install)
-- Uncomment the following section if you need to drop existing tables
/*
DROP TABLE IF EXISTS shipment CASCADE;
DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS payment_card CASCADE;
DROP TABLE IF EXISTS order_line CASCADE;
DROP TABLE IF EXISTS order_header CASCADE;
DROP TABLE IF EXISTS reorder CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS bundle_component CASCADE;
DROP TABLE IF EXISTS product_category CASCADE;
DROP TABLE IF EXISTS shipper CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS product CASCADE;
DROP TABLE IF EXISTS category CASCADE;
DROP TABLE IF EXISTS location CASCADE;
DROP TABLE IF EXISTS customer CASCADE;
DROP TABLE IF EXISTS manufacturer CASCADE;
*/

-- =====================================================
-- Table: manufacturer
-- =====================================================
CREATE TABLE manufacturer (
    manufacturer_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(50)
);

-- =====================================================
-- Table: customer
-- =====================================================
CREATE TABLE customer (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    billing_address VARCHAR(200),
    shipping_address VARCHAR(200),
    contract_flag CHAR(1) CHECK (contract_flag IN ('Y','N'))
);

-- =====================================================
-- Table: category
-- =====================================================
CREATE TABLE category (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category_type VARCHAR(20),
    parent_category_id INTEGER
);

-- =====================================================
-- Table: location
-- =====================================================
CREATE TABLE location (
    location_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location_type VARCHAR(20) NOT NULL,
    address VARCHAR(200),
    city VARCHAR(50),
    state VARCHAR(20),
    zip VARCHAR(10),
    region VARCHAR(30),
    CONSTRAINT chk_location_type CHECK (location_type IN ('STORE','WAREHOUSE'))
);

-- =====================================================
-- Table: product
-- =====================================================
CREATE TABLE product (
    product_id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    unit_price NUMERIC(10,2) NOT NULL,
    is_bundle CHAR(1) DEFAULT 'N' CHECK (is_bundle IN ('Y','N')),
    manufacturer_id INTEGER
);

-- =====================================================
-- Table: account
-- =====================================================
CREATE TABLE account (
    account_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    account_number VARCHAR(30) UNIQUE NOT NULL,
    credit_limit NUMERIC(10,2),
    current_balance NUMERIC(10,2),
    opened_date DATE,
    status VARCHAR(20)
);

-- =====================================================
-- Table: product_category
-- =====================================================
CREATE TABLE product_category (
    product_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    CONSTRAINT pk_product_category PRIMARY KEY (product_id, category_id)
);

-- =====================================================
-- Table: bundle_component
-- =====================================================
CREATE TABLE bundle_component (
    bundle_product_id INTEGER NOT NULL,
    component_product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    CONSTRAINT pk_bundle_component PRIMARY KEY (bundle_product_id, component_product_id)
);

-- =====================================================
-- Table: inventory
-- =====================================================
CREATE TABLE inventory (
    location_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity_on_hand INTEGER DEFAULT 0,
    reorder_level INTEGER,
    reorder_quantity INTEGER,
    CONSTRAINT pk_inventory PRIMARY KEY (location_id, product_id)
);

-- =====================================================
-- Table: reorder
-- =====================================================
CREATE TABLE reorder (
    reorder_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    location_id INTEGER NOT NULL,
    manufacturer_id INTEGER NOT NULL,
    order_date DATE NOT NULL,
    expected_date DATE,
    received_date DATE,
    quantity INTEGER NOT NULL,
    status VARCHAR(20)
);

-- =====================================================
-- Table: order_header
-- =====================================================
CREATE TABLE order_header (
    order_id SERIAL PRIMARY KEY,
    order_datetime TIMESTAMP NOT NULL,
    channel VARCHAR(20) NOT NULL,
    customer_id INTEGER NOT NULL,
    account_id INTEGER,
    location_id INTEGER,
    total_amount NUMERIC(10,2),
    status VARCHAR(20),
    CONSTRAINT chk_order_channel CHECK (channel IN ('ONLINE','INSTORE'))
);

-- =====================================================
-- Table: order_line
-- =====================================================
CREATE TABLE order_line (
    order_id INTEGER NOT NULL,
    line_no INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    discount_amount NUMERIC(10,2),
    CONSTRAINT pk_order_line PRIMARY KEY (order_id, line_no)
);

-- =====================================================
-- Table: payment_card
-- =====================================================
CREATE TABLE payment_card (
    card_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    card_type VARCHAR(20),
    masked_number VARCHAR(20),
    expiry_month INTEGER,
    expiry_year INTEGER,
    billing_address VARCHAR(200),
    is_default CHAR(1) CHECK (is_default IN ('Y','N'))
);

-- =====================================================
-- Table: payment
-- =====================================================
CREATE TABLE payment (
    payment_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    card_id INTEGER,
    account_id INTEGER
);

-- =====================================================
-- Table: shipper
-- =====================================================
CREATE TABLE shipper (
    shipper_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    website VARCHAR(200)
);

-- =====================================================
-- Table: shipment
-- =====================================================
CREATE TABLE shipment (
    shipment_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    shipper_id INTEGER NOT NULL,
    tracking_number VARCHAR(50) NOT NULL,
    ship_date DATE,
    delivery_date DATE,
    shipping_address VARCHAR(200)
);

-- =====================================================
-- Foreign Key Constraints
-- =====================================================

-- Account -> Customer
ALTER TABLE account
ADD CONSTRAINT fk_account_customer
FOREIGN KEY (customer_id) REFERENCES customer(customer_id);

-- Product -> Manufacturer
ALTER TABLE product
ADD CONSTRAINT fk_product_manufacturer
FOREIGN KEY (manufacturer_id) REFERENCES manufacturer(manufacturer_id);

-- Category -> Category (self-referencing)
ALTER TABLE category
ADD CONSTRAINT fk_category_parent
FOREIGN KEY (parent_category_id) REFERENCES category(category_id);

-- Product_Category -> Product
ALTER TABLE product_category
ADD CONSTRAINT fk_pc_product
FOREIGN KEY (product_id) REFERENCES product(product_id);

-- Product_Category -> Category
ALTER TABLE product_category
ADD CONSTRAINT fk_pc_category
FOREIGN KEY (category_id) REFERENCES category(category_id);

-- Bundle_Component -> Product (bundle)
ALTER TABLE bundle_component
ADD CONSTRAINT fk_bc_bundle_product
FOREIGN KEY (bundle_product_id) REFERENCES product(product_id);

-- Bundle_Component -> Product (component)
ALTER TABLE bundle_component
ADD CONSTRAINT fk_bc_component_product
FOREIGN KEY (component_product_id) REFERENCES product(product_id);

-- Inventory -> Location
ALTER TABLE inventory
ADD CONSTRAINT fk_inv_location
FOREIGN KEY (location_id) REFERENCES location(location_id);

-- Inventory -> Product
ALTER TABLE inventory
ADD CONSTRAINT fk_inv_product
FOREIGN KEY (product_id) REFERENCES product(product_id);

-- Reorder -> Product
ALTER TABLE reorder
ADD CONSTRAINT fk_reorder_product
FOREIGN KEY (product_id) REFERENCES product(product_id);

-- Reorder -> Location
ALTER TABLE reorder
ADD CONSTRAINT fk_reorder_location
FOREIGN KEY (location_id) REFERENCES location(location_id);

-- Reorder -> Manufacturer
ALTER TABLE reorder
ADD CONSTRAINT fk_reorder_manufacturer
FOREIGN KEY (manufacturer_id) REFERENCES manufacturer(manufacturer_id);

-- Order_Header -> Customer
ALTER TABLE order_header
ADD CONSTRAINT fk_order_customer
FOREIGN KEY (customer_id) REFERENCES customer(customer_id);

-- Order_Header -> Account
ALTER TABLE order_header
ADD CONSTRAINT fk_order_account
FOREIGN KEY (account_id) REFERENCES account(account_id);

-- Order_Header -> Location
ALTER TABLE order_header
ADD CONSTRAINT fk_order_location
FOREIGN KEY (location_id) REFERENCES location(location_id);

-- Order_Line -> Order_Header
ALTER TABLE order_line
ADD CONSTRAINT fk_ol_order
FOREIGN KEY (order_id) REFERENCES order_header(order_id);

-- Order_Line -> Product
ALTER TABLE order_line
ADD CONSTRAINT fk_ol_product
FOREIGN KEY (product_id) REFERENCES product(product_id);

-- Payment_Card -> Customer
ALTER TABLE payment_card
ADD CONSTRAINT fk_pc_customer
FOREIGN KEY (customer_id) REFERENCES customer(customer_id);

-- Payment -> Order_Header
ALTER TABLE payment
ADD CONSTRAINT fk_payment_order
FOREIGN KEY (order_id) REFERENCES order_header(order_id);

-- Payment -> Payment_Card
ALTER TABLE payment
ADD CONSTRAINT fk_payment_card
FOREIGN KEY (card_id) REFERENCES payment_card(card_id);

-- Payment -> Account
ALTER TABLE payment
ADD CONSTRAINT fk_payment_account
FOREIGN KEY (account_id) REFERENCES account(account_id);

-- Shipment -> Order_Header
ALTER TABLE shipment
ADD CONSTRAINT fk_shipment_order
FOREIGN KEY (order_id) REFERENCES order_header(order_id);

-- Shipment -> Shipper
ALTER TABLE shipment
ADD CONSTRAINT fk_shipment_shipper
FOREIGN KEY (shipper_id) REFERENCES shipper(shipper_id);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Indexes on foreign keys for better join performance
CREATE INDEX idx_product_manufacturer ON product(manufacturer_id);
CREATE INDEX idx_account_customer ON account(customer_id);
CREATE INDEX idx_product_category_product ON product_category(product_id);
CREATE INDEX idx_product_category_category ON product_category(category_id);
CREATE INDEX idx_bundle_component_bundle ON bundle_component(bundle_product_id);
CREATE INDEX idx_bundle_component_component ON bundle_component(component_product_id);
CREATE INDEX idx_inventory_location ON inventory(location_id);
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_reorder_product ON reorder(product_id);
CREATE INDEX idx_reorder_location ON reorder(location_id);
CREATE INDEX idx_reorder_manufacturer ON reorder(manufacturer_id);
CREATE INDEX idx_order_header_customer ON order_header(customer_id);
CREATE INDEX idx_order_header_account ON order_header(account_id);
CREATE INDEX idx_order_header_location ON order_header(location_id);
CREATE INDEX idx_order_line_order ON order_line(order_id);
CREATE INDEX idx_order_line_product ON order_line(product_id);
CREATE INDEX idx_payment_card_customer ON payment_card(customer_id);
CREATE INDEX idx_payment_order ON payment(order_id);
CREATE INDEX idx_payment_card ON payment(card_id);
CREATE INDEX idx_payment_account ON payment(account_id);
CREATE INDEX idx_shipment_order ON shipment(order_id);
CREATE INDEX idx_shipment_shipper ON shipment(shipper_id);

-- Indexes on commonly queried columns
CREATE INDEX idx_customer_email ON customer(email);
CREATE INDEX idx_product_sku ON product(sku);
CREATE INDEX idx_account_number ON account(account_number);
CREATE INDEX idx_order_datetime ON order_header(order_datetime);
CREATE INDEX idx_order_channel ON order_header(channel);
CREATE INDEX idx_order_status ON order_header(status);
CREATE INDEX idx_shipment_tracking ON shipment(tracking_number);

-- =====================================================
-- Comments on Tables (Documentation)
-- =====================================================

COMMENT ON TABLE manufacturer IS 'Electronics manufacturers (Sony, Apple, HP, Gateway, etc.)';
COMMENT ON TABLE customer IS 'Customer information with contract flag for monthly billing vs one-time purchases';
COMMENT ON TABLE account IS 'Contract customer accounts with credit limits for monthly billing';
COMMENT ON TABLE product IS 'Electronics product catalog with bundle flag for packaged products';
COMMENT ON TABLE category IS 'Product categories with hierarchy (by type, manufacturer, or other groupings)';
COMMENT ON TABLE product_category IS 'Product-category relationships (supports overlapping categories)';
COMMENT ON TABLE bundle_component IS 'Bundle product components (e.g., PC + monitor + printer)';
COMMENT ON TABLE location IS 'Store and warehouse locations (STORE or WAREHOUSE type)';
COMMENT ON TABLE inventory IS 'Inventory levels by location with reorder levels and quantities';
COMMENT ON TABLE reorder IS 'Reorder requests to manufacturers when inventory is low';
COMMENT ON TABLE order_header IS 'Order information with channel (ONLINE/INSTORE) and status';
COMMENT ON TABLE order_line IS 'Order line items with products, quantities, and pricing';
COMMENT ON TABLE payment_card IS 'Customer payment cards (stored for online customers, not in-store)';
COMMENT ON TABLE payment IS 'Payment transactions (account billing or card payments)';
COMMENT ON TABLE shipper IS 'Shipping companies for online order fulfillment';
COMMENT ON TABLE shipment IS 'Shipment tracking with tracking numbers for customer inquiries';

-- =====================================================
-- End of Schema Creation Script
-- =====================================================

