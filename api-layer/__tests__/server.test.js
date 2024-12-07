// api-layer/__tests__/server.test.js
const request = require('supertest');
const express = require('express');
const mysql = require('mysql2/promise');
const app = require('../server'); // Adjust path as needed

jest.mock('mysql2/promise');

describe('API Layer Endpoints', () => {
  let connection;

  beforeAll(() => {
    connection = {
      execute: jest.fn(),
      end: jest.fn(),
    };
    mysql.createConnection.mockResolvedValue(connection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch an employee', async () => {
    const mockData = [{ emp_no: 10001, first_name: 'John', last_name: 'Doe' }];
    connection.execute.mockResolvedValue([mockData]);

    const res = await request(app).get('/read_employee').query({ emp_no: 10001 });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(mockData);
    expect(connection.execute).toHaveBeenCalledWith('SELECT * FROM employees WHERE emp_no = ?', [10001]);
  });

  it('should add a new employee', async () => {
    connection.execute.mockResolvedValue([{}]);

    const payload = {
      emp_no: 9999999,
      first_name: 'Test',
      last_name: 'User',
      gender: 'M',
      hire_date: '2022-01-01',
      birth_date: '1990-01-01',
    };

    const res = await request(app).post('/add_employee').send(payload);
    expect(res.statusCode).toEqual(200);
    expect(res.text).toEqual('Employee added successfully.');
    expect(connection.execute).toHaveBeenCalledWith(
      'INSERT INTO employees (emp_no, birth_date, first_name, last_name, gender, hire_date) VALUES (?, ?, ?, ?, ?, ?)',
      [payload.emp_no, payload.birth_date, payload.first_name, payload.last_name, payload.gender, payload.hire_date]
    );
  });

  it('should run a complex query', async () => {
    const mockData = [
      { emp_no: 10001, avg_salary: 50000 },
      { emp_no: 10002, avg_salary: 60000 },
    ];
    connection.execute.mockResolvedValue([mockData]);

    const res = await request(app).get('/complex_query').query({ from_date: '1985-01-01', to_date: '1995-12-31' });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(mockData);
    expect(connection.execute).toHaveBeenCalledWith(
      'SELECT s.emp_no, AVG(s.salary) AS avg_salary FROM salaries s JOIN employees e ON s.emp_no = e.emp_no WHERE s.from_date >= ? AND s.to_date <= ? GROUP BY s.emp_no LIMIT 100',
      ['1985-01-01', '1995-12-31']
    );
  });

  it('should handle errors gracefully', async () => {
    connection.execute.mockRejectedValue(new Error('Database error'));

    const res = await request(app).get('/read_employee').query({ emp_no: 10001 });
    expect(res.statusCode).toEqual(500);
    expect(res.text).toEqual('Error reading employee data.');
  });
});
