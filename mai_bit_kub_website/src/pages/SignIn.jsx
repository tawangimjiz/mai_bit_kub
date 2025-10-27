import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./SignIn.css";
import logo from "../assets/logo_mai_bit_kub.png";

function SignIn() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // แสดง loading toast
        const loadingToast = toast.loading("Signing in...");

        try {
            const res = await fetch("http://localhost:3000/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: username, password }),
            });

            const data = await res.json();

            if (res.ok) {
                if (data.user && data.user.name) {
                    localStorage.setItem('username', data.user.name);
                    localStorage.setItem('userId', data.user.user_id);
                    localStorage.setItem('isAuthenticated', 'true');
                    
                    // อัพเดท toast เป็นสำเร็จ
                    toast.update(loadingToast, {
                        render: "Welcome! 👋",
                        type: "success",
                        isLoading: false,
                        autoClose: 2000
                    });
                    
                    // รอให้ toast แสดงเสร็จแล้วค่อย navigate
                    setTimeout(() => {
                        navigate("/main_page");
                    }, 1000);
                }
            } else {
                // อัพเดท toast เป็น error
                toast.update(loadingToast, {
                    render: data.message || "Invalid username or password",
                    type: "error",
                    isLoading: false,
                    autoClose: 3000
                });
            }
        } catch (err) {
            console.error("Login fetch error:", err);
            // อัพเดท toast เป็น error
            toast.update(loadingToast, {
                render: "Connection error. Please try again.",
                type: "error",
                isLoading: false,
                autoClose: 3000
            });
        }
    };

    return (
        <div className="sign-bg">
            <ToastContainer 
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
            />
            <div className="sign-container fade-in">
                <div className="sign-left">
                    <img src={logo} alt="Mai Bit Kub Logo" className="sign-logo" />
                    <p className="sign-desc">Mai bit kub helps you connect with your friend</p>
                </div>
                <div className="sign-right">
                    <h2 className="sign-form-title">Sign in to MAi Bit Kub</h2>
                    <form className="sign-form" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="EMAIL"
                            className="sign-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="PASSWORD"
                            className="sign-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <div className="sign-remember">
                            <span>REMEMBER</span>
                            <span
                                className={`toggle-remember${remember ? " active" : ""}`}
                                onClick={() => setRemember(!remember)}
                                tabIndex={0}
                                role="button"
                                aria-pressed={remember}
                            >
                                <span className="toggle-circle" />
                            </span>
                        </div>
                        <button type="submit" className="sign-btn login-btn">Login</button>
                    </form>
                    <div className="sign-bottom-text">
                        DON’T HAVE AN ACCOUNT? <Link to="/signup" className="sign-link">SIGN UP</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SignIn;
