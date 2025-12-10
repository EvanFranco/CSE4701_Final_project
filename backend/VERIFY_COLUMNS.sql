-- =====================================================
-- Verify Database Schema
-- Run this to check if required columns exist
-- =====================================================

-- Check customer table columns
SELECT 'Customer Table Columns:' AS info FROM DUAL;
SELECT column_name, data_type, data_length, nullable, data_default
FROM user_tab_columns 
WHERE table_name = 'CUSTOMER'
ORDER BY column_id;

-- Check if password column exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ password column EXISTS'
        ELSE '✗ password column MISSING'
    END AS password_status
FROM user_tab_columns
WHERE table_name = 'CUSTOMER' AND column_name = 'PASSWORD';

-- Check if created_date column exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ created_date column EXISTS'
        ELSE '✗ created_date column MISSING'
    END AS created_date_status
FROM user_tab_columns
WHERE table_name = 'CUSTOMER' AND column_name = 'CREATED_DATE';

-- Check if employee table exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ employee table EXISTS'
        ELSE '✗ employee table MISSING'
    END AS employee_table_status
FROM user_tables
WHERE table_name = 'EMPLOYEE';

-- Check if purchase history view exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ customer_purchase_history view EXISTS'
        ELSE '✗ customer_purchase_history view MISSING'
    END AS view_status
FROM user_views
WHERE view_name = 'CUSTOMER_PURCHASE_HISTORY';

