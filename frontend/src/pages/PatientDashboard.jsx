import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import axios from "axios";
import { saveAs } from "file-saver";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { jsPDF } from "jspdf";
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
    const prescriptionsPerPage = 5;

    // Check for new prescriptions to show notifications
    const [lastPrescriptionCount, setLastPrescriptionCount] = useState(0);

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
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
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
            `${p.medication},${p.dosage},${p.doctor_name || 'Unknown'},${p.date || new Date(p.created_at).toLocaleDateString()}`
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
            p.doctor_name || "Unknown",
            p.date || new Date(p.created_at).toLocaleDateString()
        ]);

        // Create table
        doc.autoTable({
            startY: 45,
            head: headers,
            body: data,
            theme: 'striped',
            headStyles: { fillColor: [15, 76, 129] }
        });

        doc.save("my_prescriptions.pdf");
    };

    if (loading) {
        return <div className="loading-container">Loading...</div>;
    }

    return (
        <div className="patient-dashboard-container">
            <Sidebar />
            <div className="main-content">
                <Topbar user={user} onLogout={handleLogout} />

                <div className="dashboard-body dark">
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

                    <div className="welcome-section">
                        <h1>Welcome, {user.name || user.email}</h1>
                        <p className="welcome-subtitle">Here's your health dashboard</p>
                    </div>

                    {/* Prescription Summary Cards */}
                    <div className="summary-container">
                        <div className="summary-card">
                            <div className="summary-icon">
                                <i className="fas fa-prescription-bottle"></i>
                            </div>
                            <div className="summary-info">
                                <span className="summary-value">{prescriptions.length}</span>
                                <span className="summary-label">TOTAL PRESCRIPTIONS</span>
                            </div>
                        </div>

                        <div className="summary-card">
                            <div className="summary-icon">
                                <i className="fas fa-calendar-alt"></i>
                            </div>
                            <div className="summary-info">
                                <span className="summary-value secondary">{lastPrescriptionDate}</span>
                                <span className="summary-label">LAST PRESCRIPTION</span>
                            </div>
                        </div>
                    </div>

                    {/* Prescription Search and Controls */}
                    <div className="controls-container">
                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="Search by medicine or doctor..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="search-input"
                            />
                            <i className="search-icon fas fa-search"></i>
                        </div>

                        <div className="controls-buttons">
                            <button className="control-btn sort" onClick={handleSortToggle}>
                                Sort: {sortOrder === "asc" ? "Oldest First" : "Newest First"}
                            </button>
                            <button className="control-btn export" onClick={handleExportCSV}>
                                Export CSV
                            </button>
                            <button className="control-btn export" onClick={handleExportPDF}>
                                Download PDF
                            </button>
                        </div>
                    </div>

                    {/* Prescriptions Table */}
                    <div className="prescriptions-table-container">
                        <h2 className="section-title">My Prescriptions</h2>

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
                                                    <td>{p.doctor_name || "Dr. " + p.doctor_email?.split('@')[0] || "Unknown"}</td>
                                                    <td>{p.date || new Date(p.created_at).toLocaleDateString()}</td>
                                                    <td>
                                                        <button className="view-btn" onClick={(e) => {
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
                            <div className="empty-state">
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
                        <div className="chart-container">
                            <h2 className="section-title">Prescription History</h2>
                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                        <XAxis dataKey="name" stroke="#999" />
                                        <YAxis stroke="#999" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#333',
                                                border: '1px solid #555',
                                                color: '#eee'
                                            }}
                                        />
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
                                    {selectedPrescription.doctor_name ||
                                        "Dr. " + selectedPrescription.doctor_email?.split('@')[0] ||
                                        "Unknown"}
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
                            <button className="modal-btn" onClick={() => setShowModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientDashboard;