-- =====================================================
-- Migration Script: Add Authentication Features
-- This script adds missing columns and tables to an existing database
-- Safe to run multiple times - handles existing objects gracefully
-- =====================================================

SET SERVEROUTPUT ON;

-- Add password column to customer table (if it doesn't exist)
BEGIN
   EXECUTE IMMEDIATE 'ALTER TABLE customer ADD password VARCHAR2(255)';
   DBMS_OUTPUT.PUT_LINE('Added password column to customer table');
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE = -1430 THEN -- column already exists
         DBMS_OUTPUT.PUT_LINE('password column already exists in customer table');
      ELSE
         RAISE;
      END IF;
END;
/

-- Add created_date column to customer table (if it doesn't exist)
BEGIN
   EXECUTE IMMEDIATE 'ALTER TABLE customer ADD created_date DATE DEFAULT SYSDATE';
   DBMS_OUTPUT.PUT_LINE('Added created_date column to customer table');
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE = -1430 THEN -- column already exists
         DBMS_OUTPUT.PUT_LINE('created_date column already exists in customer table');
      ELSE
         RAISE;
      END IF;
END;
/

-- Create employee table (if it doesn't exist)
BEGIN
   EXECUTE IMMEDIATE '
   CREATE TABLE employee (
       employee_id NUMBER(10) PRIMARY KEY,
       warehouse_id NUMBER(10) NOT NULL,
       first_name VARCHAR2(50) NOT NULL,
       last_name VARCHAR2(50) NOT NULL,
       email VARCHAR2(100) UNIQUE NOT NULL,
       password VARCHAR2(255) NOT NULL,
       role VARCHAR2(20) DEFAULT ''STAFF'' CHECK (role IN (''ADMIN'', ''MANAGER'', ''STAFF'')),
       created_date DATE DEFAULT SYSDATE,
       status VARCHAR2(20) DEFAULT ''ACTIVE'' CHECK (status IN (''ACTIVE'', ''INACTIVE''))
   )';
   DBMS_OUTPUT.PUT_LINE('Created employee table');
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE = -955 THEN -- table already exists
         DBMS_OUTPUT.PUT_LINE('employee table already exists');
      ELSE
         RAISE;
      END IF;
END;
/

-- Add foreign key for employee -> location (if it doesn't exist)
BEGIN
   EXECUTE IMMEDIATE 'ALTER TABLE employee ADD CONSTRAINT fk_employee_warehouse FOREIGN KEY (warehouse_id) REFERENCES location(location_id)';
   DBMS_OUTPUT.PUT_LINE('Added foreign key fk_employee_warehouse');
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE = -2260 OR SQLCODE = -2275 THEN -- constraint already exists
         DBMS_OUTPUT.PUT_LINE('Foreign key fk_employee_warehouse already exists');
      ELSE
         RAISE;
      END IF;
END;
/

-- Create employee sequence (if it doesn't exist)
BEGIN
   EXECUTE IMMEDIATE 'CREATE SEQUENCE seq_employee_id START WITH 1 INCREMENT BY 1';
   DBMS_OUTPUT.PUT_LINE('Created seq_employee_id sequence');
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE = -955 THEN -- sequence already exists
         DBMS_OUTPUT.PUT_LINE('seq_employee_id sequence already exists');
      ELSE
         RAISE;
      END IF;
END;
/

-- Create indexes (if they don't exist)
BEGIN
   EXECUTE IMMEDIATE 'CREATE INDEX idx_employee_warehouse ON employee(warehouse_id)';
   DBMS_OUTPUT.PUT_LINE('Created idx_employee_warehouse index');
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE = -955 THEN -- index already exists
         DBMS_OUTPUT.PUT_LINE('idx_employee_warehouse index already exists');
      ELSE
         RAISE;
      END IF;
END;
/

BEGIN
   EXECUTE IMMEDIATE 'CREATE INDEX idx_employee_email ON employee(email)';
   DBMS_OUTPUT.PUT_LINE('Created idx_employee_email index');
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE = -955 THEN
         DBMS_OUTPUT.PUT_LINE('idx_employee_email index already exists');
      ELSE
         RAISE;
      END IF;
END;
/

-- Create or replace purchase history view
CREATE OR REPLACE VIEW customer_purchase_history AS
SELECT 
    c.customer_id,
    c.email,
    c.first_name || ' ' || c.last_name AS customer_name,
    oh.order_id,
    oh.order_datetime,
    oh.channel,
    oh.total_amount,
    oh.status AS order_status,
    ol.product_id,
    p.name AS product_name,
    p.sku,
    ol.quantity,
    ol.unit_price,
    ol.discount_amount,
    l.name AS warehouse_name,
    l.location_type
FROM customer c
JOIN order_header oh ON c.customer_id = oh.customer_id
JOIN order_line ol ON oh.order_id = ol.order_id
JOIN product p ON ol.product_id = p.product_id
LEFT JOIN location l ON oh.location_id = l.location_id
ORDER BY oh.order_datetime DESC;

DBMS_OUTPUT.PUT_LINE('Created/updated customer_purchase_history view');

COMMIT;

-- =====================================================
-- Migration Complete
-- =====================================================
-- Verify the changes:
-- SELECT column_name FROM user_tab_columns WHERE table_name = 'CUSTOMER' AND column_name IN ('PASSWORD', 'CREATED_DATE');
-- SELECT table_name FROM user_tables WHERE table_name = 'EMPLOYEE';
-- SELECT view_name FROM user_views WHERE view_name = 'CUSTOMER_PURCHASE_HISTORY';

