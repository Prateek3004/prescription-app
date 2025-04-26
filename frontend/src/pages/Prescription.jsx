import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { ChevronDown, Plus, Calendar, User, Clock, Pill, Moon, FileText, Home } from "lucide-react";
import './prescription.css';

const Prescription = () => {
    const [data, setData] = useState([]);
    const [medicine, setMedicine] = useState("");
    const [dosage, setDosage] = useState("");
    const [patientEmail, setPatientEmail] = useState("");
    const [expandedCard, setExpandedCard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role?.toLowerCase(); // doctor or patient

    const fetchPrescriptions = () => {
        setLoading(true);
        const endpoint =
            role === "doctor"
                ? `http://127.0.0.1:5000/prescriptions/doctor/${user.email}`
                : `http://127.0.0.1:5000/prescriptions/patient/${user.email}`;

        axios
            .get(endpoint)
            .then((res) => {
                if (res.data.status === "success") {
                    setData(res.data.prescriptions);
                    console.log("Fetched prescriptions:", res.data.prescriptions); // Debug log
                } else {
                    console.error("Error fetching prescriptions:", res.data.message);
                }
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching prescriptions:", error);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    const handleAddPrescription = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://127.0.0.1:5000/prescriptions/add", {
                doctor_email: user.email,
                patient_email: patientEmail,
                medication: medicine,
                dosage: dosage,
            });

            // Show success notification
            setNotification({
                show: true,
                message: res.data.message,
                type: "success",
            });

            // Reset form fields
            setMedicine("");
            setDosage("");
            setPatientEmail("");

            // Refresh prescription list
            fetchPrescriptions();
        } catch (error) {
            console.error("Error adding prescription:", error);
            setNotification({
                show: true,
                message: "Failed to add prescription",
                type: "error",
            });
        }
    };

    const [notification, setNotification] = useState({
        show: false,
        message: "",
        type: "success",
    });

    const toggleExpand = (id) => {
        console.log("Toggling card:", id); // Debug log
        if (expandedCard === id) {
            setExpandedCard(null);
        } else {
            setExpandedCard(id);
        }
    };

    // Create ripple effect on button click
    const createRipple = (event) => {
        const button = event.currentTarget;
        const ripple = document.createElement("span");
        const rect = button.getBoundingClientRect();

        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        ripple.style.width = ripple.style.height = `${diameter}px`;
        ripple.style.left = `${event.clientX - rect.left - radius}px`;
        ripple.style.top = `${event.clientY - rect.top - radius}px`;
        ripple.classList.add("ripple");

        const rippleContainer = button.getElementsByClassName("ripple")[0];
        if (rippleContainer) {
            rippleContainer.remove();
        }

        button.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 800);
    };

    useEffect(() => {
        if (notification.show) {
            const timer = setTimeout(() => {
                setNotification({ ...notification, show: false });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.body.classList.toggle('dark-mode');
    };

    // Helper function to check if a card is expanded
    const isCardExpanded = (id) => {
        return expandedCard === id;
    };

    return (
        <div className={`prescription-container ${darkMode ? 'dark-mode' : ''}`}>
            {/* Header */}
            <header className="header p-4 flex justify-between items-center">
                <h1 className="page-title">Prescription Manager</h1>

                <div className="nav-buttons">
                    <button
                        className="nav-button"
                        onClick={() => window.location.href = "/dashboard"}
                    >
                        <Home size={18} />
                        Dashboard
                    </button>
                    <button className="nav-button active">
                        <FileText size={18} />
                        Prescriptions
                    </button>
                    <button
                        className="nav-button"
                        onClick={toggleDarkMode}
                    >
                        <Moon size={18} />
                        Dark Mode
                    </button>
                </div>
            </header>

            <div className="p-6">
                <div className="max-w-5xl mx-auto">
                    <div className="content-panel fade-in mb-6">
                        <div className="panel-header">
                            <div className="panel-title">
                                <div className="panel-icon">
                                    <FileText size={20} />
                                </div>
                                Prescriptions
                            </div>
                        </div>

                        {/* Notification */}
                        {notification.show && (
                            <div className={`notification ${notification.type} mb-4`}>
                                {notification.message}
                            </div>
                        )}

                        <div className="p-6">
                            {/* Add Prescription Form for Doctors */}
                            {role === "doctor" && (
                                <div className="form-container mb-8">
                                    <div className="form-header">
                                        <Plus size={18} />
                                        <h3 className="form-title">Add New Prescription</h3>
                                    </div>

                                    <form onSubmit={handleAddPrescription}>
                                        <div className="form-body">
                                            <div className="form-grid">
                                                <div className="form-group">
                                                    <label className="form-label">
                                                        Patient Email
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={patientEmail}
                                                        onChange={(e) => setPatientEmail(e.target.value)}
                                                        className="form-input"
                                                        required
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">
                                                        Medicine Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={medicine}
                                                        onChange={(e) => setMedicine(e.target.value)}
                                                        className="form-input"
                                                        required
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">
                                                        Dosage
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={dosage}
                                                        onChange={(e) => setDosage(e.target.value)}
                                                        className="form-input"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-footer">
                                            <button
                                                type="submit"
                                                className="btn btn-primary"
                                                onClick={createRipple}
                                            >
                                                <Plus size={18} />
                                                Add Prescription
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Prescriptions List */}
                            {loading ? (
                                <div className="loading-container">
                                    <div className="spinner"></div>
                                </div>
                            ) : data.length > 0 ? (
                                <div className="prescription-list">
                                    {data.map((prescription, index) => {
                                        // For debugging
                                        const cardId = prescription.id || index;
                                        const expanded = isCardExpanded(cardId);
                                        console.log(`Card ${cardId}:`, prescription, "Expanded:", expanded);

                                        return (
                                            <div
                                                key={cardId}
                                                className="prescription-card"
                                            >
                                                <div
                                                    className="card-header"
                                                    onClick={() => toggleExpand(cardId)}
                                                >
                                                    <div>
                                                        <h3 className="medication-name">
                                                            {prescription.medication}
                                                        </h3>
                                                        <p className="medication-subtitle">
                                                            {role === "doctor"
                                                                ? `Patient: ${prescription.patient_email}`
                                                                : `Dr. ${prescription.doctor_email?.split('@')[0] || "Unknown"}`}
                                                        </p>
                                                    </div>

                                                    <div className={`chevron ${expanded ? 'expanded' : ''}`}>
                                                        <ChevronDown size={20} />
                                                    </div>
                                                </div>

                                                {/* Always render but use CSS to show/hide */}
                                                <div className="card-content" style={{ display: expanded ? 'block' : 'none' }}>
                                                    <div className="detail-grid">
                                                        {/* Dosage */}
                                                        <div className="detail-item">
                                                            <div className="detail-label">
                                                                <Pill size={16} /> Dosage
                                                            </div>
                                                            <div className="detail-value">
                                                                {prescription.dosage || "Not specified"}
                                                            </div>
                                                        </div>

                                                        {/* Prescribed By */}
                                                        <div className="detail-item">
                                                            <div className="detail-label">
                                                                <User size={16} /> Prescribed By
                                                            </div>
                                                            <div className="detail-value">
                                                                {prescription.doctor_email || "Unknown"}
                                                            </div>
                                                        </div>

                                                        {/* Prescribed Date */}
                                                        <div className="detail-item">
                                                            <div className="detail-label">
                                                                <Calendar size={16} /> Prescribed Date
                                                            </div>
                                                            <div className="detail-value">
                                                                {prescription.date
                                                                    ? new Date(prescription.date).toLocaleDateString('en-US', {
                                                                        year: 'numeric',
                                                                        month: 'long',
                                                                        day: 'numeric'
                                                                    })
                                                                    : 'Not available'}
                                                            </div>
                                                        </div>

                                                        {/* Status - Only for patients */}
                                                        {role === "patient" && (
                                                            <div className="detail-item">
                                                                <div className="detail-label">
                                                                    <Clock size={16} /> Status
                                                                </div>
                                                                <div className="detail-value">
                                                                    {prescription.status || "Active"}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <p className="empty-text">
                                        No prescriptions found
                                    </p>
                                    {role === "doctor" && (
                                        <p className="empty-subtext">
                                            Add your first prescription using the form above.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Prescription;