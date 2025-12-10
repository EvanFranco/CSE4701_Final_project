-- =====================================================
-- Quick Fix: Add Missing Columns to Customer Table
-- Run this if you're still getting "PASSWORD" or "CREATED_DATE" errors
-- =====================================================

-- Add password column (ignore error if it already exists)
ALTER TABLE customer ADD password VARCHAR2(255);

-- Add created_date column (ignore error if it already exists)  
ALTER TABLE customer ADD created_date DATE DEFAULT SYSDATE;

-- Verify the columns were added
SELECT column_name, data_type, data_length 
FROM user_tab_columns 
WHERE table_name = 'CUSTOMER' 
AND column_name IN ('PASSWORD', 'CREATED_DATE')
ORDER BY column_name;

COMMIT;

