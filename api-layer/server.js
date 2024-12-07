// api-layer/server.js
require('newrelic'); // Import New Relic APM

const express = require('express');
const mysql = require('mysql2/promise');
const app = express();

app.use(express.json());

// Custom error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message,
    timestamp: new Date().toISOString(),
    path: req.path
  });
};

const dbConfig = {
  host: process.env.MYSQL_HOST || 'mysql-newrelic-service',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'your_mysql_password',
  database: process.env.MYSQL_DATABASE || 'employees',
  connectTimeout: 10000,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Global connection pool
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('Database configuration:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port || 3306
});

// Test database connection on startup
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to database');
    connection.release();
  } catch (err) {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  }
};

testConnection();

// Middleware to check database connection
const checkDbConnection = async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    next();
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(503).json({ 
      error: 'Database connection error',
      timestamp: new Date().toISOString(),
      details: err.message
    });
  }
};

// Health check endpoint - Basic application health
app.get('/health', async (req, res) => {
  try {
    const dbCheck = await pool.query('SELECT 1');
    const memoryUsage = process.memoryUsage();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
        memory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        },
        uptime: process.uptime() + ' seconds'
      }
    });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: err.message
    });
  }
});

// Readiness check endpoint - Checks if service is ready to handle requests
app.get('/ready', async (req, res) => {
  try {
    // Check database connection
    const dbCheck = await pool.query('SELECT 1');
    
    // Check if we can perform a simple query
    const [testQuery] = await pool.query('SELECT COUNT(*) as count FROM employees LIMIT 1');
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          connected: true,
          querySuccessful: true,
          recordCount: testQuery[0].count
        }
      }
    });
  } catch (err) {
    console.error('Readiness check failed:', err);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: err.message
    });
  }
});

// Apply database connection check middleware to all routes except health checks
app.use(/^(?!\/(health|ready)).*$/, checkDbConnection);

// Endpoint to read an employee by emp_no
app.get('/read_employee', async (req, res, next) => {
  try {
    const emp_no = parseInt(req.query.emp_no, 10);
    if (!emp_no || isNaN(emp_no)) {
      return res.status(400).json({ error: 'Invalid employee number' });
    }
    
    const [rows] = await pool.execute(
      'SELECT e.*, d.dept_name FROM employees e LEFT JOIN dept_emp de ON e.emp_no = de.emp_no LEFT JOIN departments d ON de.dept_no = d.dept_no WHERE e.emp_no = ? AND de.to_date = "9999-01-01"', 
      [emp_no]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Endpoint to add a new employee
app.post('/add_employee', async (req, res, next) => {
  try {
    const { emp_no, first_name, last_name, gender, hire_date, birth_date } = req.body;
    
    // Input validation
    if (!emp_no || !first_name || !last_name || !gender || !hire_date || !birth_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      await connection.execute(
        'INSERT INTO employees (emp_no, birth_date, first_name, last_name, gender, hire_date) VALUES (?, ?, ?, ?, ?, ?)',
        [emp_no, birth_date, first_name, last_name, gender, hire_date]
      );
      
      // Add default department assignment
      await connection.execute(
        'INSERT INTO dept_emp (emp_no, dept_no, from_date, to_date) VALUES (?, ?, ?, ?)',
        [emp_no, 'd009', hire_date, '9999-01-01']
      );
      
      await connection.commit();
      res.status(201).json({ message: 'Employee added successfully', emp_no });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    next(err);
  }
});

// Endpoint to perform a complex query
app.get('/complex_query', async (req, res, next) => {
  try {
    const from_date = req.query.from_date || '1985-01-01';
    const to_date = req.query.to_date || '1995-12-31';
    
    const [rows] = await pool.execute(`
      SELECT 
        e.emp_no,
        e.first_name,
        e.last_name,
        d.dept_name,
        AVG(s.salary) AS avg_salary,
        COUNT(DISTINCT t.title) AS title_count
      FROM employees e
      JOIN dept_emp de ON e.emp_no = de.emp_no
      JOIN departments d ON de.dept_no = d.dept_no
      JOIN salaries s ON e.emp_no = s.emp_no
      JOIN titles t ON e.emp_no = t.emp_no
      WHERE s.from_date >= ? AND s.to_date <= ?
      GROUP BY e.emp_no, d.dept_name
      HAVING avg_salary > (
        SELECT AVG(salary) FROM salaries
        WHERE from_date >= ? AND to_date <= ?
      )
      LIMIT 100
    `, [from_date, to_date, from_date, to_date]);
    
    res.json({
      count: rows.length,
      results: rows
    });
  } catch (err) {
    next(err);
  }
});

// Apply error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`API Layer running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end().then(() => {
      console.log('Connection pool closed');
      process.exit(0);
    });
  });
});
