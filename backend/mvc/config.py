import os
import asyncio
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# Load .env
load_dotenv()

# DB URL
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in .env file")

# Create engine
engine = create_async_engine(DATABASE_URL, echo=True)


# Test connection
async def test_connection():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT 1"))
        print("DB connection OK:", result.scalar())


if __name__ == "__main__":
    asyncio.run(test_connection())