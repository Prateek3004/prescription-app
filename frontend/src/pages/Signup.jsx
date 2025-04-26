import React, { useState } from 'react';
import axios from 'axios';
import './Signup.css';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Patient', // default role
    });

    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        try {
            const response = await axios.post('http://127.0.0.1:5000/users/signup', formData);
            if (response.data.status === 'success') {
                setMessage('✅ Signup successful!');
            } else {
                setMessage('❌ ' + response.data.message);
            }
        } catch (error) {
            console.error('Signup error:', error);
            setMessage('❌ Signup failed. Please try again.');
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-form">
                <h2>Signup</h2>
                {message && <p>{message}</p>}
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                    <br /><br />

                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <br /><br />

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <br /><br />

                    <div className="select-wrapper">
                        <select name="role" value={formData.role} onChange={handleChange} required>
                            <option value="Patient">Patient</option>
                            <option value="Doctor">Doctor</option>
                            <option value="Pharmacist">Pharmacist</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                    <br /><br />

                    <button type="submit">Signup</button>
                </form>
            </div>
        </div>
    );
};

export default Signup;
