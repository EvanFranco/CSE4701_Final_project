import express from 'express';
import bcrypt from 'bcrypt';
import { execute, executeOne, executeScalar } from '../db/oracle.js';

const router = express.Router();

// Get all employees
router.get('/', async (req, res) => {
  try {
    const result = await execute(
      `SELECT e.*, l.name AS warehouse_name 
       FROM employee e 
       LEFT JOIN location l ON e.warehouse_id = l.location_id 
       ORDER BY e.employee_id`
    );
    res.json(result);
  } catch (err) {
    if (err.errorNum === 942) { // Table or view does not exist
      return res.status(500).json({ 
        error: 'Employee table does not exist. Please run the database_schema.sql script to create the employee table.' 
      });
    }
    res.status(500).json({ error: err.message });
  }
});

// Get employee by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await executeOne(
      `SELECT e.*, l.name AS warehouse_name 
       FROM employee e 
       LEFT JOIN location l ON e.warehouse_id = l.location_id 
       WHERE e.employee_id = :id`,
      { id: req.params.id }
    );
    if (!result) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(result);
  } catch (err) {
    if (err.errorNum === 942) { // Table or view does not exist
      return res.status(500).json({ 
        error: 'Employee table does not exist. Please run the database_schema.sql script to create the employee table.' 
      });
    }
    res.status(500).json({ error: err.message });
  }
});

// Get employees by warehouse
router.get('/warehouse/:warehouseId', async (req, res) => {
  try {
    const result = await execute(
      `SELECT e.*, l.name AS warehouse_name 
       FROM employee e 
       LEFT JOIN location l ON e.warehouse_id = l.location_id 
       WHERE e.warehouse_id = :warehouse_id 
       ORDER BY e.employee_id`,
      { warehouse_id: req.params.warehouseId }
    );
    res.json(result);
  } catch (err) {
    if (err.errorNum === 942) { // Table or view does not exist
      return res.status(500).json({ 
        error: 'Employee table does not exist. Please run the database_schema.sql script to create the employee table.' 
      });
    }
    res.status(500).json({ error: err.message });
  }
});

// Create new employee
router.post('/', async (req, res) => {
  try {
    const { warehouse_id, first_name, last_name, email, password, role, status } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if employee table exists and email already exists
    let existingResult;
    try {
      existingResult = await execute(
        'SELECT employee_id FROM employee WHERE email = :email',
        { email }
      );
    } catch (err) {
      if (err.errorNum === 942) { // Table or view does not exist
        return res.status(500).json({ 
          error: 'Employee table does not exist. Please run the database_schema.sql script to create the employee table.' 
        });
      }
      throw err;
    }
    
    if (existingResult && existingResult.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    let employeeId;
    try {
      employeeId = await executeScalar('SELECT seq_employee_id.NEXTVAL FROM DUAL');
    } catch (err) {
      if (err.errorNum === 2289) { // Sequence does not exist
        return res.status(500).json({ 
          error: 'Employee sequence does not exist. Please run the database_schema.sql script.' 
        });
      }
      throw err;
    }
    
    // Insert employee (created_date will be set by DEFAULT if column exists)
    // Try with created_date first, fallback without it if column doesn't exist
    try {
      await execute(
        `INSERT INTO employee (employee_id, warehouse_id, first_name, last_name, email, password, role, status, created_date)
         VALUES (:employee_id, :warehouse_id, :first_name, :last_name, :email, :password, :role, :status, SYSDATE)`,
        {
          employee_id: employeeId,
          warehouse_id: warehouse_id,
          first_name: first_name,
          last_name: last_name,
          email: email,
          password: hashedPassword,
          role: role || 'STAFF',
          status: status || 'ACTIVE'
        }
      );
    } catch (err) {
      // If created_date column doesn't exist, insert without it
      if (err.errorNum === 904 && err.message.includes('CREATED_DATE')) {
        await execute(
          `INSERT INTO employee (employee_id, warehouse_id, first_name, last_name, email, password, role, status)
           VALUES (:employee_id, :warehouse_id, :first_name, :last_name, :email, :password, :role, :status)`,
          {
            employee_id: employeeId,
            warehouse_id: warehouse_id,
            first_name: first_name,
            last_name: last_name,
            email: email,
            password: hashedPassword,
            role: role || 'STAFF',
            status: status || 'ACTIVE'
          }
        );
      } else if (err.errorNum === 904 && err.message.includes('PASSWORD')) {
        throw new Error('Database schema is missing the password column. Please run the database_schema.sql script.');
      } else {
        throw err;
      }
    }
    
    res.status(201).json({ employee_id: employeeId, ...req.body, password: undefined });
  } catch (err) {
    if (err.errorNum === 1) { // Unique constraint violation
      res.status(400).json({ error: 'Email already exists' });
    } else if (err.errorNum === 942) { // Table or view does not exist
      res.status(500).json({ 
        error: 'Employee table does not exist. Please run the database_schema.sql script to create the employee table.' 
      });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  try {
    const { warehouse_id, first_name, last_name, email, password, role, status } = req.body;
    
    let updateFields = [];
    let bindParams = { employee_id: parseInt(req.params.id) };
    
    if (warehouse_id !== undefined) {
      updateFields.push('warehouse_id = :warehouse_id');
      bindParams.warehouse_id = warehouse_id;
    }
    if (first_name !== undefined) {
      updateFields.push('first_name = :first_name');
      bindParams.first_name = first_name;
    }
    if (last_name !== undefined) {
      updateFields.push('last_name = :last_name');
      bindParams.last_name = last_name;
    }
    if (email !== undefined) {
      updateFields.push('email = :email');
      bindParams.email = email;
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = :password');
      bindParams.password = hashedPassword;
    }
    if (role !== undefined) {
      updateFields.push('role = :role');
      bindParams.role = role;
    }
    if (status !== undefined) {
      updateFields.push('status = :status');
      bindParams.status = status;
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    await execute(
      `UPDATE employee SET ${updateFields.join(', ')} WHERE employee_id = :employee_id`,
      bindParams
    );
    
    res.json({ employee_id: parseInt(req.params.id), ...req.body, password: undefined });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    await execute('DELETE FROM employee WHERE employee_id = :id', { id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    if (err.errorNum === 942) { // Table or view does not exist
      return res.status(500).json({ 
        error: 'Employee table does not exist. Please run the database_schema.sql script to create the employee table.' 
      });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;

