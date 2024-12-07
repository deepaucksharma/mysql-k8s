// api-layer/server.js
require('newrelic'); // Import New Relic APM

const express = require('express');
const mysql = require('mysql2/promise');
const app = express();

app.use(express.json());

const dbConfig = {
  host: process.env.MYSQL_HOST || 'mysql-newrelic-service',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'your_mysql_password',
  database: process.env.MYSQL_DATABASE || 'employees',
};

// Endpoint to read an employee by emp_no
app.get('/read_employee', async (req, res) => {
  try {
    const emp_no = parseInt(req.query.emp_no, 10) || 10000;
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM employees WHERE emp_no = ?', [emp_no]);
    await connection.end();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error reading employee data.');
  }
});

// Endpoint to add a new employee
app.post('/add_employee', async (req, res) => {
  try {
    const { emp_no, first_name, last_name, gender, hire_date, birth_date } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      'INSERT INTO employees (emp_no, birth_date, first_name, last_name, gender, hire_date) VALUES (?, ?, ?, ?, ?, ?)',
      [emp_no, birth_date, first_name, last_name, gender, hire_date]
    );
    await connection.end();
    res.send('Employee added successfully.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding employee.');
  }
});

// Endpoint to perform a complex query
app.get('/complex_query', async (req, res) => {
  try {
    const from_date = req.query.from_date || '1985-01-01';
    const to_date = req.query.to_date || '1995-12-31';
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT s.emp_no, AVG(s.salary) AS avg_salary FROM salaries s JOIN employees e ON s.emp_no = e.emp_no WHERE s.from_date >= ? AND s.to_date <= ? GROUP BY s.emp_no LIMIT 100',
      [from_date, to_date]
    );
    await connection.end();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error running complex query.');
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('SELECT 1');
    await connection.end();
    res.status(200).json({ status: 'healthy', database: 'connected' });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Layer running on port ${PORT}`);
});
