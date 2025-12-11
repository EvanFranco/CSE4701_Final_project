-- =====================================================
-- Database Clear/Reset Script
-- Electronics Vendor Management System
-- Oracle SQL
-- =====================================================
-- This script drops all tables, sequences, and indexes
-- Safe to run multiple times (idempotent)
-- =====================================================

SET SERVEROUTPUT ON;

BEGIN
  DBMS_OUTPUT.PUT_LINE('Starting database clear...');
END;
/

-- =====================================================
-- Drop Tables (in reverse dependency order)
-- =====================================================

BEGIN
  -- Drop child tables first
  EXECUTE IMMEDIATE 'DROP TABLE shipment CASCADE CONSTRAINTS';
  DBMS_OUTPUT.PUT_LINE('Dropped table: shipment');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -942 THEN
      DBMS_OUTPUT.PUT_LINE('Table shipment does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE payment CASCADE CONSTRAINTS';
  DBMS_OUTPUT.PUT_LINE('Dropped table: payment');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -942 THEN
      DBMS_OUTPUT.PUT_LINE('Table payment does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE payment_card CASCADE CONSTRAINTS';
  DBMS_OUTPUT.PUT_LINE('Dropped table: payment_card');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -942 THEN
      DBMS_OUTPUT.PUT_LINE('Table payment_card does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE order_line CASCADE CONSTRAINTS';
  DBMS_OUTPUT.PUT_LINE('Dropped table: order_line');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -942 THEN
      DBMS_OUTPUT.PUT_LINE('Table order_line does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE order_header CASCADE CONSTRAINTS';
  DBMS_OUTPUT.PUT_LINE('Dropped table: order_header');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -942 THEN
      DBMS_OUTPUT.PUT_LINE('Table order_header does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE reorder CASCADE CONSTRAINTS';
  DBMS_OUTPUT.PUT_LINE('Dropped table: reorder');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -942 THEN
      DBMS_OUTPUT.PUT_LINE('Table reorder does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE inventory CASCADE CONSTRAINTS';
  DBMS_OUTPUT.PUT_LINE('Dropped table: inventory');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -942 THEN
      DBMS_OUTPUT.PUT_LINE('Table inventory does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE bundle_component CASCADE CONSTRAINTS';
  DBMS_OUTPUT.PUT_LINE('Dropped table: bundle_component');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -942 THEN
      DBMS_OUTPUT.PUT_LINE('Table bundle_component does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE product_category CASCADE CONSTRAINTS';
  DBMS_OUTPUT.PUT_LINE('Dropped table: product_category');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -942 THEN
      DBMS_OUTPUT.PUT_LINE('Table product_category does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE shipper CASCADE CONSTRAINTS';
  DBMS_OUTPUT.PUT_LINE('Dropped table: shipper');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -942 THEN
      DBMS_OUTPUT.PUT_LINE('Table shipper does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE account CASCADE CONSTRAINTS';
  DBMS_OUTPUT.PUT_LINE('Dropped table: account');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -942 THEN
      DBMS_OUTPUT.PUT_LINE('Table account does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE product CASCADE CONSTRAINTS';
  DBMS_OUTPUT.PUT_LINE('Dropped table: product');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -942 THEN
      DBMS_OUTPUT.PUT_LINE('Table product does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE category CASCADE CONSTRAINTS';
  DBMS_OUTPUT.PUT_LINE('Dropped table: category');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -942 THEN
      DBMS_OUTPUT.PUT_LINE('Table category does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE location CASCADE CONSTRAINTS';
  DBMS_OUTPUT.PUT_LINE('Dropped table: location');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -942 THEN
      DBMS_OUTPUT.PUT_LINE('Table location does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE customer CASCADE CONSTRAINTS';
  DBMS_OUTPUT.PUT_LINE('Dropped table: customer');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -942 THEN
      DBMS_OUTPUT.PUT_LINE('Table customer does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE manufacturer CASCADE CONSTRAINTS';
  DBMS_OUTPUT.PUT_LINE('Dropped table: manufacturer');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -942 THEN
      DBMS_OUTPUT.PUT_LINE('Table manufacturer does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

-- =====================================================
-- Drop Sequences
-- =====================================================

BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_shipment_id';
  DBMS_OUTPUT.PUT_LINE('Dropped sequence: seq_shipment_id');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -2289 THEN
      DBMS_OUTPUT.PUT_LINE('Sequence seq_shipment_id does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_shipper_id';
  DBMS_OUTPUT.PUT_LINE('Dropped sequence: seq_shipper_id');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -2289 THEN
      DBMS_OUTPUT.PUT_LINE('Sequence seq_shipper_id does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_payment_id';
  DBMS_OUTPUT.PUT_LINE('Dropped sequence: seq_payment_id');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -2289 THEN
      DBMS_OUTPUT.PUT_LINE('Sequence seq_payment_id does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_card_id';
  DBMS_OUTPUT.PUT_LINE('Dropped sequence: seq_card_id');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -2289 THEN
      DBMS_OUTPUT.PUT_LINE('Sequence seq_card_id does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_order_id';
  DBMS_OUTPUT.PUT_LINE('Dropped sequence: seq_order_id');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -2289 THEN
      DBMS_OUTPUT.PUT_LINE('Sequence seq_order_id does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_reorder_id';
  DBMS_OUTPUT.PUT_LINE('Dropped sequence: seq_reorder_id');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -2289 THEN
      DBMS_OUTPUT.PUT_LINE('Sequence seq_reorder_id does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_account_id';
  DBMS_OUTPUT.PUT_LINE('Dropped sequence: seq_account_id');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -2289 THEN
      DBMS_OUTPUT.PUT_LINE('Sequence seq_account_id does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_product_id';
  DBMS_OUTPUT.PUT_LINE('Dropped sequence: seq_product_id');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -2289 THEN
      DBMS_OUTPUT.PUT_LINE('Sequence seq_product_id does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_location_id';
  DBMS_OUTPUT.PUT_LINE('Dropped sequence: seq_location_id');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -2289 THEN
      DBMS_OUTPUT.PUT_LINE('Sequence seq_location_id does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_category_id';
  DBMS_OUTPUT.PUT_LINE('Dropped sequence: seq_category_id');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -2289 THEN
      DBMS_OUTPUT.PUT_LINE('Sequence seq_category_id does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_customer_id';
  DBMS_OUTPUT.PUT_LINE('Dropped sequence: seq_customer_id');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -2289 THEN
      DBMS_OUTPUT.PUT_LINE('Sequence seq_customer_id does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_manufacturer_id';
  DBMS_OUTPUT.PUT_LINE('Dropped sequence: seq_manufacturer_id');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -2289 THEN
      DBMS_OUTPUT.PUT_LINE('Sequence seq_manufacturer_id does not exist (skipping)');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  DBMS_OUTPUT.PUT_LINE('');
  DBMS_OUTPUT.PUT_LINE('Database clear completed successfully!');
  DBMS_OUTPUT.PUT_LINE('You can now run database_schema.sql to recreate the database.');
END;
/



