import React from "react";
import { FiChevronDown } from "react-icons/fi";
import { FaSun, FaMoon } from "react-icons/fa";
import "./topbar.css";

const Topbar = ({ user, onLogout, isDarkMode, toggleTheme, isSidebarCollapsed }) => {
    // fallback URL for avatars
    const avatarUrl = user?.avatar || `https://i.pravatar.cc/150?u=${user?.email || "default"}`;

    return (
        <div className={`topbar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="user-profile">
                <div className="user-avatar">
                    <img
                        src={avatarUrl}
                        alt="User Avatar"
                        onError={(e) => (e.target.src = "https://i.pravatar.cc/150?u=default")}
                    />
                </div>
                <div className="user-name">{user?.name || "User"}</div>
                <FiChevronDown className="dropdown-icon" />
            </div>

            <div className="theme-toggle" onClick={toggleTheme}>
                {isDarkMode ? <FaSun /> : <FaMoon />}
            </div>
        </div>
    );
};

export default Topbar;
