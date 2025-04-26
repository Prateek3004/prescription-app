from flask import Blueprint, request, jsonify
from database import mysql
import bcrypt
from datetime import datetime

users_bp = Blueprint('users', __name__)

VALID_ROLES = ['Doctor', 'Patient', 'Pharmacist', 'Admin']

# ------------------ SIGNUP ------------------
@users_bp.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role')

        if not all([name, email, password, role]):
            return jsonify({"status": "error", "message": "All fields are required"}), 400

        if role not in VALID_ROLES:
            return jsonify({"status": "error", "message": "Invalid role"}), 400

        cursor = mysql.connection.cursor()

        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            return jsonify({"status": "error", "message": "User already exists"}), 409

        # Hash password and store as string
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        cursor.execute(
            "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)",
            (name, email, hashed_password, role)
        )
        mysql.connection.commit()
        cursor.close()

        return jsonify({"status": "success", "message": "User registered successfully"}), 201

    except Exception as e:
        print("🚨 Signup error:", e)
        return jsonify({"status": "error", "message": "Internal server error"}), 500


# ------------------ LOGIN ------------------
@users_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email').strip()
        password = data.get('password').strip()

        if not email or not password:
            return jsonify({"status": "error", "message": "Email and password are required"}), 400

        cursor = mysql.connection.cursor()
        cursor.execute("SELECT id, name, email, role, password FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        cursor.close()

        if not user:
            return jsonify({"status": "error", "message": "Invalid credentials"}), 401

        # Check if user is a tuple or a dictionary
        if isinstance(user, tuple):
            user_id, name, email, role, stored_hash = user
        else:
            user_id = user['id']
            name = user['name']
            email = user['email']
            role = user['role']
            stored_hash = user['password']

        print("✅ Retrieved from DB:", stored_hash)  # This should show the actual hash
        print("🧪 Password (bytes):", password.encode('utf-8'))  # Debugging output

        if bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
            return jsonify({
                "status": "success",
                "message": "Login successful",
                "user": {
                    "id": user_id,
                    "name": name,
                    "email": email,
                    "role": role
                }
            }), 200
        else:
            return jsonify({"status": "error", "message": "Invalid credentials"}), 401

    except Exception as e:
        print("🚨 Login error:", str(e))
        return jsonify({"status": "error", "message": "Internal server error"}), 500