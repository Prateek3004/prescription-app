// navbar.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import './navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isDarkMode, setIsDarkMode] = useState(true);

    // Check if the theme preference is stored in localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark") {
            setIsDarkMode(true);
            document.documentElement.classList.add("dark");
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove("dark");
        }
    }, []);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        const newTheme = !isDarkMode ? "dark" : "light";
        localStorage.setItem("theme", newTheme);
        document.documentElement.classList.toggle("dark", !isDarkMode);
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="navbar">
            <div className="navbar-logo" onClick={() => navigate("/dashboard")}>
                Prescription Manager
            </div>

            <div className="navbar-buttons">
                <button
                    onClick={() => navigate("/dashboard")}
                    className={`navbar-button ${isActive("/dashboard") ? "active" : ""}`}
                >
                    Dashboard
                </button>

                <button
                    onClick={() => navigate("/prescription")}
                    className={`navbar-button ${isActive("/prescription") ? "active" : ""}`}
                >
                    Prescriptions
                </button>

                <button
                    onClick={toggleTheme}
                    className="navbar-button theme-toggle"
                >
                    {isDarkMode ? "Light Mode" : "Dark Mode"}
                </button>
            </div>
        </div>
    );
};

export default Navbar;