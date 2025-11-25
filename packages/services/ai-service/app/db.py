import os
import psycopg2
from fastapi import HTTPException

def get_db_connection():
    """
    Establishes a new database connection using the environment configuration.
    Returns a raw psycopg2 connection object.
    """
    try:
        # Retrieve the connection string used by Prisma/NestJS
        dsn = os.getenv("DATABASE_URL")
        if not dsn:
            print("CRITICAL: DATABASE_URL environment variable is not set.")
            raise ValueError("DATABASE_URL is missing.")
        if "?" in dsn:
            base_url, query_string = dsn.split("?", 1)
            # Filter out the schema parameter
            params = [p for p in query_string.split("&") if not p.startswith("schema=")]
            
            if params:
                # Reconstruct with valid params (e.g., sslmode=require)
                dsn = f"{base_url}?{'&'.join(params)}"
            else:
                # No other params, just use base URL
                dsn = base_url
        # -------------------------

        # Connect to PostgreSQL
        conn = psycopg2.connect(dsn)
        return conn

    except psycopg2.OperationalError as e:
        # Handle connection errors (e.g., DB is down, wrong credentials)
        print(f"OperationalError connecting to database: {e}")
        raise HTTPException(status_code=503, detail="Database service unavailable.")
    except Exception as e:
        # Handle unexpected errors
        print(f"Unexpected error connecting to database: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during database connection.")