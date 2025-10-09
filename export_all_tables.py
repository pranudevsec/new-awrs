import psycopg2
import csv
import os

# Connection details
conn = psycopg2.connect(
    host="localhost",
    port="5432",
    user="postgres",
    password="12345678",
    dbname="army-2",
   sslmode="disable"
)

export_folder = "./exported_csvs"
os.makedirs(export_folder, exist_ok=True)

cur = conn.cursor()
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
tables = cur.fetchall()

for (table,) in tables:
    output_file = os.path.join(export_folder, f"{table}.csv")
    with open(output_file, "w", newline="") as f:
        writer = csv.writer(f)
        cur2 = conn.cursor()
        cur2.execute(f"SELECT * FROM {table};")
        colnames = [desc[0] for desc in cur2.description]
        writer.writerow(colnames)
        writer.writerows(cur2.fetchall())
        cur2.close()
    print(f"✅ Exported {table}.csv")

cur.close()
conn.close()
print("🎉 All tables exported successfully!")
