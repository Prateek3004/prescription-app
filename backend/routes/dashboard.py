from flask import Blueprint, jsonify
from database import mysql
import traceback

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard', methods=['GET'])
def dashboard_summary():
    try:
        print("📥 [DEBUG] /dashboard route triggered")

        # ✅ Force regular tuple cursor
        cursor = mysql.connection.cursor()
        print("✅ Connected to database")

        # Total users
        cursor.execute("SELECT COUNT(*) FROM users")
        result = cursor.fetchone()
        print("DEBUG: Result for total users:", result)  # Debugging line
        total_users = result['COUNT(*)'] if result else 0
        print("👥 Total users:", total_users)

        # Total doctors
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'Doctor'")
        result = cursor.fetchone()
        print("DEBUG: Result for total doctors:", result)  # Debugging line
        total_doctors = result['COUNT(*)'] if result else 0
        print("🩺 Total doctors:", total_doctors)

        # Total patients
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'Patient'")
        result = cursor.fetchone()
        print("DEBUG: Result for total patients:", result)  # Debugging line
        total_patients = result['COUNT(*)'] if result else 0
        print("🧑‍🦱 Total patients:", total_patients)

        # Gender-wise patients
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'Patient' AND gender = 'male'")
        result = cursor.fetchone()
        print("DEBUG: Result for male patients:", result)  # Debugging line
        male_patients = result['COUNT(*)'] if result else 0
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'Patient' AND gender = 'female'")
        result = cursor.fetchone()
        print("DEBUG: Result for female patients:", result)  # Debugging line
        female_patients = result['COUNT(*)'] if result else 0
        print("👨‍⚕️ Male patients:", male_patients)
        print("👩‍⚕️ Female patients:", female_patients)

        # Gender-wise doctors
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'Doctor' AND gender = 'male'")
        result = cursor.fetchone()
        print("DEBUG: Result for male doctors:", result)  # Debugging line
        male_doctors = result['COUNT(*)'] if result else 0
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'Doctor' AND gender = 'female'")
        result = cursor.fetchone()
        print("DEBUG: Result for female doctors:", result)  # Debugging line
        female_doctors = result['COUNT(*)'] if result else 0
        print("👨‍⚕️ Male doctors:", male_doctors)
        print("👩‍⚕️ Female doctors:", female_doctors)

        # Total prescriptions
        cursor.execute("SELECT COUNT(*) FROM prescriptions")
        result = cursor.fetchone()
        print("DEBUG: Result for total prescriptions:", result)  # Debugging line
        total_prescriptions = result['COUNT(*)'] if result else 0
        print("💊 Total prescriptions:", total_prescriptions)

        # Active prescriptions (optional check)
        try:
            cursor.execute("SELECT COUNT(*) FROM prescriptions WHERE status = 'Active'")
            result = cursor.fetchone()
            print("DEBUG: Result for active prescriptions:", result)  # Debugging line
            active_prescriptions = result['COUNT(*)'] if result else 0
        except Exception as e:
            print("⚠️ 'status' column not found in prescriptions table. Skipping active_prescriptions.")
            print(traceback.format_exc())
            active_prescriptions = 0

        cursor.close()

        return jsonify({
            "status": "success",
            "total_users": total_users,
            "total_doctors": total_doctors,
            "total_patients": total_patients,
            "total_prescriptions": total_prescriptions,
            "active_prescriptions": active_prescriptions,
            "genderStats": {
                "patients": {
                    "male": male_patients,
                    "female": female_patients
                },
                "doctors": {
                    "male": male_doctors,
                    "female": female_doctors
                }
            }
        }), 200

    except Exception as e:
        print("❌ [ERROR] in dashboard_summary:")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": "Failed to fetch dashboard summary"
        }), 500