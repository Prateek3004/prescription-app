import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const GenderChart = ({ title, maleCount, femaleCount }) => {
    const data = {
        labels: ["Male", "Female"],
        datasets: [
            {
                label: "Gender Distribution",
                data: [maleCount, femaleCount],
                backgroundColor: ["#3B82F6", "#EF4444"],
                borderWidth: 1,
            },
        ],
    };

    return (
        <div className="bg-gray-800 p-4 rounded shadow-md w-full max-w-sm text-white">
            <h3 className="text-center mb-4 text-purple-400 font-semibold">{title}</h3>
            <Pie data={data} />
        </div>
    );
};

export default GenderChart;
