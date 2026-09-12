"""
Create admin account for Car Collectors
Run this once to set up your admin login
"""
from services.auth import AuthService
from database import SessionLocal
from schemas.user import UserCreate

def create_admin():
    db = SessionLocal()
    try:
        # Admin credentials
        admin_data = UserCreate(
            email="admin@carcollectors.com",
            password="Admin@123456",  # Change this to your preferred password
            full_name="Store Admin"
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
