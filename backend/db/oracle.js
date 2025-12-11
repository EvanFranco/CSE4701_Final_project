import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

// Oracle connection configuration
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECTION_STRING
};

let pool;

/**
 * Initialize Oracle connection pool
 */
async function initialize() {
  try {
    // Enable auto-commit for easier transaction management
    pool = await oracledb.createPool({
      ...dbConfig,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1,
      poolTimeout: 60,
      queueTimeout: 60000
    });
    console.log('✅ Oracle connection pool created successfully');
  } catch (err) {
    console.error('❌ Error creating connection pool:', err);
    throw err;
  }
}

/**
 * Close the connection pool
 */
async function close() {
  try {
    await pool.close();
    console.log('✅ Connection pool closed');
  } catch (err) {
    console.error('❌ Error closing connection pool:', err);
  }
}

/**
 * Convert Oracle uppercase column names to lowercase
 */
function convertKeysToLowercase(rows) {
  if (!rows || !Array.isArray(rows)) {
    return rows;
  }
  return rows.map(row => {
    const newRow = {};
    for (const key in row) {
      newRow[key.toLowerCase()] = row[key];
    }
    return newRow;
  });
}

/**
 * Check if SQL is a DML operation (INSERT, UPDATE, DELETE)
 * @param {string} sql - SQL query string
 * @returns {boolean} True if DML operation
 */
function isDMLOperation(sql) {
  const trimmed = sql.trim().toUpperCase();
  return trimmed.startsWith('INSERT') || 
         trimmed.startsWith('UPDATE') || 
         trimmed.startsWith('DELETE') ||
         trimmed.startsWith('MERGE');
}

/**
 * Execute a SQL query
 * @param {string} sql - SQL query string
 * @param {Array|Object} binds - Query parameters
 * @param {Object} options - Query options
 * @returns {Promise} Query result
 */
async function execute(sql, binds = [], options = {}) {
  let connection;
  const isDML = isDMLOperation(sql);
  
  try {
    connection = await pool.getConnection();
    
    // Always use autoCommit: true to ensure all DML operations are committed immediately
    // This ensures data added through the frontend is immediately visible in SQL queries
    const executeOptions = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true, // Always commit immediately for data consistency
      ...options
    };
    
    // Override autoCommit if explicitly set to false in options (for transactions)
    if (options.autoCommit === false) {
      executeOptions.autoCommit = false;
    }
    
    const result = await connection.execute(sql, binds, executeOptions);
    
    // With autoCommit: true, Oracle automatically commits after each statement
    // For DML operations, this ensures data is immediately saved and visible
    // If autoCommit is false, we must explicitly commit
    if (isDML && !executeOptions.autoCommit) {
      await connection.commit();
    }
    
    // Log successful DML operations for debugging
    if (isDML && process.env.NODE_ENV === 'development') {
      const operation = sql.trim().toUpperCase().split(' ')[0];
      console.log(`✅ ${operation} operation completed and committed`);
    }
    
    // Convert uppercase keys to lowercase
    if (result.rows) {
      result.rows = convertKeysToLowercase(result.rows);
    }
    return result.rows || result;
  } catch (err) {
    // Rollback on error for DML operations (only if not auto-committed)
    if (isDML && connection && !options.autoCommit) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        // Ignore rollback errors if connection is already closed
      }
    }
    console.error('❌ Error executing query:', err);
    console.error('SQL:', sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));
    console.error('Binds:', binds);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('❌ Error closing connection:', err);
      }
    }
  }
}

/**
 * Execute a query and return a single row
 */
async function executeOne(sql, binds = [], options = {}) {
  const result = await execute(sql, binds, options);
  return result && result.length > 0 ? result[0] : null;
}

/**
 * Execute a query and return the first column of the first row
 */
async function executeScalar(sql, binds = [], options = {}) {
  const result = await execute(sql, binds, options);
  return result && result.length > 0 ? result[0][Object.keys(result[0])[0]] : null;
}

export {
  initialize,
  close,
  execute,
  executeOne,
  executeScalar
};
