# Quick Fix for Missing Database Columns

If you're getting the error: **"Database schema is missing required columns"**, follow these steps:

## Option 1: Run Migration Script (Recommended)

1. Connect to your Oracle database:
   ```bash
   sqlplus username/password@database
   ```

2. Run the migration script:
   ```sql
   @migrate_add_auth_features.sql
   ```

3. Restart your backend server

4. Try registering again

## Option 2: Quick SQL Commands

If you prefer to run commands manually, connect to your database and run:

```sql
-- Add password column
ALTER TABLE customer ADD password VARCHAR2(255);

-- Add created_date column  
ALTER TABLE customer ADD created_date DATE DEFAULT SYSDATE;
```

**Note**: If you get "column already exists" errors, that's fine - it means the column is already there.

## Option 3: Full Database Reset

If you want to start fresh, see `DATABASE_SETUP.md` for instructions on resetting the entire database.

## After Running

Once you've added the columns:
- ✅ Customer registration will work
- ✅ Customer login will work
- ✅ Employee features will work (if you also run the full migration script)

