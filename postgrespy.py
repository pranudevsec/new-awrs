import pandas as pd
from sqlalchemy import create_engine
from urllib.parse import quote_plus
import json

# Static configuration
DB_HOST = "aws-0-ap-southeast-1.pooler.supabase.com"
DB_PORT = "5432"
DB_USER = "postgres.sdkchxdqfxjhuygnkkjb"
DB_PASSWORD = "Ansh@4018"  # contains special char '@'
DB_NAME = "postgres"

# Excel file path
excel_path = 'DATABASE AS ON 04 AUG 2025.xlsx'

# URL-encode password
encoded_password = quote_plus(DB_PASSWORD)

# Create SQLAlchemy engine with SSL (Supabase requires it)
engine = create_engine(
    f"postgresql+psycopg2://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}?sslmode=require"
)

# Load Excel file
xlsx = pd.ExcelFile(excel_path)

# Import each sheet into the same table (replacing on each iteration)
for sheet_name in xlsx.sheet_names:
    print(f"\nImporting sheet: {sheet_name}")
    
    df = pd.read_excel(xlsx, sheet_name=sheet_name)
    df.columns = [col.strip().lower().replace(' ', '_') for col in df.columns]

    # Convert numeric columns to boolean
    for col in ['negative', 'proof_reqd']:
        if col in df.columns:
            df[col] = df[col].apply(lambda x: bool(x) if pd.notnull(x) else False)

    # Convert to JSON for logging
    json_data = df.to_json(orient='records', indent=2, date_format='iso')
    print("Data in JSON format:")
    print(json_data)
    
    # Write to database
    df.to_sql("parameter_master", engine, if_exists='replace', index=False)

print("\n✅ Import completed with JSON logs.")
