import React from "react";

const StatCard = ({ title, value, icon, color }) => {
    return (
        <div className={`bg-gray-800 p-6 rounded shadow-md text-white w-full max-w-xs`}>
            <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold">{title}</span>
                <span className={`text-3xl ${color}`}>{icon}</span>
            </div>
            <h2 className="text-2xl font-bold text-purple-400">{value}</h2>
        </div>
    );
};

export default StatCard;
