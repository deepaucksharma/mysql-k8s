# scripts/bulk_insert.py
import mysql.connector
import random
import string

def generate_random_string(length=10):
    return ''.join(random.choices(string.ascii_letters, k=length))

def generate_random_gender():
    return random.choice(['M', 'F'])

def main():
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="your_mysql_password",
        database="employees"
    )
    cursor = conn.cursor()

    # Create a larger table by duplicating employees
    cursor.execute("CREATE TABLE IF NOT EXISTS employees_large LIKE employees;")
    conn.commit()

    # Insert data multiple times to scale
    for i in range(100_000):  # Example: 100,000 rows for local testing
        emp_no = random.randint(1000000, 9999999)
        first_name = generate_random_string(10)
        last_name = generate_random_string(10)
        gender = generate_random_gender()
        hire_date = "2010-01-01"
        birth_date = "1980-01-01"
        cursor.execute(
            "INSERT INTO employees_large (emp_no, birth_date, first_name, last_name, gender, hire_date) VALUES (%s,%s,%s,%s,%s,%s)",
            (emp_no, birth_date, first_name, last_name, gender, hire_date)
        )
        if i % 10000 == 0:
            conn.commit()
            print(f"{i} records inserted.")

    conn.commit()
    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
