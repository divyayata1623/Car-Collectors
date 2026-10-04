"""
Seed standard die-cast categories for Car Collectors.
"""
from database import SessionLocal
from models.category import Category

DEFAULT_CATEGORIES = [
    {
        "name": "Hot Wheels Mainline",
        "slug": "hot-wheels-mainline",
        "description": "Standard 1:64 mainline die-cast models released across standard assortments."
    },
    {
        "name": "Hot Wheels Premium",
        "slug": "hot-wheels-premium",
        "description": "Premium metal/metal body and chassis featuring Real Riders rubber tires."
    },
    {
        "name": "Car Culture & Team Transport",
        "slug": "car-culture",
        "description": "High-end authentic collector series focusing on racing culture and legendary liveries."
    },
    {
        "name": "Matchbox Collector",
        "slug": "matchbox",
        "description": "Realistic everyday vehicles, trucks, and classic moving parts series."
    },
    {
        "name": "Special Editions & Chases",
        "slug": "special-editions",
        "description": "Super Treasure Hunts, chase cars, convention exclusives, and RLC limited runs."
    },
    {
        "name": "Vintage & Classics",
        "slug": "vintage-classics",
        "description": "Iconic vintage die-cast castings and historic muscle & sports cars."
    },
]

def seed_categories():
    db = SessionLocal()
    try:
        count = db.query(Category).count()
        if count > 0:
            print(f"Categories already exist ({count} found). Skipping.")
            return

        print("Seeding default categories...")
        for cat_data in DEFAULT_CATEGORIES:
            category = Category(**cat_data)
            db.add(category)
        db.commit()
        print(f"Successfully seeded {len(DEFAULT_CATEGORIES)} categories.")
    except Exception as e:
        print(f"Error seeding categories: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_categories()
