# test_user.py
from flask import Flask
app = Flask(__name__)

# Configure app (same as in app.py)
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'newpassword'
app.config['MYSQL_DB'] = 'prescription_db'

from flask_mysqldb import MySQL
mysql = MySQL(app)

import bcrypt

def create_test_user():
    with app.app_context():
        cursor = mysql.connection.cursor()
        hashed = bcrypt.hashpw(b'admin123', bcrypt.gensalt())
        cursor.execute(
            "INSERT INTO users (name, email, role, password) VALUES (%s, %s, %s, %s)",
            ("Yash User", "yash@example.com", "yash", hashed)
        )
        mysql.connection.commit()
        cursor.close()
        print("✅ Test user created!")

if __name__ == '__main__':
    create_test_user()