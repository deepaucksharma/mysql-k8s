import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Define custom metrics
const errorRate = new Rate('errors');

// Configuration for the test
export const options = {
  scenarios: {
    readEmployee: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '5m', target: 20 },
        { duration: '10m', target: 20 },
        { duration: '5m', target: 0 }
      ],
      gracefulRampDown: '30s',
      exec: 'readEmployeeScenario'
    },
    addEmployee: {
      executor: 'constant-vus',
      vus: 5,
      duration: '20m',
      exec: 'addEmployeeScenario'
    },
    complexQuery: {
      executor: 'per-vu-iterations',
      vus: 3,
      iterations: 100,
      maxDuration: '20m',
      exec: 'complexQueryScenario'
    }
  },
  thresholds: {
    'http_req_duration': ['p(95)<200'],
    'errors': ['rate<0.1']
  }
};

// Base URL for the API
const BASE_URL = 'http://api-layer:3000';

// Read Employee Scenario
export function readEmployeeScenario() {
  const randomEmpNo = Math.floor(Math.random() * 10000) + 10001;
  const res = http.get(`${BASE_URL}/read_employee?emp_no=${randomEmpNo}`);
  
  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response body': (r) => r.body.length > 0
  });

  errorRate.add(!success);
  sleep(1);
}

// Add Employee Scenario
export function addEmployeeScenario() {
  const payload = JSON.stringify({
    emp_no: Math.floor(Math.random() * 100000) + 100001,
    first_name: 'Test',
    last_name: 'Employee',
    gender: 'M',
    hire_date: '2024-01-01',
    birth_date: '1990-01-01'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(`${BASE_URL}/add_employee`, payload, params);
  
  const success = check(res, {
    'status is 201': (r) => r.status === 201,
    'employee added': (r) => JSON.parse(r.body).message === 'Employee added successfully'
  });

  errorRate.add(!success);
  sleep(1);
}

// Complex Query Scenario
export function complexQueryScenario() {
  const res = http.get(`${BASE_URL}/complex_query`);
  
  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response body': (r) => r.body.length > 0
  });

  errorRate.add(!success);
  sleep(1);
}
