// load-generator/k6-script.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

export let options = {
    vus: 50, // Number of virtual users
    duration: '30m', // Duration of the test
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
        errors: ['count<10'], // Less than 10 errors
    },
};

// Custom metrics
export let errors = new Counter('errors');

export default function () {
    const baseUrl = __ENV.API_URL || 'http://api-layer-service:3000';

    // Read Employee
    const emp_no = Math.floor(Math.random() * 100000) + 10000;
    const readRes = http.get(`${baseUrl}/read_employee?emp_no=${emp_no}`);
    const readCheck = check(readRes, { 'Read employee success': (r) => r.status === 200 });
    if (!readCheck) errors.add(1);

    // Add Employee
    const payload = JSON.stringify({
        emp_no: Math.floor(Math.random() * 9000000) + 1000000,
        first_name: `John${Math.floor(Math.random() * 1000)}`,
        last_name: `Doe${Math.floor(Math.random() * 1000)}`,
        gender: 'M',
        hire_date: '2022-01-01',
        birth_date: '1990-01-01',
    });
    const addRes = http.post(`${baseUrl}/add_employee`, payload, {
        headers: { 'Content-Type': 'application/json' },
    });
    const addCheck = check(addRes, { 'Add employee success': (r) => r.status === 200 });
    if (!addCheck) errors.add(1);

    // Complex Query
    const complexRes = http.get(`${baseUrl}/complex_query?from_date=1985-01-01&to_date=1995-12-31`);
    const complexCheck = check(complexRes, { 'Complex query success': (r) => r.status === 200 });
    if (!complexCheck) errors.add(1);

    sleep(1); // Think time
}
