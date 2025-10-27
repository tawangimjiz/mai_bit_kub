import './Header.css'
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";

import menu_first from '../../assets/menu.png'
import menu_second from '../../assets/menu_second.png'
import profilePic from '../../assets/logo_mai_bit_kub.png'
import home_first from '../../assets/home_first.png'
import home_second from '../../assets/home_second.png'
import notice_first from '../../assets/notice_first.png'
import notice_second from '../../assets/notice_second.png'
import profile_first from '../../assets/profile_first.png'
import profile_second from '../../assets/profile_second.png'

function button(first, second, unreadCount = 0){
    return(
        <div className="button">
            <img id="first" src={first} alt="" />
            <img id="second" src={second} alt="" />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
        </div>
    );
}

function Header(){

    const username = localStorage.getItem('username');
    const isSignedIn = !!username;
    const navigate = useNavigate();
    const location = useLocation();
    const isMainPage = location.pathname === '/main_page';

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileRef = useRef(null);
    const [showGroupsDropdown, setShowGroupsDropdown] = useState(false);
    const [userGroups, setUserGroups] = useState([]);
    const groupsDropdownRef = useRef(null);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // ดึงข้อมูลการแจ้งเตือน
    useEffect(() => {
        const fetchNotifications = async () => {
            const userId = localStorage.getItem('userId');
            if (!userId) return;

            try {
                const response = await fetch(`http://localhost:3000/api/notifications?userId=${userId}`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    setNotifications(data);
                    // อัพเดท unreadCount
                    const unread = data.filter(n => !n.is_read).length;
                    setUnreadCount(unread);
                }
            } catch (error) {
                console.error('Error fetching notifications:', error);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, []);

    // ดึงข้อมูลกลุ่มของ user
    useEffect(() => {
        const fetchUserGroups = async () => {
            const userId = localStorage.getItem('userId');
            if (!userId) return;

            try {
                const response = await fetch(`http://localhost:3000/api/group/user/${userId}`);
                if (response.ok) {
                    const data = await response.json();
                    setUserGroups(data || []);
                }
            } catch (error) {
                console.error('Error fetching user groups:', error);
            }
        };

        if (isSignedIn) {
            fetchUserGroups();
        }

        // Listen for group updates
        const handleGroupUpdate = () => fetchUserGroups();
        window.addEventListener('groupCreated', handleGroupUpdate);
        
        return () => {
            window.removeEventListener('groupCreated', handleGroupUpdate);
        };
    }, [isSignedIn]);

    // Handle read notification
    const handleNotificationClick = async (notificationId) => {
        try {
            const response = await fetch(`http://localhost:3000/api/notifications`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ notification_id: notificationId })
            });
            
            // Update local state
            setNotifications(prevNotifications => 
                prevNotifications.map(n => 
                    n.notification_id === notificationId 
                        ? { ...n, is_read: true }
                        : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (groupsDropdownRef.current && !groupsDropdownRef.current.contains(event.target)) {
                setShowGroupsDropdown(false);
            }
        }
        if (showGroupsDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showGroupsDropdown]);
    const [profileImage, setProfileImage] = useState(null);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setShowProfileMenu(false);
        navigate('/');
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        }
        if (showProfileMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProfileMenu]);

    useEffect(() => {
        const fetchProfileImage = async () => {
            if (isSignedIn) {
                try {
                    const userId = localStorage.getItem('userId');
                    if (userId) {
                        const response = await fetch(`http://localhost:3000/api/user/${userId}`);
                        if (response.ok) {
                            const userData = await response.json();
                            setProfileImage(userData.profile_image);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching profile image:', error);
                }
            }
        };

        fetchProfileImage();

        // Listen for profile updates
        const handleProfileUpdate = () => {
            fetchProfileImage();
        };
        window.addEventListener('profileUpdated', handleProfileUpdate);

        return () => {
            window.removeEventListener('profileUpdated', handleProfileUpdate);
        };
    }, [isSignedIn]);

    return (
        <header>
            {/* Logo */}
            <Link to="/" className="logo">
                <img id="logo" src={profilePic} alt="Logo" />
            </Link>

            {/* ปุ่มด้านขวา */}
            <div className="button_bar">
                <div 
                    onClick={() => {
                        if (isSignedIn) {
                            navigate('/main_page');
                        }
                    }} 
                    className="home_button" 
                    style={{ cursor: isSignedIn ? 'pointer' : 'default' }}
                >
                    {button(home_first, home_second)}
                </div>
                <div className="notice_button" onClick={() => setShowNotifications(!showNotifications)}>
                    {button(notice_first, notice_second, unreadCount)}
                    {showNotifications && (
                        <div className="notifications-dropdown">
                            <div className="notifications-header">
                                <span>การแจ้งเตือน</span>
                                {notifications.some(n => n.is_read) && (
                                    <button 
                                        className="clear-notifications-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const userId = localStorage.getItem('userId');
                                            fetch(
                                                `http://localhost:3000/api/notifications?userId=${userId}`,
                                                {
                                                    method: 'DELETE',
                                                    credentials: 'include'
                                                }
                                            ).then(response => {
                                                if (response.ok) {
                                                    setNotifications(prev => prev.filter(n => !n.is_read));
                                                }
                                            }).catch(error => {
                                                console.error('Error clearing notifications:', error);
                                            });
                                        }}
                                    >
                                        ล้างที่อ่านแล้ว
                                    </button>
                                )}
                            </div>
                            {notifications.length === 0 ? (
                                <div className="notification-item">ไม่มีการแจ้งเตือน</div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.notification_id}
                                        className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                                        onClick={() => handleNotificationClick(notification.notification_id)}
                                    >
                                        <div>{notification.message}</div>
                                        <div className="time">
                                            {new Date(notification.created_at).toLocaleString('th-TH')}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* ปุ่มโปรไฟล์ */}
                {isSignedIn && (
                    <div className="profile_button" ref={profileRef}>
                        <div 
                            onClick={() => setShowProfileMenu((v) => !v)}
                            className="profile-button-wrapper"
                            style={{cursor: 'pointer'}}
                        >
                            {profileImage ? (
                                <img 
                                    src={profileImage} 
                                    alt="Profile" 
                                    className="profile-image-header"
                                />
                            ) : (
                                button(profile_first, profile_second)
                            )}
                        </div>
                        {showProfileMenu && (
                            <div className="profile-dropdown">
                                <Link to="/edit-profile" className="username-link">
                                    {username}
                                </Link>
                                <button className="logout-btn" onClick={handleLogout}>
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}

export default Header;
