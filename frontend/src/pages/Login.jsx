import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css"; // Ensure to include the CSS file for styles

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        console.log("Sending login data:", { email, password });

        try {
            const response = await axios.post(
                "http://127.0.0.1:5000/users/login",
                { email, password },
                { headers: { "Content-Type": "application/json" } }
            );

            if (response.data.status === "success") {
                const user = response.data.user;
                console.log("Logged in user:", user);

                localStorage.setItem("auth", "true");
                localStorage.setItem("user", JSON.stringify(user));

                // Normalize the role to lowercase
                const role = user.role?.toLowerCase();

                if (role === "doctor") {
                    navigate("/dashboard");
                } else if (role === "patient") {
                    navigate("/patient-dashboard");
                } else {
                    console.error("Unknown role received:", role);
                    alert("Unknown user role. Please contact support.");
                }
            } else {
                alert(response.data.message);
            }
        } catch (error) {
            console.error("Login error:", error.response?.data || error.message);
            alert("Login failed. Please try again.");
        }
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <h1>Login</h1>
                <form onSubmit={handleLogin}>
                    <input
                        type="email"
                        placeholder="Username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit">Log In</button>
                    <p>Don't have an account? <a href="/signup">Register</a></p>
                </form>
            </div>
        </div>
    );
}

export default Login;
