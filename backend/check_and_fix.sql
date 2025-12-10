-- =====================================================
-- Check and Fix Missing Columns
-- Run this to verify and add missing columns
-- =====================================================

SET SERVEROUTPUT ON;

-- First, check what exists
PROMPT Checking current state...
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'EXISTS'
        ELSE 'MISSING'
    END AS password_status
FROM user_tab_columns
WHERE table_name = 'CUSTOMER' AND column_name = 'PASSWORD';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'EXISTS'
        ELSE 'MISSING'
    END AS created_date_status
FROM user_tab_columns
WHERE table_name = 'CUSTOMER' AND column_name = 'CREATED_DATE';

-- Now try to add them (will fail silently if they exist)
PROMPT Attempting to add password column...
BEGIN
   EXECUTE IMMEDIATE 'ALTER TABLE customer ADD password VARCHAR2(255)';
   DBMS_OUTPUT.PUT_LINE('SUCCESS: Added password column');
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE = -1430 THEN
         DBMS_OUTPUT.PUT_LINE('INFO: password column already exists');
      ELSE
         DBMS_OUTPUT.PUT_LINE('ERROR: ' || SQLERRM);
         RAISE;
      END IF;
END;
/

PROMPT Attempting to add created_date column...
BEGIN
   EXECUTE IMMEDIATE 'ALTER TABLE customer ADD created_date DATE DEFAULT SYSDATE';
   DBMS_OUTPUT.PUT_LINE('SUCCESS: Added created_date column');
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE = -1430 THEN
         DBMS_OUTPUT.PUT_LINE('INFO: created_date column already exists');
      ELSE
         DBMS_OUTPUT.PUT_LINE('ERROR: ' || SQLERRM);
         RAISE;
      END IF;
END;
/

-- Verify again
PROMPT Verifying columns exist...
SELECT column_name, data_type, nullable, data_default
FROM user_tab_columns
WHERE table_name = 'CUSTOMER' 
AND column_name IN ('PASSWORD', 'CREATED_DATE')
ORDER BY column_name;

COMMIT;

PROMPT Done! If columns show above, they are now in your database.

