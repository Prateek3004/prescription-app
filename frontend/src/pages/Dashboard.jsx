import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import axios from "axios";
import { saveAs } from "file-saver";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "./Dashboard.css";

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({});
    const [prescriptions, setPrescriptions] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        patient_email: "",
        medicine: "",
        dosage: "",
        note: "",
        date: ""
    });
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [sortOrder, setSortOrder] = useState("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [showPrescriptions, setShowPrescriptions] = useState(false);
    const [showLastSevenDays, setShowLastSevenDays] = useState(true);
    const prescriptionsPerPage = 5;

    const [stats, setStats] = useState({
        users: 0,
        doctors: 0,
        patients: 0,
        total_prescriptions: 0,
        active_prescriptions: 0,
        gender_stats: {
            doctors: { male: 0, female: 0 },
            patients: { male: 0, female: 0 }
        }
    });

    // Colors for charts
    const COLORS = ["#4287f5", "#f54242"];

    // Data memoization for charts
    const doctorGenderData = useMemo(() => [
        { name: "Male Doctors", value: stats.gender_stats.doctors.male, percentage: calculatePercentage(stats.gender_stats.doctors.male, stats.gender_stats.doctors.male + stats.gender_stats.doctors.female) },
        { name: "Female Doctors", value: stats.gender_stats.doctors.female, percentage: calculatePercentage(stats.gender_stats.doctors.female, stats.gender_stats.doctors.male + stats.gender_stats.doctors.female) }
    ], [stats.gender_stats.doctors]);

    const patientGenderData = useMemo(() => [
        { name: "Male Patients", value: stats.gender_stats.patients.male, percentage: calculatePercentage(stats.gender_stats.patients.male, stats.gender_stats.patients.male + stats.gender_stats.patients.female) },
        { name: "Female Patients", value: stats.gender_stats.patients.female, percentage: calculatePercentage(stats.gender_stats.patients.female, stats.gender_stats.patients.male + stats.gender_stats.patients.female) }
    ], [stats.gender_stats.patients]);

    // Calculate percentage helper function
    function calculatePercentage(value, total) {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    }

    // Fetch data on component mount
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const userData = JSON.parse(localStorage.getItem("user"));
                if (!userData) {
                    navigate("/");
                    return;
                }

                setUser(userData);
                await Promise.all([
                    fetchDashboardStats(),
                    userData.role === "Doctor" && fetchDoctorPrescriptions(userData.email),
                    userData.role === "Doctor" && fetchPatients()
                ]);

                setLoading(false);
            } catch (error) {
                console.error("Error fetching initial data:", error);
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // Optimized data fetch functions with memoization
    const fetchDoctorPrescriptions = useCallback(async (email) => {
        try {
            const res = await axios.get(`http://127.0.0.1:5000/prescriptions/doctor/${email}`);
            setPrescriptions(res.data.prescriptions || []);
            return res.data.prescriptions;
        } catch (error) {
            console.error("Error fetching prescriptions:", error);
            return [];
        }
    }, []);

    const fetchPatients = useCallback(async () => {
        try {
            const res = await axios.get("http://127.0.0.1:5000/patients");
            setPatients(res.data.patients || []);
            return res.data.patients;
        } catch (error) {
            console.error("Error fetching patients list:", error);
            return [];
        }
    }, []);

    const fetchDashboardStats = useCallback(async () => {
        try {
            const res = await axios.get("http://127.0.0.1:5000/dashboard");
            const statsData = {
                users: res.data.total_users,
                doctors: res.data.total_doctors,
                patients: res.data.total_patients,
                total_prescriptions: res.data.total_prescriptions,
                active_prescriptions: res.data.active_prescriptions,
                gender_stats: res.data.genderStats
            };
            setStats(statsData);
            return statsData;
        } catch (err) {
            console.error("Stats fetch failed:", err);
            return stats;
        }
    }, [stats]);

    // Get last 7 days prescriptions
    const lastSevenDaysPrescriptions = useMemo(() => {
        const now = new Date();
        const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
        return prescriptions.filter(p => new Date(p.created_at) >= sevenDaysAgo);
    }, [prescriptions]);

    // Action handlers
    const handleLogout = () => {
        localStorage.clear();
        navigate("/");
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddOrEdit = async (e) => {
        e.preventDefault();

        const payload = {
            doctor_email: user.email,
            patient_email: formData.patient_email,
            medication: formData.medicine,
            dosage: formData.dosage,
            note: formData.note,
            date: formData.date
        };

        try {
            if (editMode) {
                await axios.put(`http://127.0.0.1:5000/prescriptions/update/${editId}`, payload);
                alert("Prescription updated successfully!");
            } else {
                await axios.post("http://127.0.0.1:5000/prescriptions/add", payload);
                alert("Prescription added successfully!");
            }

            // Reset form
            setFormData({
                patient_email: "",
                medicine: "",
                dosage: "",
                note: "",
                date: ""
            });
            setEditMode(false);
            setEditId(null);

            // Refresh prescriptions
            if (user.email) {
                await fetchDoctorPrescriptions(user.email);
            }
        } catch (err) {
            console.error("Error submitting prescription:", err);
            alert("Failed to submit prescription. Please try again.");
        }
    };

    const handleEdit = (prescription) => {
        setEditMode(true);
        setEditId(prescription.id);
        setFormData({
            patient_email: prescription.patient_email,
            medicine: prescription.medication,
            dosage: prescription.dosage,
            note: prescription.note || "",
            date: prescription.date ? prescription.date.slice(0, 10) : ""
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this prescription?")) {
            try {
                await axios.delete(`http://127.0.0.1:5000/prescriptions/delete/${id}`);
                if (user.email) {
                    await fetchDoctorPrescriptions(user.email);
                }
            } catch (error) {
                console.error("Error deleting prescription:", error);
            }
        }
    };

    const handleSortToggle = () => {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    };

    const handleExportCSV = () => {
        const header = "Patient Email,Medicine,Dosage,Note,Date\n";
        const csvRows = prescriptions.map(p =>
            `${p.patient_email},${p.medication},${p.dosage},${p.note || ""},${p.date || new Date(p.created_at).toLocaleDateString()}`
        ).join("\n");

        const blob = new Blob([header + csvRows], { type: "text/csv" });
        saveAs(blob, "prescriptions.csv");
    };

    // Pagination algorithm
    const paginatedPrescriptions = useMemo(() => {
        const indexOfLast = currentPage * prescriptionsPerPage;
        const indexOfFirst = indexOfLast - prescriptionsPerPage;

        // Apply sorting
        const sorted = [...prescriptions].sort((a, b) =>
            sortOrder === "asc"
                ? new Date(a.created_at) - new Date(b.created_at)
                : new Date(b.created_at) - new Date(a.created_at)
        );

        return sorted.slice(indexOfFirst, indexOfLast);
    }, [prescriptions, currentPage, sortOrder, prescriptionsPerPage]);

    const totalPages = Math.ceil(prescriptions.length / prescriptionsPerPage);

    // Custom pie chart label
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
        const RADIAN = Math.PI / 180;
        const radius = outerRadius * 1.1;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill={COLORS[index % COLORS.length]}
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    if (loading) {
        return <div className="loading-container">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="main-content">
                <Topbar user={user} onLogout={handleLogout} />

                <div className="dashboard-body">
                    <h1 className="dashboard-title">Dashboard</h1>

                    {/* Stats Cards */}
                    <div className="stats-container">
                        <div className="stat-card users">
                            <div className="stat-icon">
                                <i className="fas fa-users"></i>
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{stats.users}</span>
                                <span className="stat-label">USERS</span>
                            </div>
                        </div>

                        <div className="stat-card doctors">
                            <div className="stat-icon">
                                <i className="fas fa-user-md"></i>
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{stats.doctors}</span>
                                <span className="stat-label">DOCTORS</span>
                            </div>
                        </div>

                        <div className="stat-card patients">
                            <div className="stat-icon">
                                <i className="fas fa-procedures"></i>
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{stats.patients}</span>
                                <span className="stat-label">PATIENTS</span>
                            </div>
                        </div>
                    </div>

                    {/* Gender Charts */}
                    <div className="charts-container">
                        <div className="chart-card">
                            <h3>Gender Wise Patients</h3>
                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={patientGenderData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={renderCustomizedLabel}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {patientGenderData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value, name) => [`${value} (${patientGenderData.find(item => item.name === name)?.percentage}%)`, name]} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="chart-card">
                            <h3>Gender Wise Doctors</h3>
                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={doctorGenderData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={renderCustomizedLabel}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {doctorGenderData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value, name) => [`${value} (${doctorGenderData.find(item => item.name === name)?.percentage}%)`, name]} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Prescriptions Section */}
                    <div className="prescriptions-section">
                        <div className="section-header">
                            <h2 className="section-title">LAST 7 DAYS PRESCRIPTIONS</h2>
                            <button className="toggle-btn" onClick={() => setShowLastSevenDays(!showLastSevenDays)}>
                                {showLastSevenDays ? "▲" : "▼"}
                            </button>
                        </div>

                        {showLastSevenDays && (
                            <div className="prescriptions-list">
                                {lastSevenDaysPrescriptions.length > 0 ? (
                                    lastSevenDaysPrescriptions.map((p) => (
                                        <div key={p.id} className="prescription-card">
                                            <div className="prescription-header">
                                                <h3>{p.medication}</h3>
                                                <div className="prescription-actions">
                                                    <button className="edit-btn" onClick={() => handleEdit(p)}>Edit</button>
                                                    <button className="delete-btn" onClick={() => handleDelete(p.id)}>Delete</button>
                                                </div>
                                            </div>
                                            <div className="prescription-details">
                                                <p><strong>Patient:</strong> {p.patient_email}</p>
                                                <p><strong>Dosage:</strong> {p.dosage}</p>
                                                <p><strong>Note:</strong> {p.note || "—"}</p>
                                                <p><strong>Date:</strong> {p.date || new Date(p.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-data">No prescriptions in the last 7 days.</p>
                                )}
                            </div>
                        )}

                        {/* Add/Edit Prescription Form */}
                        <div className="prescription-form-container">
                            <h2>{editMode ? "Edit Prescription" : "Add New Prescription"}</h2>
                            <form onSubmit={handleAddOrEdit} className="prescription-form">
                                <div className="form-group">
                                    <label>Patient:</label>
                                    <select
                                        name="patient_email"
                                        value={formData.patient_email}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Patient</option>
                                        {patients.map((patient, idx) => (
                                            <option key={idx} value={patient.email}>{patient.email}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Medicine:</label>
                                    <input
                                        type="text"
                                        name="medicine"
                                        value={formData.medicine}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Dosage:</label>
                                    <input
                                        type="text"
                                        name="dosage"
                                        value={formData.dosage}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Note:</label>
                                    <input
                                        type="text"
                                        name="note"
                                        value={formData.note}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Date:</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="submit-btn">
                                        {editMode ? "Update Prescription" : "Add Prescription"}
                                    </button>
                                    {editMode && (
                                        <button
                                            type="button"
                                            className="cancel-btn"
                                            onClick={() => {
                                                setEditMode(false);
                                                setEditId(null);
                                                setFormData({
                                                    patient_email: "",
                                                    medicine: "",
                                                    dosage: "",
                                                    note: "",
                                                    date: ""
                                                });
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* All Prescriptions Section */}
                        <div className="all-prescriptions-section">
                            <div className="section-header">
                                <h2 className="section-title">All Prescriptions</h2>
                                <div className="section-actions">
                                    <button className="sort-btn" onClick={handleSortToggle}>
                                        Sort: {sortOrder === "asc" ? "Oldest First" : "Newest First"}
                                    </button>
                                    <button className="export-btn" onClick={handleExportCSV}>
                                        Export CSV
                                    </button>
                                    <button className="toggle-btn" onClick={() => setShowPrescriptions(!showPrescriptions)}>
                                        {showPrescriptions ? "▲" : "▼"}
                                    </button>
                                </div>
                            </div>

                            {showPrescriptions && (
                                <>
                                    <div className="prescriptions-list">
                                        {paginatedPrescriptions.length > 0 ? (
                                            paginatedPrescriptions.map((p) => (
                                                <div key={p.id} className="prescription-card">
                                                    <div className="prescription-header">
                                                        <h3>{p.medication}</h3>
                                                        <div className="prescription-actions">
                                                            <button className="edit-btn" onClick={() => handleEdit(p)}>Edit</button>
                                                            <button className="delete-btn" onClick={() => handleDelete(p.id)}>Delete</button>
                                                        </div>
                                                    </div>
                                                    <div className="prescription-details">
                                                        <p><strong>Patient:</strong> {p.patient_email}</p>
                                                        <p><strong>Dosage:</strong> {p.dosage}</p>
                                                        <p><strong>Note:</strong> {p.note || "—"}</p>
                                                        <p><strong>Date:</strong> {p.date || new Date(p.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="no-data">No prescriptions found.</p>
                                        )}
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="pagination">
                                            {[...Array(totalPages)].map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(i + 1)}
                                                    className={currentPage === i + 1 ? "active" : ""}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;