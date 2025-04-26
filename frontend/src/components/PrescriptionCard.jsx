import React, { useState } from "react";
import { toast } from 'react-toastify';
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

const PrescriptionCard = ({ prescription }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);

        toast.success(isExpanded ? 'Prescription collapsed' : 'Prescription expanded', {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
    };

    return (
        <div className="prescription-card transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl hover:bg-gray-800 p-6 rounded-lg border border-gray-700 mb-4 cursor-pointer">
            <div className="flex justify-between items-center mb-3">
                <h3 className="medicine-name text-xl font-semibold text-purple-400">{prescription.medication}</h3>
                <button
                    onClick={toggleExpand}
                    className="text-purple-400"
                    aria-label={isExpanded ? "Collapse prescription details" : "Expand prescription details"}
                >
                    {isExpanded ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
                </button>
            </div>

            <div className={`info-row ${!isExpanded ? "hidden" : ""} mb-2`}>
                <span className="label text-lg font-medium text-text-muted">Dosage:</span>
                <span>{prescription.dosage}</span>
            </div>
            <div className={`info-row ${!isExpanded ? "hidden" : ""} mb-2`}>
                <span className="label text-lg font-medium text-text-muted">Prescribed by:</span>
                <span>{prescription.doctor_email}</span>
            </div>

            {isExpanded && (
                <div className="extra-info mt-4 text-text-muted">
                    <div className="info-row">
                        <span className="label">Prescription Date:</span>
                        <span>{new Date(prescription.date).toLocaleDateString()}</span>
                    </div>
                    <div className="info-row">
                        <span className="label">Status:</span>
                        <span className={`status ${prescription.status === "active" ? "text-green-400" : "text-red-400"}`}>{prescription.status}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrescriptionCard;
