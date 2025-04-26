-- Create the Database
CREATE DATABASE IF NOT EXISTS prescription_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE prescription_db;

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('Doctor', 'Patient', 'Pharmacist', 'Admin') NOT NULL,
    password VARCHAR(255) NOT NULL,  -- Changed from BLOB to VARCHAR to store bcrypt
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    patient_id INT NOT NULL,
    medication VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    instructions TEXT DEFAULT '',  -- Optional but editable
    status ENUM('Active', 'Completed', 'Pending') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Pharmacist Verification Table (Optional)
CREATE TABLE IF NOT EXISTS prescription_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prescription_id INT NOT NULL,
    pharmacist_id INT NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP NULL,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (pharmacist_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for Performance
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_status ON prescriptions(status);
CREATE INDEX idx_doctor ON prescriptions(doctor_id);
CREATE INDEX idx_patient ON prescriptions(patient_id);
