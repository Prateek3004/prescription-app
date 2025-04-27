import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import axios from "axios";
import { saveAs } from "file-saver";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import "./PatientDashboard.css";

const PatientDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({});
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [upcomingMedication, setUpcomingMedication] = useState([]);
    const [healthTips, setHealthTips] = useState([]);
    const prescriptionsPerPage = 5;

    // Dark mode state
    const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
    // Check for new prescriptions to show notifications
    const [lastPrescriptionCount, setLastPrescriptionCount] = useState(0);

    // Apply dark mode class when state changes
    useEffect(() => {
        const container = document.querySelector('.dashboard-container');
        if (container) {
            if (darkMode) {
                container.classList.add('dark');
            } else {
                container.classList.remove('dark');
            }
        }

        // Save preference to localStorage
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);

    // Toggle dark mode function
    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    // Fetch data on component mount
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const userData = JSON.parse(localStorage.getItem("user"));
                if (!userData || userData.role !== "Patient") {
                    navigate("/");
                    return;
                }

                setUser(userData);
                const prescriptionsData = await fetchPatientPrescriptions(userData.email);

                // Generate upcoming medication reminders
                generateUpcomingMedication(prescriptionsData);

                // Load health tips
                loadHealthTips();

                // Check for new prescriptions
                const storedCount = parseInt(localStorage.getItem("prescriptionCount") || "0");
                if (prescriptionsData.length > storedCount && storedCount !== 0) {
                    setToastMessage(`You have ${prescriptionsData.length - storedCount} new prescription(s)!`);
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 5000);
                }
                localStorage.setItem("prescriptionCount", prescriptionsData.length.toString());

                setLoading(false);
            } catch (error) {
                console.error("Error fetching initial data:", error);
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [navigate]);

    // Load health tips
    const loadHealthTips = () => {
        const tips = [
            "Take your medications as prescribed by your doctor.",
            "Stay hydrated by drinking at least 8 glasses of water daily.",
            "Aim for 7-8 hours of quality sleep each night.",
            "Include fruits and vegetables in every meal.",
            "Take short breaks from screen time to reduce eye strain.",
            "Regular physical activity can help reduce stress and improve overall health.",
            "Practice mindfulness or meditation for mental well-being."
        ];

        // Randomly select 3 tips
        const selectedTips = [];
        const usedIndices = new Set();

        while (selectedTips.length < 3 && selectedTips.length < tips.length) {
            const randomIndex = Math.floor(Math.random() * tips.length);
            if (!usedIndices.has(randomIndex)) {
                selectedTips.push(tips[randomIndex]);
                usedIndices.add(randomIndex);
            }
        }

        setHealthTips(selectedTips);
    };

    // Generate upcoming medication reminders
    const generateUpcomingMedication = (prescriptionsData) => {
        if (!prescriptionsData.length) return;

        // Get recent medications (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentMedications = prescriptionsData.filter(p =>
            new Date(p.created_at) >= thirtyDaysAgo
        ).slice(0, 3);

        setUpcomingMedication(recentMedications);
    };

    // Optimized data fetch function
    const fetchPatientPrescriptions = useCallback(async (email) => {
        try {
            const res = await axios.get(`http://127.0.0.1:5000/prescriptions/patient/${email}`);
            const prescriptionsData = res.data.prescriptions || [];
            setPrescriptions(prescriptionsData);
            return prescriptionsData;
        } catch (error) {
            console.error("Error fetching prescriptions:", error);
            setPrescriptions([]);
            return [];
        }
    }, []);

    // Get last prescription date
    const lastPrescriptionDate = useMemo(() => {
        if (prescriptions.length === 0) return "No prescriptions";

        const sorted = [...prescriptions].sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at));

        return new Date(sorted[0].created_at).toLocaleDateString();
    }, [prescriptions]);

    // Filtered and sorted prescriptions
    const filteredPrescriptions = useMemo(() => {
        return prescriptions.filter(p =>
            p.medication.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.doctor_name && p.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()))
        ).sort((a, b) =>
            sortOrder === "asc"
                ? new Date(a.created_at) - new Date(b.created_at)
                : new Date(b.created_at) - new Date(a.created_at)
        );
    }, [prescriptions, searchTerm, sortOrder]);

    // Paginated prescriptions
    const paginatedPrescriptions = useMemo(() => {
        const indexOfLast = currentPage * prescriptionsPerPage;
        const indexOfFirst = indexOfLast - prescriptionsPerPage;
        return filteredPrescriptions.slice(indexOfFirst, indexOfLast);
    }, [filteredPrescriptions, currentPage]);

    const totalPages = Math.ceil(filteredPrescriptions.length / prescriptionsPerPage);

    // Format doctor name function
    const formatDoctorName = (prescription) => {
        if (prescription.doctor_name) return prescription.doctor_name;
        if (prescription.doctor_email) {
            const nameFromEmail = prescription.doctor_email.split('@')[0];
            // Capitalize first letter of each word
            return "Dr. " + nameFromEmail
                .split('.')
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' ');
        }
        return "Unknown Doctor";
    };

    // Prepare chart data for medicine usage over time
    const chartData = useMemo(() => {
        const medicationCount = {};

        // Group by month and count medications
        prescriptions.forEach(p => {
            const date = new Date(p.date || p.created_at);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;

            if (!medicationCount[monthYear]) {
                medicationCount[monthYear] = {};
            }

            if (!medicationCount[monthYear][p.medication]) {
                medicationCount[monthYear][p.medication] = 1;
            } else {
                medicationCount[monthYear][p.medication]++;
            }
        });

        // Convert to chart data format
        const chartData = Object.keys(medicationCount).map(monthYear => {
            const dataPoint = { name: monthYear };

            Object.keys(medicationCount[monthYear]).forEach(med => {
                dataPoint[med] = medicationCount[monthYear][med];
            });

            return dataPoint;
        });

        // Sort by date
        chartData.sort((a, b) => {
            const [monthA, yearA] = a.name.split('/');
            const [monthB, yearB] = b.name.split('/');
            return new Date(yearA, monthA - 1) - new Date(yearB, monthB - 1);
        });

        return chartData;
    }, [prescriptions]);

    // Generate random colors for chart lines
    const getRandomColor = () => {
        const colors = ['#5170E1', '#4CAF50', '#F44336', '#FF9800', '#9C27B0', '#00BCD4'];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    // Get unique medications for chart
    const medications = useMemo(() => {
        const meds = new Set();
        prescriptions.forEach(p => meds.add(p.medication));
        return Array.from(meds);
    }, [prescriptions]);

    // Action handlers
    const handleLogout = () => {
        localStorage.clear();
        navigate("/");
    };

    const handleSortToggle = () => {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    const handleViewPrescription = (prescription) => {
        setSelectedPrescription(prescription);
        setShowModal(true);
    };

    const handleExportCSV = () => {
        const header = "Medicine,Dosage,Doctor,Date\n";
        const csvRows = prescriptions.map(p =>
            `${p.medication},${p.dosage},${formatDoctorName(p)},${p.date || new Date(p.created_at).toLocaleDateString()}`
        ).join("\n");

        const blob = new Blob([header + csvRows], { type: "text/csv" });
        saveAs(blob, "my_prescriptions.csv");
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(18);
        doc.text("My Prescriptions", 105, 15, { align: "center" });

        // Add patient info
        doc.setFontSize(12);
        doc.text(`Patient: ${user.name || user.email}`, 14, 30);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 37);

        // Create table headers
        const headers = [["Medicine", "Dosage", "Doctor", "Date"]];

        // Create data rows
        const data = prescriptions.map(p => [
            p.medication,
            p.dosage,
            formatDoctorName(p),
            p.date || new Date(p.created_at).toLocaleDateString()
        ]);

        // Create table
        doc.autoTable({
            startY: 45,
            head: headers,
            body: data,
            theme: 'striped',
            headStyles: { fillColor: [81, 112, 225] }
        });

        doc.save("my_prescriptions.pdf");
    };

    if (loading) {
        return <div className="loading-container">Loading...</div>;
    }

    return (
        <div className={`dashboard-container ${darkMode ? 'dark' : ''}`}>
            <Sidebar
                onLogout={handleLogout}
                userRole="Patient"
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
            />
            <div className="main-content">
                <Topbar
                    user={user}
                    onLogout={handleLogout}
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                />

                <div className="dashboard-body">
                    {/* Toast Notification */}
                    {showToast && (
                        <div className="toast-notification">
                            <div className="toast-content">
                                <span className="toast-icon">🔔</span>
                                <span className="toast-message">{toastMessage}</span>
                            </div>
                            <button className="toast-close" onClick={() => setShowToast(false)}>×</button>
                        </div>
                    )}

                    <div className="dashboard-title">
                        Welcome, {user.name || user.email}
                        <p className="welcome-subtitle">Here's your health dashboard</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="stats-container">
                        <div className="stat-card patients">
                            <div className="stat-icon">
                                <i className="fas fa-prescription-bottle"></i>
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{prescriptions.length}</span>
                                <span className="stat-label">TOTAL PRESCRIPTIONS</span>
                            </div>
                        </div>

                        <div className="stat-card doctors">
                            <div className="stat-icon">
                                <i className="fas fa-calendar-alt"></i>
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{lastPrescriptionDate}</span>
                                <span className="stat-label">LAST PRESCRIPTION</span>
                            </div>
                        </div>
                    </div>

                    {/* Medication Reminders */}
                    <div className="chart-card">
                        <h3>Upcoming Medication Reminders</h3>
                        {upcomingMedication.length > 0 ? (
                            <div className="reminders-container">
                                {upcomingMedication.map((med, index) => (
                                    <div className="reminder-item" key={index}>
                                        <div className="reminder-icon">
                                            <i className="fas fa-pills"></i>
                                        </div>
                                        <div className="reminder-details">
                                            <h4>{med.medication}</h4>
                                            <p>{med.dosage}</p>
                                            <p>Prescribed by: {formatDoctorName(med)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-data">No recent medications to remind you of</div>
                        )}
                    </div>

                    {/* Health Tips Section */}
                    <div className="chart-card">
                        <h3>Health Tips For You</h3>
                        <div className="health-tips-container">
                            {healthTips.map((tip, index) => (
                                <div className="health-tip" key={index}>
                                    <div className="tip-icon">💡</div>
                                    <p>{tip}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Search and Controls */}
                    <div className="section-header">
                        <h2 className="section-title">My Prescriptions</h2>
                        <div className="section-actions">
                            <button className="sort-btn" onClick={handleSortToggle}>
                                <i className={`fas fa-sort-${sortOrder === "asc" ? "up" : "down"}`}></i>
                                {sortOrder === "asc" ? " Oldest First" : " Newest First"}
                            </button>
                            <button className="export-btn" onClick={handleExportCSV}>
                                <i className="fas fa-file-csv"></i> CSV
                            </button>
                            <button className="export-btn" onClick={handleExportPDF}>
                                <i className="fas fa-file-pdf"></i> PDF
                            </button>
                        </div>
                    </div>

                    <div className="search-box" style={{ marginBottom: '20px' }}>
                        <input
                            type="text"
                            placeholder="Search by medicine or doctor..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="search-input"
                        />
                        <i className="search-icon fas fa-search"></i>
                    </div>

                    {/* Prescriptions Table */}
                    <div className="chart-card">
                        {prescriptions.length > 0 ? (
                            <>
                                <div className="prescriptions-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Medicine Name</th>
                                                <th>Dosage</th>
                                                <th>Doctor Name</th>
                                                <th>Date Issued</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedPrescriptions.map((p) => (
                                                <tr key={p.id} onClick={() => handleViewPrescription(p)}>
                                                    <td>{p.medication}</td>
                                                    <td>{p.dosage}</td>
                                                    <td>{formatDoctorName(p)}</td>
                                                    <td>{p.date || new Date(p.created_at).toLocaleDateString()}</td>
                                                    <td>
                                                        <button className="edit-btn" onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewPrescription(p);
                                                        }}>
                                                            View Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
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
                        ) : (
                            <div className="no-data">
                                <div className="empty-icon">
                                    <i className="fas fa-prescription-bottle-alt"></i>
                                </div>
                                <h3>No prescriptions found</h3>
                                <p>You don't have any prescriptions in your records yet.</p>
                            </div>
                        )}
                    </div>

                    {/* Prescription History Chart */}
                    {prescriptions.length > 0 && (
                        <div className="chart-card">
                            <h3>Prescription History</h3>
                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        {medications.map((med, index) => (
                                            <Line
                                                key={med}
                                                type="monotone"
                                                dataKey={med}
                                                stroke={getRandomColor()}
                                                activeDot={{ r: 8 }}
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Prescription Detail Modal */}
            {showModal && selectedPrescription && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Prescription Details</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <div className="modal-body">
                            <div className="detail-row">
                                <span className="detail-label">Medicine:</span>
                                <span className="detail-value">{selectedPrescription.medication}</span>
                            </div>

                            <div className="detail-row">
                                <span className="detail-label">Dosage:</span>
                                <span className="detail-value">{selectedPrescription.dosage}</span>
                            </div>

                            <div className="detail-row">
                                <span className="detail-label">Doctor:</span>
                                <span className="detail-value">
                                    {formatDoctorName(selectedPrescription)}
                                </span>
                            </div>

                            <div className="detail-row">
                                <span className="detail-label">Date Issued:</span>
                                <span className="detail-value">
                                    {selectedPrescription.date ||
                                        new Date(selectedPrescription.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            {selectedPrescription.note && (
                                <div className="detail-row">
                                    <span className="detail-label">Notes:</span>
                                    <span className="detail-value note">{selectedPrescription.note}</span>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="submit-btn" onClick={() => setShowModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientDashboard;