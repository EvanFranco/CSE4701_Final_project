# Database Setup Instructions

## Overview

This application requires an Oracle database with the complete schema including authentication features. The schema file contains all necessary tables, columns, views, sequences, and indexes.

## Quick Setup

### For New Database (Clean Install)

1. **Connect to your Oracle database** using SQL*Plus, SQL Developer, or your preferred tool:
   ```bash
   sqlplus username/password@database
   ```

2. **Run the complete schema script**:
   ```sql
   @database_schema.sql
   ```
   
   Or copy and paste the contents of `backend/database_schema.sql` into your SQL client and execute it.

### For Existing Database (Add Missing Features)

If you already have a database and are getting errors about missing columns:

1. **Connect to your Oracle database**:
   ```bash
   sqlplus username/password@database
   ```

2. **Run the migration script** (recommended - safe for existing databases):
   ```sql
   @migrate_add_auth_features.sql
   ```
   
   Or copy and paste the contents of `backend/migrate_add_auth_features.sql` into your SQL client and execute it.

   This script will:
   - Add `password` and `created_date` columns to the `customer` table
   - Create the `employee` table if it doesn't exist
   - Create the `customer_purchase_history` view
   - Add necessary sequences and indexes
   - **Safe to run multiple times** - won't fail if objects already exist

3. **Verify the setup** by checking key tables and columns:
   ```sql
   -- Check customer table has password and created_date
   SELECT column_name FROM user_tab_columns 
   WHERE table_name = 'CUSTOMER' 
   AND column_name IN ('PASSWORD', 'CREATED_DATE');
   
   -- Check employee table exists
   SELECT table_name FROM user_tables WHERE table_name = 'EMPLOYEE';
   
   -- Check purchase history view exists
   SELECT view_name FROM user_views WHERE view_name = 'CUSTOMER_PURCHASE_HISTORY';
   ```

## What the Schema Includes

The `database_schema.sql` file includes:

### Core Tables
- `manufacturer` - Electronics manufacturers
- `customer` - Customer information with **password** and **created_date** columns
- `category` - Product categories
- `location` - Store and warehouse locations
- `product` - Electronics product catalog
- `account` - Contract customer accounts
- `inventory` - Inventory levels by location
- `order_header` - Order information
- `order_line` - Order line items
- `payment` - Payment transactions
- `shipment` - Shipment tracking

### Authentication Tables
- `employee` - Warehouse employees with authentication
  - Includes: `employee_id`, `warehouse_id`, `email`, `password`, `role`, `status`, `created_date`

### Views
- `customer_purchase_history` - View for customer purchase history across all warehouses

### Sequences
- All necessary sequences for primary key generation including `seq_employee_id`

### Indexes
- Performance indexes on foreign keys and commonly queried columns

## Application Behavior

The application is designed to work gracefully with or without the complete schema:

- **If columns/tables are missing**: The application will return helpful error messages directing you to run the schema script
- **If schema is complete**: All features will work including:
  - Customer registration and login
  - Employee login and management
  - Purchase history viewing
  - Account management

## Troubleshooting

### Error: "PASSWORD": invalid identifier
**Solution**: Run `migrate_add_auth_features.sql` to add the `password` column to the `customer` table.

### Error: "CREATED_DATE": invalid identifier
**Solution**: Run `migrate_add_auth_features.sql` to add the `created_date` column to the `customer` or `employee` table.

### Error: Table or view does not exist (EMPLOYEE)
**Solution**: Run `migrate_add_auth_features.sql` to create the `employee` table.

### Error: Table or view does not exist (CUSTOMER_PURCHASE_HISTORY)
**Solution**: Run `migrate_add_auth_features.sql` to create the `customer_purchase_history` view.

### Quick Fix for Missing Columns
If you just need to add columns quickly without running the full migration:
```sql
ALTER TABLE customer ADD password VARCHAR2(255);
ALTER TABLE customer ADD created_date DATE DEFAULT SYSDATE;
```

## After Running the Schema

Once you've run the schema script:
1. Restart your backend server
2. All authentication features will be fully functional
3. You can register customers and create employees
4. Purchase history will be available

## Notes

- The schema script is idempotent-friendly for views (uses CREATE OR REPLACE)
- If you need to drop and recreate tables, uncomment the DROP statements at the top of the schema file
- Make sure you have appropriate Oracle database privileges to create tables, sequences, indexes, and views

