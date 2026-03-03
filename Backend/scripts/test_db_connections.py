"""
Test DB connection pool under concurrency.

Run from Backend directory (so app is importable):
  python -m scripts.test_db_connections [--concurrent 20] [--rounds 2]

Or:
  cd Backend && python scripts.test_db_connections.py --concurrent 20

Uses the same async engine as the app and runs N concurrent sessions that each
run a simple query. Prints pool status (size, checked in/out, overflow) so you
can verify pool_size / max_overflow behavior.

Check connections from PostgreSQL (while app or script is running):
  SELECT count(*), state FROM pg_stat_activity WHERE datname = current_database()
  GROUP BY state;
  -- or total: SELECT count(*) FROM pg_stat_activity WHERE datname = current_database();
"""
import argparse
import asyncio
import sys
from pathlib import Path

# Allow importing app from Backend
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text

from app.database import AsyncSessionLocal, engine
from app.config import get_settings


def pool_status() -> str:
    pool = engine.pool
    return (
        f"pool size={pool.size()} checked_out={pool.checkedout()} "
        f"checked_in={pool.checkedin()} overflow={pool.overflow()}"
    )


async def run_one_query(session_id: int) -> None:
    async with AsyncSessionLocal() as session:
        await session.execute(text("SELECT 1"))
        await session.commit()


async def main(concurrent: int, rounds: int) -> None:
    settings = get_settings()
    print(f"Database: {settings.database_url.split('@')[-1] if '@' in settings.database_url else '...'}")
    print(f"Config: pool_size={settings.db_pool_size} max_overflow={settings.db_max_overflow}")
    print(f"Running {concurrent} concurrent sessions, {rounds} round(s).\n")

    for r in range(rounds):
        print(f"--- Round {r + 1} ---")
        print(f"Before: {pool_status()}")

        tasks = [run_one_query(i) for i in range(concurrent)]
        await asyncio.gather(*tasks)

        print(f"After:  {pool_status()}\n")

    await engine.dispose()
    print("Done. Engine disposed.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test DB connection pool under concurrency")
    parser.add_argument(
        "--concurrent",
        type=int,
        default=20,
        help="Number of concurrent sessions (default 20)",
    )
    parser.add_argument(
        "--rounds",
        type=int,
        default=2,
        help="Number of rounds (default 2)",
    )
    args = parser.parse_args()
    asyncio.run(main(args.concurrent, args.rounds))
