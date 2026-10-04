"""
Create admin account for Car Collectors
Run this once to set up your admin login
"""
import os
from dotenv import load_dotenv

from services.auth import AuthService
from database import SessionLocal
from schemas.user import UserCreate

load_dotenv()


def create_admin():
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    admin_full_name = os.getenv("ADMIN_FULL_NAME")

    if (
        not admin_email
        or not admin_password
        or not admin_full_name
        or admin_password.lower().startswith(("your_", "replace_", "change_"))
    ):
        print(
            "Admin setup requires ADMIN_EMAIL, ADMIN_PASSWORD, and "
            "ADMIN_FULL_NAME in the local .env file."
        )
        return

    db = SessionLocal()
    try:
        admin_data = UserCreate(
            email=admin_email,
            password=admin_password,
            full_name=admin_full_name,
        )
        
        # Check if admin already exists
        from models.user import User
        existing = db.query(User).filter(User.email == admin_data.email).first()
        
        if existing:
            print(f"❌ Admin already exists: {admin_data.email}")
            print(f"   Role: {existing.role}")
            return
        
        # Create admin user
        admin = AuthService.create_user(db, admin_data, role="ADMIN")
        print(f"✅ Admin account created successfully!")
        print(f"   Email: {admin.email}")
        print(f"   Role: {admin.role}")
        print(f"\n🔐 Login at: http://localhost:3000/admin/login")
        print(f"   Use the credentials above to sign in")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
