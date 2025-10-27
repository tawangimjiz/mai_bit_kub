import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./SignUp.css";
import logo from "../assets/logo_mai_bit_kub.png";

export default function SignUp() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    React.useEffect(() => {
        toast.info("Welcome to Sign Up page!", {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // ตรวจสอบข้อมูลก่อนส่ง
        if (!email || !username || !password) {
            toast.error("Please fill in all fields", {
                position: "top-center",
                autoClose: 5000
            });
            return;
        }

        // ตรวจสอบรูปแบบอีเมล
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Please enter a valid email address", {
                position: "top-center",
                autoClose: 5000
            });
            return;
        }

        try {
            const res = await fetch("http://localhost:3000/api/user", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ email, name: username, password })
            });

            console.log('Response status:', res.status);

            const responseData = await res.json();

            if (res.ok) {
                toast.success("Sign up successful! Redirecting to sign in...", {
                    position: "top-center",
                    autoClose: 4000
                });
                setTimeout(() => {
                    navigate('/signin');
                }, 4500);
                return;  // ออกจากฟังก์ชันเมื่อสำเร็จ
            }
            
            // เช็คข้อความ error ที่ได้จาก API
            if (responseData.error === "Email already exists") {
                toast.error("This email is already registered. Please use a different email or sign in.", {
                    position: "top-center",
                    autoClose: 5000
                });
            } else {
                const errorMessage = responseData.error || "Something went wrong. Please try again.";
                toast.error(errorMessage, {
                    position: "top-center",
                    autoClose: 5000
                });
            }
        } catch (err) {
            console.error('Error during signup:', err);
            toast.error("Something went wrong. Please try again later.");
        }
    };

    return (
        <div className="signup-bg">
            <div className="signup-container fade-in">
                <div className="signup-left">
                    <img src={logo} alt="Mai Bit Kub Logo" className="signup-logo" />
                    <p className="signup-desc">Mai bit kub helps you connect with your friend</p>
                </div>
                <div className="signup-right">
                    <h2 className="signup-form-title">Sign up for MAi Bit Kub</h2>
                    <form className="signup-form" onSubmit={handleSubmit}>
                        <input 
                            type="email" 
                            placeholder="EMAIL" 
                            className="signup-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input 
                            type="text" 
                            placeholder="USERNAME" 
                            className="signup-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <input 
                            type="password" 
                            placeholder="PASSWORD" 
                            className="signup-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button type="submit" className="signup-btn">Sign Up</button>
                    </form>
                    <div className="signup-bottom-text">
                        ALREADY HAVE AN ACCOUNT? <Link to="/signin" className="signup-link">SIGN IN</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
