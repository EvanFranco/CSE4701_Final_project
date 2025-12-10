import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { execute, executeOne } from '../db/oracle.js';
import { executeScalar } from '../db/oracle.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Customer Registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, billing_address } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if email already exists
    const existingResult = await execute(
      'SELECT customer_id FROM customer WHERE email = :email',
      { email }
    );
    
    if (existingResult && existingResult.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Get next customer ID
    const customerId = await executeScalar('SELECT seq_customer_id.NEXTVAL FROM DUAL');
    
    // Insert customer - handle missing columns gracefully
    // Try with all columns first, then fallback if columns don't exist
    let insertSuccess = false;
    let lastError = null;
    
    // Try with both password and created_date
    try {
      await execute(
        `INSERT INTO customer (customer_id, email, password, first_name, last_name, phone, billing_address, created_date)
         VALUES (:customer_id, :email, :password, :first_name, :last_name, :phone, :billing_address, SYSDATE)`,
        {
          customer_id: customerId,
          email,
          password: hashedPassword,
          first_name: first_name || null,
          last_name: last_name || null,
          phone: phone || null,
          billing_address: billing_address || null
        }
      );
      insertSuccess = true;
    } catch (err) {
      lastError = err;
      // If created_date column doesn't exist, try without it
      if (err.errorNum === 904 && err.message.includes('CREATED_DATE')) {
        try {
          await execute(
            `INSERT INTO customer (customer_id, email, password, first_name, last_name, phone, billing_address)
             VALUES (:customer_id, :email, :password, :first_name, :last_name, :phone, :billing_address)`,
            {
              customer_id: customerId,
              email,
              password: hashedPassword,
              first_name: first_name || null,
              last_name: last_name || null,
              phone: phone || null,
              billing_address: billing_address || null
            }
          );
          insertSuccess = true;
        } catch (err2) {
          lastError = err2;
          // If password column doesn't exist, this is a critical error
          if (err2.errorNum === 904 && err2.message.includes('PASSWORD')) {
            throw new Error('Database schema is missing required columns. Please run the database_schema.sql script to add the password and created_date columns to the customer table.');
          }
        }
      } else if (err.errorNum === 904 && err.message.includes('PASSWORD')) {
        // Password column is required for authentication
        throw new Error('Database schema is missing the password column. Please run the database_schema.sql script to update the customer table.');
      }
    }
    
    if (!insertSuccess) {
      throw lastError || new Error('Failed to insert customer');
    }
    
    res.status(201).json({ 
      message: 'Customer registered successfully',
      customer_id: customerId 
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Customer Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    let result;
    try {
      result = await execute(
        'SELECT customer_id, email, password, first_name, last_name FROM customer WHERE email = :email',
        { email }
      );
    } catch (err) {
      if (err.errorNum === 904 && err.message.includes('PASSWORD')) {
        return res.status(500).json({ 
          error: 'Database schema is missing the password column. Please run the database_schema.sql script to update the customer table.' 
        });
      }
      throw err;
    }
    
    if (!result || result.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const row = result[0];
    const customer = {
      customer_id: row.customer_id,
      email: row.email,
      password: row.password,
      first_name: row.first_name,
      last_name: row.last_name
    };
    
    if (!customer.password) {
      return res.status(401).json({ error: 'Account not set up with password. Please register first.' });
    }
    
    const validPassword = await bcrypt.compare(password, customer.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { customer_id: customer.customer_id, email: customer.email, type: 'customer' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      customer: {
        customer_id: customer.customer_id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Employee Login
router.post('/employee/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    let result;
    try {
      result = await execute(
        `SELECT employee_id, email, password, first_name, last_name, warehouse_id, role, status 
         FROM employee WHERE email = :email`,
        { email }
      );
    } catch (err) {
      if (err.errorNum === 942) { // Table or view does not exist
        return res.status(500).json({ 
          error: 'Employee table does not exist. Please run the database_schema.sql script to create the employee table.' 
        });
      }
      if (err.errorNum === 904 && err.message.includes('PASSWORD')) {
        return res.status(500).json({ 
          error: 'Database schema is missing the password column. Please run the database_schema.sql script.' 
        });
      }
      throw err;
    }
    
    if (!result || result.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const row = result[0];
    const employee = {
      employee_id: row.employee_id,
      email: row.email,
      password: row.password,
      first_name: row.first_name,
      last_name: row.last_name,
      warehouse_id: row.warehouse_id,
      role: row.role,
      status: row.status
    };
    
    if (employee.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Employee account is inactive' });
    }
    
    const validPassword = await bcrypt.compare(password, employee.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = jwt.sign(
      { employee_id: employee.employee_id, warehouse_id: employee.warehouse_id, role: employee.role, type: 'employee' },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    res.json({
      token,
      employee: {
        employee_id: employee.employee_id,
        email: employee.email,
        first_name: employee.first_name,
        last_name: employee.last_name,
        warehouse_id: employee.warehouse_id,
        role: employee.role
      }
    });
  } catch (err) {
    console.error('Employee login error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

