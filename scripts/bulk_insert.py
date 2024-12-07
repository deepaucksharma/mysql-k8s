#!/usr/bin/env python3
"""Bulk data insertion script for MySQL performance testing"""

import mysql.connector
import random
import string
import argparse
import sys
import time
from datetime import datetime, timedelta
from typing import List, Tuple

def parse_args() -> argparse.Namespace:
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Insert test data into MySQL')
    parser.add_argument('--rows', type=int, default=100000,
                      help='Number of rows to insert (default: 100000)')
    parser.add_argument('--batch', type=int, default=10000,
                      help='Batch size (default: 10000)')
    return parser.parse_args()

def generate_test_data(num_records: int) -> List[Tuple]:
    """Generate random employee records"""
    data = []
    for _ in range(num_records):
        emp_no = random.randint(1000000, 9999999)
        first_name = ''.join(random.choices(string.ascii_letters, k=random.randint(3, 14)))
        last_name = ''.join(random.choices(string.ascii_letters, k=random.randint(3, 16)))
        gender = random.choice(['M', 'F'])
        birth_date = datetime(1960, 1, 1) + timedelta(days=random.randint(0, 365*30))
        hire_date = datetime(1990, 1, 1) + timedelta(days=random.randint(0, 365*30))
        data.append((emp_no, birth_date.date(), first_name, last_name, gender, hire_date.date()))
    return data

def main() -> None:
    """Main function"""
    args = parse_args()
    start_time = time.time()
    
    try:
        # Connect to database
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="your_mysql_password",
            database="employees"
        )
        cursor = conn.cursor()

        # Create test table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS employees_large (
            emp_no      INT             NOT NULL,
            birth_date  DATE            NOT NULL,
            first_name  VARCHAR(14)     NOT NULL,
            last_name   VARCHAR(16)     NOT NULL,
            gender      ENUM ('M','F')  NOT NULL,
            hire_date   DATE            NOT NULL,
            PRIMARY KEY (emp_no)
        )""")
        conn.commit()

        # Insert data in batches
        total_records = args.rows
        batch_size = args.batch
        records_inserted = 0

        print(f"Inserting {total_records:,} records...")
        while records_inserted < total_records:
            batch = min(batch_size, total_records - records_inserted)
            data = generate_test_data(batch)
            
            cursor.executemany(
                "INSERT INTO employees_large VALUES (%s,%s,%s,%s,%s,%s)",
                data
            )
            conn.commit()
            
            records_inserted += batch
            progress = (records_inserted / total_records) * 100
            print(f"\rProgress: {progress:0.1f}% ({records_inserted:,}/{total_records:,})", 
                  end="", flush=True)

        print(f"\nCompleted in {time.time() - start_time:.1f} seconds")

    except KeyboardInterrupt:
        print("\nOperation cancelled")
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()
