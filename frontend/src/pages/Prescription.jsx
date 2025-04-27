import React, { useEffect, useState } from "react";
import axios from "axios";
import { ChevronDown, Plus, Calendar, User, Clock, Pill, Moon, FileText, Home, Edit, Trash2, Calendar as CalendarIcon, AlignLeft } from "lucide-react";
import './prescription.css';

const Prescription = () => {
    const [data, setData] = useState([]);
    const [medicine, setMedicine] = useState("");
    const [dosage, setDosage] = useState("");
    const [patientEmail, setPatientEmail] = useState("");
    const [patientName, setPatientName] = useState("");
    const [prescriptionDate, setPrescriptionDate] = useState("");
    const [notes, setNotes] = useState("");
    const [expandedCard, setExpandedCard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState("");
    const [stats, setStats] = useState({
        totalPrescriptions: 0,
        activePrescriptions: 0,
        recentPrescriptions: 0
    });

    // Get user from localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role?.toLowerCase(); // doctor or patient

    // Check if user is logged in, redirect if not
    useEffect(() => {
        if (!user) {
            window.location.href = "/login";
            return;
        }

        // Redirect to appropriate dashboard if needed
        if (window.location.pathname === "/") {
            if (role === "doctor") {
                window.location.href = "/doctor-dashboard";
            } else if (role === "patient") {
                window.location.href = "/patient-dashboard";
            }
        }
    }, []);

    // Fetch patients list for dropdown (only for doctor)
    const fetchPatients = () => {
        if (role === "doctor") {
            axios.get(`http://127.0.0.1:5000/patients/doctor/${user.email}`)
                .then((res) => {
                    if (res.data.status === "success") {
                        setPatients(res.data.patients || []);
                    }
                })
                .catch((error) => {
                    console.error("Error fetching patients:", error);
                });
        }
    };

    // Calculate statistics for doctor dashboard
    const calculateStats = (prescriptions) => {
        if (role === "doctor") {
            const total = prescriptions.length;
            const active = prescriptions.filter(p => p.status === "Active" || !p.status).length;
            const recent = prescriptions.filter(p => {
                const prescDate = new Date(p.date);
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                return prescDate >= oneWeekAgo;
            }).length;

            setStats({
                totalPrescriptions: total,
                activePrescriptions: active,
                recentPrescriptions: recent
            });
        }
    };

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
                    // Process the data to ensure all required fields have values
                    const processedData = res.data.prescriptions.map(prescription => ({
                        ...prescription,
                        patient_name: prescription.patient_name || prescription.patient_email.split('@')[0],
                        doctor_name: prescription.doctor_name || prescription.doctor_email.split('@')[0],
                        date: prescription.date || new Date().toISOString().split('T')[0],
                        status: prescription.status || "Active",
                        notes: prescription.notes || "No additional notes"
                    }));
                    setData(processedData);
                    calculateStats(processedData);
                    console.log("Fetched prescriptions:", processedData);
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

    // Fetch prescriptions for a specific patient (doctor's view)
    const fetchPrescriptionsByPatient = (patientId) => {
        if (!patientId || role !== "doctor") return;

        setLoading(true);
        axios.get(`http://127.0.0.1:5000/prescriptions/patient/${patientId}`)
            .then((res) => {
                if (res.data.status === "success") {
                    const processedData = res.data.prescriptions.map(prescription => ({
                        ...prescription,
                        patient_name: prescription.patient_name || prescription.patient_email.split('@')[0],
                        doctor_name: prescription.doctor_name || prescription.doctor_email.split('@')[0],
                        date: prescription.date || new Date().toISOString().split('T')[0],
                        status: prescription.status || "Active",
                        notes: prescription.notes || "No additional notes"
                    }));
                    setData(processedData);
                    setNotification({
                        show: true,
                        message: `Showing prescriptions for ${patientId}`,
                        type: "info",
                    });
                } else {
                    setData([]);
                    setNotification({
                        show: true,
                        message: "No prescriptions found for this patient",
                        type: "info",
                    });
                }
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching patient prescriptions:", error);
                setLoading(false);
                setNotification({
                    show: true,
                    message: "Error fetching prescriptions",
                    type: "error",
                });
            });
    };

    useEffect(() => {
        fetchPrescriptions();
        fetchPatients();

        // Check for dark mode preference
        const isDarkMode = localStorage.getItem("darkMode") === "true";
        setDarkMode(isDarkMode);
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        }
    }, []);

    const handleAddPrescription = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://127.0.0.1:5000/prescriptions/add", {
                doctor_email: user.email,
                patient_email: patientEmail,
                patient_name: patientName,
                medication: medicine,
                dosage: dosage,
                date: prescriptionDate || new Date().toISOString().split('T')[0],
                notes: notes
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
            setPatientName("");
            setPrescriptionDate("");
            setNotes("");

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

    const handlePatientSelection = (e) => {
        const selectedPatientEmail = e.target.value;
        setSelectedPatient(selectedPatientEmail);

        if (selectedPatientEmail === "") {
            // Revert to all prescriptions for this doctor
            fetchPrescriptions();
        } else {
            // Fetch prescriptions for selected patient
            fetchPrescriptionsByPatient(selectedPatientEmail);
        }
    };

    const [notification, setNotification] = useState({
        show: false,
        message: "",
        type: "success",
    });

    const toggleExpand = (id) => {
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
        const newDarkModeValue = !darkMode;
        setDarkMode(newDarkModeValue);
        document.body.classList.toggle('dark-mode');
        localStorage.setItem("darkMode", newDarkModeValue);
    };

    // Helper function to check if a card is expanded
    const isCardExpanded = (id) => {
        return expandedCard === id;
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return "Not specified";

        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return "Invalid date";
        }
    };

    // Handle prescription status update
    const handleStatusUpdate = (id, newStatus) => {
        axios.put(`http://127.0.0.1:5000/prescriptions/update/${id}`, {
            status: newStatus
        })
            .then(res => {
                if (res.data.status === "success") {
                    setNotification({
                        show: true,
                        message: "Status updated successfully",
                        type: "success"
                    });
                    fetchPrescriptions();
                }
            })
            .catch(error => {
                console.error("Error updating status:", error);
                setNotification({
                    show: true,
                    message: "Failed to update status",
                    type: "error"
                });
            });
    };

    // Handle prescription deletion (for doctors only)
    const handleDeletePrescription = (id) => {
        if (window.confirm("Are you sure you want to delete this prescription?")) {
            axios.delete(`http://127.0.0.1:5000/prescriptions/delete/${id}`)
                .then(res => {
                    if (res.data.status === "success") {
                        setNotification({
                            show: true,
                            message: "Prescription deleted successfully",
                            type: "success"
                        });
                        fetchPrescriptions();
                    }
                })
                .catch(error => {
                    console.error("Error deleting prescription:", error);
                    setNotification({
                        show: true,
                        message: "Failed to delete prescription",
                        type: "error"
                    });
                });
        }
    };

    return (
        <div className={`prescription-container ${darkMode ? 'dark-mode' : ''}`}>
            {/* Header */}
            <header className="header p-4 flex justify-between items-center">
                <h1 className="page-title">
                    {role === "doctor" ? "Doctor's Prescription Portal" : "My Prescriptions"}
                </h1>

                <div className="nav-buttons">
                    <button
                        className="nav-button"
                        onClick={() => window.location.href = role === "doctor" ? "/doctor-dashboard" : "/patient-dashboard"}
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
                        {darkMode ? "Light Mode" : "Dark Mode"}
                    </button>
                </div>
            </header>

            <div className="p-6">
                <div className="max-w-5xl mx-auto">
                    {/* Doctor Stats Panel - Only for doctors */}
                    {role === "doctor" && (
                        <div className="stats-panel mb-6 fade-in">
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon">
                                        <FileText size={24} />
                                    </div>
                                    <div className="stat-content">
                                        <h3 className="stat-value">{stats.totalPrescriptions}</h3>
                                        <p className="stat-label">Total Prescriptions</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">
                                        <Clock size={24} />
                                    </div>
                                    <div className="stat-content">
                                        <h3 className="stat-value">{stats.activePrescriptions}</h3>
                                        <p className="stat-label">Active Prescriptions</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">
                                        <Calendar size={24} />
                                    </div>
                                    <div className="stat-content">
                                        <h3 className="stat-value">{stats.recentPrescriptions}</h3>
                                        <p className="stat-label">Last 7 Days</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="content-panel fade-in mb-6">
                        <div className="panel-header">
                            <div className="panel-title">
                                <div className="panel-icon">
                                    <FileText size={20} />
                                </div>
                                {role === "doctor" ? "Manage Prescriptions" : "My Prescription List"}
                            </div>
                        </div>

                        {/* Notification */}
                        {notification.show && (
                            <div className={`notification ${notification.type} mb-4`}>
                                {notification.message}
                            </div>
                        )}

                        <div className="p-6">
                            {/* Patient Filter - Only for doctors */}
                            {role === "doctor" && patients.length > 0 && (
                                <div className="filter-section mb-6">
                                    <label className="filter-label">Filter by Patient:</label>
                                    <select
                                        className="form-input"
                                        value={selectedPatient}
                                        onChange={handlePatientSelection}
                                    >
                                        <option value="">All Patients</option>
                                        {patients.map((patient, index) => (
                                            <option key={index} value={patient.email}>
                                                {patient.name || patient.email}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

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
                                                        <User size={16} /> Patient Email
                                                    </label>
                                                    <select
                                                        value={patientEmail}
                                                        onChange={(e) => {
                                                            setPatientEmail(e.target.value);
                                                            // Find the patient name if available
                                                            const selectedPatient = patients.find(p => p.email === e.target.value);
                                                            if (selectedPatient) {
                                                                setPatientName(selectedPatient.name || "");
                                                            } else {
                                                                setPatientName("");
                                                            }
                                                        }}
                                                        className="form-input"
                                                        required
                                                    >
                                                        <option value="">Select a patient</option>
                                                        {patients.map((patient, index) => (
                                                            <option key={index} value={patient.email}>
                                                                {patient.email} {patient.name ? `(${patient.name})` : ""}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">
                                                        <User size={16} /> Patient Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={patientName}
                                                        onChange={(e) => setPatientName(e.target.value)}
                                                        className="form-input"
                                                        placeholder="Full name"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">
                                                        <Pill size={16} /> Medicine Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={medicine}
                                                        onChange={(e) => setMedicine(e.target.value)}
                                                        className="form-input"
                                                        required
                                                        placeholder="Medicine name"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">
                                                        <Pill size={16} /> Dosage
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={dosage}
                                                        onChange={(e) => setDosage(e.target.value)}
                                                        className="form-input"
                                                        required
                                                        placeholder="e.g. 1 tablet 3 times a day"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">
                                                        <CalendarIcon size={16} /> Prescription Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={prescriptionDate}
                                                        onChange={(e) => setPrescriptionDate(e.target.value)}
                                                        className="form-input"
                                                    />
                                                </div>

                                                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                                                    <label className="form-label">
                                                        <AlignLeft size={16} /> Notes
                                                    </label>
                                                    <textarea
                                                        value={notes}
                                                        onChange={(e) => setNotes(e.target.value)}
                                                        className="form-input"
                                                        placeholder="Additional instructions or notes"
                                                        rows="3"
                                                        style={{ resize: "vertical", minHeight: "80px" }}
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
                                        const cardId = prescription.id || index;
                                        const expanded = isCardExpanded(cardId);
                                        const patientDisplayName = prescription.patient_name || prescription.patient_email.split('@')[0];
                                        const doctorDisplayName = prescription.doctor_name || `Dr. ${prescription.doctor_email?.split('@')[0] || "Unknown"}`;

                                        return (
                                            <div
                                                key={cardId}
                                                className={`prescription-card ${prescription.status === "Completed" ? "completed" : ""}`}
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
                                                                ? `Patient: ${patientDisplayName}`
                                                                : `Prescribed by: ${doctorDisplayName}`}
                                                        </p>
                                                    </div>

                                                    <div className={`chevron ${expanded ? 'expanded' : ''}`}>
                                                        <ChevronDown size={20} />
                                                    </div>
                                                </div>

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
                                                                <User size={16} /> {role === "doctor" ? "Patient" : "Prescribed By"}
                                                            </div>
                                                            <div className="detail-value">
                                                                {role === "doctor" ? patientDisplayName : doctorDisplayName}
                                                            </div>
                                                        </div>

                                                        {/* Prescribed Date */}
                                                        <div className="detail-item">
                                                            <div className="detail-label">
                                                                <Calendar size={16} /> Prescribed Date
                                                            </div>
                                                            <div className="detail-value">
                                                                {formatDate(prescription.date)}
                                                            </div>
                                                        </div>

                                                        {/* Status */}
                                                        <div className="detail-item">
                                                            <div className="detail-label">
                                                                <Clock size={16} /> Status
                                                            </div>
                                                            <div className="detail-value">
                                                                <span className={`status-badge ${prescription.status?.toLowerCase() || "active"}`}>
                                                                    {prescription.status || "Active"}
                                                                </span>

                                                                {/* Status Update for Patients */}
                                                                {role === "patient" && (
                                                                    <div className="status-actions">
                                                                        {prescription.status !== "Completed" && (
                                                                            <button
                                                                                className="btn btn-sm btn-outline"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleStatusUpdate(cardId, "Completed");
                                                                                }}
                                                                            >
                                                                                Mark as Completed
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Edit/Delete for Doctors */}
                                                                {role === "doctor" && (
                                                                    <div className="admin-actions">
                                                                        <button
                                                                            className="action-btn delete-btn"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDeletePrescription(cardId);
                                                                            }}
                                                                            title="Delete Prescription"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Notes - Full width */}
                                                        <div className="detail-item" style={{ gridColumn: "1 / -1" }}>
                                                            <div className="detail-label">
                                                                <AlignLeft size={16} /> Notes
                                                            </div>
                                                            <div className="detail-value">
                                                                {prescription.notes || "No additional notes"}
                                                            </div>
                                                        </div>
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
                                    {role === "patient" && (
                                        <p className="empty-subtext">
                                            You don't have any prescriptions yet. Please consult with your doctor.
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