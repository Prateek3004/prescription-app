from flask import Blueprint, request, jsonify, make_response
from flask_mysqldb import MySQL
import csv
import io
import logging

# Setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

prescriptions_bp = Blueprint("prescriptions", __name__)
mysql = MySQL()

# 🔹 Add Prescription
@prescriptions_bp.route("/add", methods=["POST"])
def add_prescription():
    try:
        data = request.get_json()
        doctor_email = data.get("doctor_email")
        patient_email = data.get("patient_email")
        medication = data.get("medication")
        dosage = data.get("dosage")

        if not all([doctor_email, patient_email, medication, dosage]):
            return jsonify({"status": "error", "message": "Missing required fields"}), 400

        cur = mysql.connection.cursor()

        # Fetch doctor & patient IDs
        cur.execute("SELECT id FROM users WHERE email = %s AND role = 'Doctor'", (doctor_email,))
        doctor = cur.fetchone()

        cur.execute("SELECT id FROM users WHERE email = %s AND role = 'Patient'", (patient_email,))
        patient = cur.fetchone()

        if not doctor or not patient:
            return jsonify({"status": "error", "message": "Doctor or Patient not found"}), 404

        cur.execute("""
            INSERT INTO prescriptions (doctor_id, patient_id, medication, dosage)
            VALUES (%s, %s, %s, %s)
        """, (doctor["id"], patient["id"], medication, dosage))

        mysql.connection.commit()
        cur.close()
        return jsonify({"status": "success", "message": "Prescription added"}), 201

    except Exception as e:
        logger.error(f"Add prescription error: {str(e)}")
        return jsonify({"status": "error", "message": "Internal server error"}), 500

# 🔹 Get Prescriptions for a Patient
@prescriptions_bp.route("/patient/<email>", methods=["GET"])
def get_patient_prescriptions(email):
    try:
        cur = mysql.connection.cursor()
        cur.execute("""
            SELECT p.id, p.medication, p.dosage, d.email AS doctor_email, p.created_at
            FROM prescriptions p
            JOIN users d ON p.doctor_id = d.id
            WHERE p.patient_id = (SELECT id FROM users WHERE email = %s)
            ORDER BY p.created_at DESC
        """, (email,))
        data = cur.fetchall()
        cur.close()
        return jsonify({"status": "success", "prescriptions": data}), 200
    except Exception as e:
        logger.error(f"Fetch error: {str(e)}")
        return jsonify({"status": "error", "message": "Failed to fetch prescriptions"}), 500

# 🔹 Get Prescriptions for a Doctor (with optional sorting & pagination)
@prescriptions_bp.route("/doctor/<email>", methods=["GET"])
def get_doctor_prescriptions(email):
    try:
        sort = request.args.get("sort", "desc")
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        offset = (page - 1) * limit

        cur = mysql.connection.cursor()
        cur.execute("SELECT id FROM users WHERE email = %s AND role = 'Doctor'", (email,))
        doctor = cur.fetchone()
        if not doctor:
            return jsonify({"status": "error", "message": "Doctor not found"}), 404

        cur.execute(f"""
            SELECT p.id, p.medication, p.dosage, u.email AS patient_email, p.created_at
            FROM prescriptions p
            JOIN users u ON p.patient_id = u.id
            WHERE p.doctor_id = %s
            ORDER BY p.created_at {sort.upper()}
            LIMIT %s OFFSET %s
        """, (doctor["id"], limit, offset))
        prescriptions = cur.fetchall()
        cur.close()
        return jsonify({"status": "success", "prescriptions": prescriptions}), 200
    except Exception as e:
        logger.error(f"Doctor fetch error: {str(e)}")
        return jsonify({"status": "error", "message": "Error fetching doctor's prescriptions"}), 500

# 🔹 Edit a Prescription
@prescriptions_bp.route("/edit/<int:prescription_id>", methods=["PUT"])
def edit_prescription(prescription_id):
    try:
        data = request.get_json()
        medication = data.get("medication")
        dosage = data.get("dosage")

        if not medication or not dosage:
            return jsonify({"status": "error", "message": "Missing medication or dosage"}), 400

        cur = mysql.connection.cursor()
        cur.execute("""
            UPDATE prescriptions
            SET medication = %s, dosage = %s
            WHERE id = %s
        """, (medication, dosage, prescription_id))
        mysql.connection.commit()
        cur.close()
        return jsonify({"status": "success", "message": "Prescription updated"}), 200
    except Exception as e:
        logger.error(f"Edit error: {str(e)}")
        return jsonify({"status": "error", "message": "Error updating prescription"}), 500

# 🔹 Delete a Prescription
@prescriptions_bp.route("/delete/<int:prescription_id>", methods=["DELETE"])
def delete_prescription(prescription_id):
    try:
        cur = mysql.connection.cursor()
        cur.execute("DELETE FROM prescriptions WHERE id = %s", (prescription_id,))
        mysql.connection.commit()
        cur.close()
        return jsonify({"status": "success", "message": "Prescription deleted"}), 200
    except Exception as e:
        logger.error(f"Delete error: {str(e)}")
        return jsonify({"status": "error", "message": "Error deleting prescription"}), 500

# 🔹 Export Doctor's Prescriptions to CSV
@prescriptions_bp.route("/export/<email>", methods=["GET"])
def export_prescriptions_csv(email):
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT id FROM users WHERE email = %s AND role = 'Doctor'", (email,))
        doctor = cur.fetchone()

        if not doctor:
            return jsonify({"status": "error", "message": "Doctor not found"}), 404

        cur.execute("""
            SELECT p.id, p.medication, p.dosage, u.email AS patient_email, p.created_at
            FROM prescriptions p
            JOIN users u ON p.patient_id = u.id
            WHERE p.doctor_id = %s
            ORDER BY p.created_at DESC
        """, (doctor["id"],))
        prescriptions = cur.fetchall()
        cur.close()

        # Generate CSV
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Medication", "Dosage", "Patient Email", "Created At"])
        for pres in prescriptions:
            writer.writerow([pres["id"], pres["medication"], pres["dosage"], pres["patient_email"], pres["created_at"]])

        response = make_response(output.getvalue())
        response.headers["Content-Disposition"] = "attachment; filename=prescriptions.csv"
        response.headers["Content-Type"] = "text/csv"
        return response

    except Exception as e:
        logger.error(f"Export CSV error: {str(e)}")
        return jsonify({"status": "error", "message": "CSV export failed"}), 500
