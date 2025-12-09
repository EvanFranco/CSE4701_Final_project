-- =====================================================
-- Electronics Vendor Management System
-- Database Schema Creation Script
-- MySQL Version
-- =====================================================

-- Drop tables in reverse dependency order (if needed for clean install)
-- Uncomment the following section if you need to drop existing tables
/*
DROP TABLE IF EXISTS shipment;
DROP TABLE IF EXISTS payment;
DROP TABLE IF EXISTS payment_card;
DROP TABLE IF EXISTS order_line;
DROP TABLE IF EXISTS order_header;
DROP TABLE IF EXISTS reorder;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS bundle_component;
DROP TABLE IF EXISTS product_category;
DROP TABLE IF EXISTS shipper;
DROP TABLE IF EXISTS account;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS category;
DROP TABLE IF EXISTS location;
DROP TABLE IF EXISTS customer;
DROP TABLE IF EXISTS manufacturer;
*/

-- =====================================================
-- Table: manufacturer
-- =====================================================
CREATE TABLE manufacturer (
    manufacturer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(50)
) ENGINE=InnoDB;

-- =====================================================
-- Table: customer
-- =====================================================
CREATE TABLE customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    billing_address VARCHAR(200),
    shipping_address VARCHAR(200),
    contract_flag CHAR(1) CHECK (contract_flag IN ('Y','N'))
) ENGINE=InnoDB;

-- =====================================================
-- Table: category
-- =====================================================
CREATE TABLE category (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category_type VARCHAR(20),
    parent_category_id INT
) ENGINE=InnoDB;

-- =====================================================
-- Table: location
-- =====================================================
CREATE TABLE location (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location_type VARCHAR(20) NOT NULL,
    address VARCHAR(200),
    city VARCHAR(50),
    state VARCHAR(20),
    zip VARCHAR(10),
    region VARCHAR(30),
    CONSTRAINT chk_location_type CHECK (location_type IN ('STORE','WAREHOUSE'))
) ENGINE=InnoDB;

-- =====================================================
-- Table: product
-- =====================================================
CREATE TABLE product (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    unit_price DECIMAL(10,2) NOT NULL,
    is_bundle CHAR(1) DEFAULT 'N' CHECK (is_bundle IN ('Y','N')),
    manufacturer_id INT
) ENGINE=InnoDB;

-- =====================================================
-- Table: account
-- =====================================================
CREATE TABLE account (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    account_number VARCHAR(30) UNIQUE NOT NULL,
    credit_limit DECIMAL(10,2),
    current_balance DECIMAL(10,2),
    opened_date DATE,
    status VARCHAR(20)
) ENGINE=InnoDB;

-- =====================================================
-- Table: product_category
-- =====================================================
CREATE TABLE product_category (
    product_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (product_id, category_id)
) ENGINE=InnoDB;

-- =====================================================
-- Table: bundle_component
-- =====================================================
CREATE TABLE bundle_component (
    bundle_product_id INT NOT NULL,
    component_product_id INT NOT NULL,
    quantity INT NOT NULL,
    PRIMARY KEY (bundle_product_id, component_product_id)
) ENGINE=InnoDB;

-- =====================================================
-- Table: inventory
-- =====================================================
CREATE TABLE inventory (
    location_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity_on_hand INT DEFAULT 0,
    reorder_level INT,
    reorder_quantity INT,
    PRIMARY KEY (location_id, product_id)
) ENGINE=InnoDB;

-- =====================================================
-- Table: reorder
-- =====================================================
CREATE TABLE reorder (
    reorder_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    location_id INT NOT NULL,
    manufacturer_id INT NOT NULL,
    order_date DATE NOT NULL,
    expected_date DATE,
    received_date DATE,
    quantity INT NOT NULL,
    status VARCHAR(20)
) ENGINE=InnoDB;

-- =====================================================
-- Table: order_header
-- =====================================================
CREATE TABLE order_header (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    order_datetime DATETIME NOT NULL,
    channel VARCHAR(20) NOT NULL,
    customer_id INT NOT NULL,
    account_id INT,
    location_id INT,
    total_amount DECIMAL(10,2),
    status VARCHAR(20),
    CONSTRAINT chk_order_channel CHECK (channel IN ('ONLINE','INSTORE'))
) ENGINE=InnoDB;

-- =====================================================
-- Table: order_line
-- =====================================================
CREATE TABLE order_line (
    order_id INT NOT NULL,
    line_no INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2),
    PRIMARY KEY (order_id, line_no)
) ENGINE=InnoDB;

-- =====================================================
-- Table: payment_card
-- =====================================================
CREATE TABLE payment_card (
    card_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    card_type VARCHAR(20),
    masked_number VARCHAR(20),
    expiry_month INT,
    expiry_year INT,
    billing_address VARCHAR(200),
    is_default CHAR(1) CHECK (is_default IN ('Y','N'))
) ENGINE=InnoDB;

-- =====================================================
-- Table: payment
-- =====================================================
CREATE TABLE payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    card_id INT,
    account_id INT
) ENGINE=InnoDB;

-- =====================================================
-- Table: shipper
-- =====================================================
CREATE TABLE shipper (
    shipper_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    website VARCHAR(200)
) ENGINE=InnoDB;

-- =====================================================
-- Table: shipment
-- =====================================================
CREATE TABLE shipment (
    shipment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    shipper_id INT NOT NULL,
    tracking_number VARCHAR(50) NOT NULL,
    ship_date DATE,
    delivery_date DATE,
    shipping_address VARCHAR(200)
) ENGINE=InnoDB;

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
-- End of Schema Creation Script
-- =====================================================

