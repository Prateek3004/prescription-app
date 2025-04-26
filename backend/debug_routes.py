import sys
sys.path.append("F:/minor project/backend")  # Adjust path if needed

from app import app

with app.app_context():
    print(app.url_map)
