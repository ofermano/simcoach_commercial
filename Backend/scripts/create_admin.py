"""
Create first whitelisted admin user and print a JWT.
Run from project root: python -m scripts.create_admin admin@example.com YourPassword
"""
import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import hash_password, create_access_token


async def main():
    if len(sys.argv) < 3:
        print("Usage: python -m scripts.create_admin <email> <password>")
        sys.exit(1)
    email = sys.argv[1].lower()
    password = sys.argv[2]

    async with AsyncSessionLocal() as db:
        r = await db.execute(select(User).where(User.email == email))
        user = r.scalar_one_or_none()
        if user:
            user.hashed_password = hash_password(password)
            user.is_whitelisted = True
            user.is_active = True
            print(f"Updated user {email}")
        else:
            user = User(
                email=email,
                hashed_password=hash_password(password),
                provider="email",
                is_whitelisted=True,
                is_active=True,
            )
            db.add(user)
            await db.flush()
            print(f"Created user {email}")
        await db.commit()
        token = create_access_token(str(user.id), user.email)
        print("Token (use in Authorization: Bearer <token>):")
        print(token)


if __name__ == "__main__":
    asyncio.run(main())
