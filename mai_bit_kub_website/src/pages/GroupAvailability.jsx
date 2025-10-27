import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./GroupAvailability.css";
import { toast } from 'react-toastify';

function GroupAvailability() {
  const navigate = useNavigate();
  const location = useLocation();
  const [groupAvailability, setGroupAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupInfo, setGroupInfo] = useState(null);
  const [recommendedActivities, setRecommendedActivities] = useState([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [scheduledActivities, setScheduledActivities] = useState([]);

  // Get user ID from localStorage
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      setCurrentUser({ user_id: parseInt(userId) });
    }
  }, []);

  // รับ groupId จาก state ที่ส่งมา
  const groupId = location.state?.groupId;

  useEffect(() => {
    if (!groupId) {
      toast.error('Please select a group first');
      navigate(-1);
      return;
    }

    fetchGroupAvailability();
    fetchScheduledActivities();
  }, [groupId]);



  const fetchGroupAvailability = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/find_availability?groupId=${groupId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      setGroupInfo(data.group);
      setGroupAvailability(data.availabilities || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching group availability:', error);
      toast.error('Failed to load group availability');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    };
    // Get the formatted date and remove all commas
    return date.toLocaleDateString('en-US', options).replace(/,/g, '');
  };

  const formatTime = (dateString) => {
    // สร้าง Date object จาก ISO string และใช้เวลาท้องถิ่น
    const date = new Date(dateString);
    const localTime = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
    return `${String(localTime.getHours()).padStart(2, '0')}:00`;
  };

  const groupByDate = (availabilities) => {
    const grouped = {};
    
    availabilities.forEach(avail => {
      const dateKey = new Date(avail.start_datetime).toLocaleDateString('en-CA');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(avail);
    });

    return grouped;
  };

  const fetchScheduledActivities = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/scheduled-activities?groupId=${groupId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      console.log('Fetched scheduled activities:', data);
      
      // เช็คหาข้อมูลที่ซ้ำกัน
      const uniqueActivities = data.filter((activity, index, self) =>
        index === self.findIndex((a) => (
          a.scheduled_id === activity.scheduled_id
        ))
      );
      
      if (uniqueActivities.length !== data.length) {
        console.warn('Found duplicate activities. Original:', data.length, 'Unique:', uniqueActivities.length);
      }
      
      setScheduledActivities(uniqueActivities);
    } catch (error) {
      console.error('Error fetching scheduled activities:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดกิจกรรมที่นัดไว้');
    }
  };

  const handleScheduleActivity = async (timeSlot) => {
    try {
      console.log('Opening modal for time slot:', timeSlot);
      setSelectedTimeSlot(timeSlot);
      const response = await fetch(`http://localhost:3000/api/recommend-activities?groupId=${groupId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      console.log('Received activities:', data.recommendedActivities);
      
      if (!data.recommendedActivities || data.recommendedActivities.length === 0) {
        toast.info('No recommended activities found. Please ask members to add their interests first.');
        return;
      }

      setRecommendedActivities(data.recommendedActivities);
      setShowActivityModal(true);
    } catch (error) {
      console.error('Error fetching activity recommendations:', error);
      toast.error('Failed to load recommended activities');
    }
  };

  const handleSelectActivity = async (activity) => {
    try {
      const formatToMySQLDatetime = (date) => {
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().slice(0, 19).replace('T', ' ');
      };

      const requestData = {
        groupId: groupId,
        activityId: activity.activity_id,
        startDatetime: formatToMySQLDatetime(selectedTimeSlot.start),
        endDatetime: formatToMySQLDatetime(selectedTimeSlot.end),
        createdBy: currentUser.user_id
      };
      console.log('Sending data:', requestData);
      
      const response = await fetch('http://localhost:3000/api/scheduled-activities', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      await response.json();
      toast.success(`Successfully scheduled ${activity.activity_name}`, {
        icon: "🎉"
      });
      setShowActivityModal(false);
      
      // Reload scheduled activities
      fetchScheduledActivities();
    } catch (error) {
      console.error('Error scheduling activity:', error);
      toast.error('Failed to schedule activity');
    }
  };

  const groupedData = groupByDate(groupAvailability);

  if (loading) {
    return (
      <div className="group-availability-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="group-availability-container">
      <div className="availability-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ←
        </button>
        <h1>Group</h1>
      </div>
      
      {groupInfo && (
        <div className="group-details-container">
          <div className="group-details-row">
            <span>Max Members: {groupInfo.max_members}</span>
            <span>Created: {new Date(groupInfo.created_at).toLocaleDateString('en-US').replace(/,/g, '')}</span>
          </div>
        </div>
      )}

      {/* แสดงกิจกรรมที่นัดไว้ */}
      {scheduledActivities.length > 0 && (
        <div className="scheduled-activities">
          <h3>Scheduled Activities</h3>
          <div className="scheduled-activities-list">
            {scheduledActivities.map((scheduled) => (
              <div key={scheduled.scheduled_id} className="scheduled-activity-card">
                <div className="activity-info">
                  <h4>{scheduled.activity.activity_name}</h4>
                  <p className="activity-time">
                    {formatDate(scheduled.start_datetime)}
                    <br />
                    {formatTime(scheduled.start_datetime)} - {formatTime(scheduled.end_datetime)}
                  </p>
                </div>
                <div className="activity-meta">
                  <span className="scheduled-by">Scheduled by: {scheduled.creator.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="availability-content">
        {Object.keys(groupedData).length === 0 ? (
          <div className="no-data">
            <p>No availability data found for this group.</p>
            <p>Members need to submit their available times first.</p>
          </div>
        ) : (
          <div className="availability-list">
            {Object.entries(groupedData)
              .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
              .map(([date, availabilities]) => (
                <div key={date} className="date-section">
                  <h3 className="date-header">{formatDate(date)}</h3>
                  
                  <div className="members-availability">
                    {availabilities.map((avail, index) => (
                      <div key={index} className="member-card">
                        <div className="member-info">
                          <div className="member-avatar">
                            {avail.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="member-details">
                            <h4>{avail.user.name}</h4>
                            <p className="member-email">{avail.user.email}</p>
                          </div>
                        </div>
                        
                        <div className="time-info">
                          <div className="time-range">
                            <span className="time-label">Available:</span>
                            <span className="time-value">
                              {formatTime(avail.start_datetime)} - {formatTime(avail.end_datetime)}
                            </span>
                          </div>
                          {avail.note && (
                            <div className="note">
                              <span className="note-label">Note:</span>
                              <span className="note-text">{avail.note}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* แสดงเวลาที่ตรงกันทั้งหมด */}
                  <div className="common-times">
                    <h4>Match Available Date</h4>
                    {findCommonTimes(availabilities).length > 0 ? (
                      <div className="common-times-list">
                        {findCommonTimes(availabilities).map((time, idx) => (
                          <div key={idx} className="common-time-slot">
                            <div className="time-info">
                              {formatTime(time.start)} - {formatTime(time.end)}
                              <span className="member-count">
                                {time.members.length} Members Available
                              </span>
                            </div>
                            {currentUser && groupInfo && groupInfo.groupmember?.some(member => 
                              member.user_id === currentUser.user_id && member.role === 'admin'
                            ) && (
                              <button 
                                className="schedule-activity-btn"
                                onClick={() => handleScheduleActivity(time)}
                              >
                                Schedule Activity
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-common-time">No overlapping times found</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Modal for recommended activities */}
      {showActivityModal && (
        <div className="activity-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Recommended Activities</h2>
              <button 
                className="close-modal-icon"
                onClick={() => setShowActivityModal(false)}
              >
                ✕
              </button>
            </div>
            {/* <div className="selected-time">
              <div className="time-details">
                <div className="time-container">
                  <p className="time-label">Selected Time</p>
                  <p className="time-value">{formatTime(selectedTimeSlot.start)} - {formatTime(selectedTimeSlot.end)}</p>
                </div>
                <p className="members-available">{selectedTimeSlot.members.length} Members Available</p>
              </div>
            </div> */}
            <div className="activity-list">
              {recommendedActivities.map((activity) => (
                <div key={activity.activity_id} className="activity-item">
                  <div className="activity-header">
                    <h3>{activity.activity_name}</h3>
                    <span className="popularity-badge">
                      {activity.popularity || 0} Interested
                    </span>
                  </div>
                  <div className="activity-details">
                    <div className="detail-row">
                      <span className="detail-icon">📂</span>
                      <span className="detail-label">Category:</span>
                      <span className="detail-value">{activity.category}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-icon">💰</span>
                      <span className="detail-label">Budget:</span>
                      <span className="detail-value">${activity.min_cost.toLocaleString()} - ${activity.max_cost.toLocaleString()}</span>
                    </div>
                  </div>
                  <button 
                    className="select-activity-btn"
                    onClick={() => handleSelectActivity(activity)}
                  >
                    <span className="btn-icon">✓</span>
                    Select Activity
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

}

// ฟังก์ชันหาเวลาที่ตรงกัน
function findCommonTimes(availabilities) {
  if (availabilities.length < 2) return [];

  const commonTimes = [];
  
  // เปรียบเทียบทุกคู่ของ availabilities
  for (let i = 0; i < availabilities.length; i++) {
    for (let j = i + 1; j < availabilities.length; j++) {
      const avail1 = availabilities[i];
      const avail2 = availabilities[j];
      
      // Parse dates in local time
      const start1 = new Date(avail1.start_datetime);
      const end1 = new Date(avail1.end_datetime);
      const start2 = new Date(avail2.start_datetime);
      const end2 = new Date(avail2.end_datetime);

      // หาช่วงเวลาที่ทับซ้อนกัน
      const overlapStart = new Date(Math.max(start1, start2));
      const overlapEnd = new Date(Math.min(end1, end2));

      if (overlapStart < overlapEnd) {
        // มีเวลาที่ทับซ้อนกัน
        const existingTime = commonTimes.find(
          time => time.start.getTime() === overlapStart.getTime() && 
                  time.end.getTime() === overlapEnd.getTime()
        );

        if (existingTime) {
          // เพิ่มสมาชิกที่มีเวลาตรงกัน
          if (!existingTime.members.includes(avail1.user.name)) {
            existingTime.members.push(avail1.user.name);
          }
          if (!existingTime.members.includes(avail2.user.name)) {
            existingTime.members.push(avail2.user.name);
          }
        } else {
          commonTimes.push({
            start: overlapStart,
            end: overlapEnd,
            members: [avail1.user.name, avail2.user.name]
          });
        }
      }
    }
  }

  return commonTimes.sort((a, b) => a.start - b.start);
}

export default GroupAvailability;
