import "./friend_main.css"
import Profile_friend from "../../../assets/profile_icon_friend.png"
import Add_friend from "../../../assets/add_friend.png"
import Default_profile from "../../../assets/profile_icon_main.png"
import { useState, useEffect } from "react"
import { toast } from 'react-toastify'


function Friend(){
    const [groupMembers, setGroupMembers] = useState([]);
    const [selectedGroupName, setSelectedGroupName] = useState('');

    useEffect(() => {
        const handleGroupSelected = async (event) => {
            const { groupId, groupName } = event.detail;
            setSelectedGroupName(groupName);
            
            try {
                // ดึงข้อมูลสมาชิกในกลุ่ม
                const response = await fetch(`http://localhost:3000/api/groupmember?groupId=${groupId}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const members = await response.json();
                console.log('Fetched members:', members); // Debug log
                
                // แปลงข้อมูลสมาชิกให้มี username จาก user object
                const membersWithDetails = members.map((member) => ({
                    user_id: member.user_id,
                    username: member.user?.name || 'Unknown User',
                    profile_image: member.user?.profile_image || null,
                    role: member.role
                }));
                
                console.log('Members with details:', membersWithDetails); // Debug log
                setGroupMembers(membersWithDetails);
            } catch (error) {
                console.error('Error fetching group members:', error);
                toast.error('Failed to load group members');
            }
        };

        window.addEventListener('groupSelected', handleGroupSelected);

        return () => {
            window.removeEventListener('groupSelected', handleGroupSelected);
        };
    }, []);

    return(
        <div className="profile_friend">
            {selectedGroupName && (
                <div className="group-name-display">{selectedGroupName} Members</div>
            )}
            <div className="members-container">
                {groupMembers.map((member) => (
                    <div key={member.user_id} className="member-item">
                        <img 
                            src={member.profile_image || Default_profile} 
                            alt={member.username} 
                            className="member-profile-image"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = Default_profile;
                            }}
                        />
                        <span className="member-name">{member.username}</span>
                    </div>
                ))}
                {groupMembers.length === 0 && !selectedGroupName && (
                    <div className="no-group-selected">
                        <img src={Add_friend} alt="Add friend" />
                        <span className="member-name">Select a group</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Friend;