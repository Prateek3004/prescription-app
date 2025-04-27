// Sidebar.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiHome, FiUser, FiFileText, FiBarChart2, FiMenu, FiX } from "react-icons/fi";
import "./sidebar.css";

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(true);

    const toggleSidebar = () => setIsOpen(!isOpen);

    const isActive = (path) => location.pathname === path;

    // Get user role from localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role?.toLowerCase(); // Make sure role is lowercase
    const dashboardPath = role === "doctor" ? "/dashboard" : "/patient-dashboard";

    return (
        <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
            <div className="toggle-button" onClick={toggleSidebar}>
                {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </div>

            <div className="sidebar-logo">
                <h2 className="sidebar-title">Dashboard</h2>
            </div>

            <div className="sidebar-menu">
                <SidebarButton
                    icon={<FiHome size={20} />}
                    text="Dashboard"
                    path={dashboardPath}
                    navigate={navigate}
                    isActive={isActive(dashboardPath)}
                />

                <SidebarButton
                    icon={<FiFileText size={20} />}
                    text="Prescription"
                    path="/prescription"
                    navigate={navigate}
                    isActive={isActive("/prescription")}
                />

            </div>
        </div>
    );
};

const SidebarButton = ({ icon, text, path, navigate, isActive }) => (
    <div
        onClick={() => navigate(path)}
        className={`sidebar-button ${isActive ? "active" : ""}`}
    >
        <span className="icon">{icon}</span>
        <span className="text">{text}</span>
    </div>
);

export default Sidebar;
