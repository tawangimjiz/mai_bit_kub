import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./available_main.css";
import { toast } from 'react-toastify';

function Available() {
  const navigate = useNavigate();
  
  // เดือนปัจจุบัน
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // เก็บวันที่เลือกหลายวัน
  const [selectedDates, setSelectedDates] = useState([]);

  // เก็บเวลาแต่ละวัน
  const [timeSelections, setTimeSelections] = useState({});

  // วันที่เลือกล่าสุดเพื่อแสดงแถบเวลา
  const [currentDate, setCurrentDate] = useState(null);

  // เก็บกลุ่มที่เลือก
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  // เก็บรายการกลุ่ม
  const [groups, setGroups] = useState([]);
  
  // เก็บเวลาที่เคยเลือกไว้แล้ว
  const [existingAvailabilities, setExistingAvailabilities] = useState([]);

  // State สำหรับ View Availability dropdown
  const [showGroupsDropdown, setShowGroupsDropdown] = useState(false);
  const groupsDropdownRef = useRef(null);

  // ฟังก์ชันตรวจสอบว่าช่วงเวลานี้ถูกเลือกไว้แล้วหรือไม่
  const isTimeSlotExisting = (date, timeSlot) => {
    if (!date || !existingAvailabilities.length) return false;

    const [startTime, endTime] = timeSlot.split(' - ');
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);

    // แปลงวันที่และเวลาเป็น Date objects
    const [year, month, day] = date.split('-').map(Number);
    const slotStart = new Date(Date.UTC(year, month - 1, day, startHour, 0, 0));
    const slotEnd = new Date(Date.UTC(year, month - 1, day, endHour, 0, 0));

    // ตรวจสอบว่ามีช่วงเวลาที่ซ้อนทับกันหรือไม่
    return existingAvailabilities.some(avail => {
      const existingStart = new Date(avail.start_datetime);
      const existingEnd = new Date(avail.end_datetime);
      return (slotStart < existingEnd && slotEnd > existingStart);
    });
  };

  // สร้างช่วงเวลา 24 ชั่วโมง
  const timeSlots = [
    "00:00 - 01:00", "01:00 - 02:00", "02:00 - 03:00", "03:00 - 04:00",
    "04:00 - 05:00", "05:00 - 06:00", "06:00 - 07:00", "07:00 - 08:00",
    "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
    "12:00 - 13:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00",
    "16:00 - 17:00", "17:00 - 18:00", "18:00 - 19:00", "19:00 - 20:00",
    "20:00 - 21:00", "21:00 - 22:00", "22:00 - 23:00", "23:00 - 00:00"
  ];

  // เลือกวัน
  const handleDayClick = (date) => {
    const dateStr = date.toLocaleDateString("en-CA"); // YYYY-MM-DD
    setCurrentDate(dateStr);

    setSelectedDates((prev) => {
      if (prev.includes(dateStr)) {
        // ถ้ายกเลิกวัน และวันนั้นเป็น currentDate → รีเซ็ต currentDate เป็น null
        if (currentDate === dateStr) setCurrentDate(null);
        return prev.filter((d) => d !== dateStr);
      } else {
        return [...prev, dateStr];
      }
    });
  };

  // เลือกเวลา
  const handleTimeClick = (dateStr, time) => {
    setTimeSelections((prev) => {
      const currentTimes = prev[dateStr] || [];
      if (currentTimes.includes(time)) {
        return { ...prev, [dateStr]: currentTimes.filter((t) => t !== time) };
      } else {
        return { ...prev, [dateStr]: [...currentTimes, time] };
      }
    });
  };

  // ปุ่มเลื่อนเดือน
  const handlePrevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  // ฟังก์ชันดึงข้อมูลเวลาที่เคยเลือกไว้
  const fetchExistingAvailabilities = async (groupId) => {
    const userId = localStorage.getItem('userId');
    if (!userId || !groupId) return;

    try {
      const response = await fetch(`http://localhost:3000/api/availability?userId=${userId}&groupId=${groupId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      setExistingAvailabilities(data);
    } catch (error) {
      console.error('Error fetching existing availabilities:', error);
      toast.error('Failed to load your existing availabilities');
    }
  };

  // ดึงข้อมูลกลุ่มเมื่อ component โหลด
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const fetchGroups = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/group/user/${userId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        setGroups(data || []);
      } catch (error) {
        console.error('Error fetching groups:', error);
        toast.error('Failed to load groups');
      }
    };

    fetchGroups();
  }, []);

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

  // ตรวจสอบเวลาที่ซ้ำกัน
  const checkOverlap = async (userId, groupId, startTime, endTime) => {
    try {
      const response = await fetch(`http://localhost:3000/api/availability?userId=${userId}&groupId=${groupId}`);
      if (!response.ok) throw new Error('Failed to check availability');
      
      const existingAvailabilities = await response.json();
      const newStart = new Date(startTime).getTime();
      const newEnd = new Date(endTime).getTime();

      return existingAvailabilities.some(avail => {
        const existingStart = new Date(avail.start_datetime).getTime();
        const existingEnd = new Date(avail.end_datetime).getTime();
        return (newStart < existingEnd && newEnd > existingStart);
      });
    } catch (error) {
      console.error('Error checking overlap:', error);
      return false;
    }
  };

  // บันทึกวันและเวลาว่าง
  const handleSaveAvailability = async () => {
    if (!selectedGroup) {
      toast.error('Please select a group first');
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast.error('User not logged in');
      return;
    }

    // สร้าง availability data
    const availabilities = [];
    
    Object.entries(timeSelections).forEach(([date, times]) => {
      times.forEach(time => {
        // แยกเวลาเริ่มต้นและสิ้นสุด เช่น "01:00 - 02:00"
        const [startTime, endTime] = time.split(' - ');
        const [startHour] = startTime.split(':').map(Number);
        
        // แปลงวันที่และเวลา
        const [year, month, day] = date.split('-').map(Number);
        const startDate = new Date(year, month - 1, day, startHour, 0, 0);
        
        // สร้าง Date object สำหรับเวลาสิ้นสุด
        let endDate;
        if (endTime === "00:00") {
          // กรณีเที่ยงคืน ให้เป็นวันถัดไป
          endDate = new Date(year, month - 1, day + 1, 0, 0, 0);
        } else {
          const [endHour] = endTime.split(':').map(Number);
          endDate = new Date(year, month - 1, day, endHour, 0, 0);
        }

        // แปลงเวลากลับเป็นเวลาท้องถิ่นสำหรับ note
        const localStartDate = new Date(startDate);
        const localEndDate = new Date(endDate);
        const localStartTime = localStartDate.toLocaleTimeString('th-TH', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
        const localEndTime = localEndDate.toLocaleTimeString('th-TH', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
        
        console.log('Debug - Time conversion:', {
          date,
          originalTime: time,
          startLocal: localStartDate.toLocaleString('th-TH'),
          endLocal: localEndDate.toLocaleString('th-TH'),
          startUTC: startDate.toISOString(),
          endUTC: endDate.toISOString()
        });

        console.log('Debug - Selected time:', {
          originalTime: time,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });

        // ใช้เวลาจาก time slot โดยตรงเพราะเป็นเวลาท้องถิ่นอยู่แล้ว
        availabilities.push({
          user_id: parseInt(userId),
          group_id: selectedGroup.id,
          start_datetime: startDate.toISOString(),
          end_datetime: endDate.toISOString(),
          note: `Available on ${date} at ${time}`
        });
      });
    });

    // เก็บรายการเวลาที่ซ้ำ
    const overlappingTimes = new Set();
    
    // ตรวจสอบการซ้ำทั้งหมดก่อน
    for (const availability of availabilities) {
      const isOverlap = await checkOverlap(
        availability.user_id, 
        availability.group_id,
        availability.start_datetime,
        availability.end_datetime
      );

      if (isOverlap) {
        const date = new Date(availability.start_datetime);
        const hours = String(date.getHours()).padStart(2, '0');
        const localTime = `${hours}:00`;
        overlappingTimes.add(localTime);
      }
    }

    // แสดง toast error สำหรับเวลาที่ซ้ำทั้งหมดในครั้งเดียว
    if (overlappingTimes.size > 0) {
      const timeList = Array.from(overlappingTimes).join(", ");
      toast.error(`Time slots already booked: ${timeList}`);
    }

    // บันทึกเฉพาะเวลาที่ไม่ซ้ำ
    for (const availability of availabilities) {
      try {
        const isOverlap = await checkOverlap(
          availability.user_id, 
          availability.group_id,
          availability.start_datetime,
          availability.end_datetime
        );

        if (isOverlap) continue; // ข้ามการบันทึกถ้าซ้ำ

        const response = await fetch('http://localhost:3000/api/availability', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(availability)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        console.error('Error saving availability:', error);
        toast.error(`Failed to save availability for ${availability.start_datetime}`);
        return; // ออกจากลูปถ้ามี error
      }
    }

    // ถ้าบันทึกทั้งหมดสำเร็จ
    toast.success('All availabilities saved successfully!');
    // รีเซ็ตการเลือก
    setSelectedDates([]);
    setTimeSelections({});
    setCurrentDate(null);
    setSelectedGroup(null);
  };

  return (
    <div className="display-calendar">
      <div className="calendar-layout">
        {/* แถบเดือนซ้าย และปุ่ม View Availability */}
        <div className="month-column">
          <div className="month-selector">
            <button onClick={handlePrevMonth} className="arrow-btn">▲</button>
            <div className="month-name">
              {currentMonth.toLocaleString("eng", { month: "long", year: "numeric" })}
            </div>
            <button onClick={handleNextMonth} className="arrow-btn">▼</button>
          </div>

          {/* View Availability Button */}
          <div className="view-availability-container" ref={groupsDropdownRef}>
            <button 
              className="view-availability-btn"
              onClick={() => setShowGroupsDropdown(!showGroupsDropdown)}
            >
              View Availability
            </button>
            {showGroupsDropdown && (
              <div className="view-availability-dropdown">
                <div className="dropdown-header">Select Group</div>
                {groups.length > 0 ? (
                  groups.map(group => (
                    <div
                      key={group.id}
                      className="dropdown-group-item"
                      onClick={() => {
                        navigate('/group-availability', { 
                          state: { groupId: group.id } 
                        });
                        setShowGroupsDropdown(false);
                      }}
                    >
                      <span className="group-name">{group.group_name}</span>
                      <span className="group-members">
                        {group.current_members}/{group.max_members}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="dropdown-no-groups">No groups available</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ปฏิทินวันตรงกลาง */}
        <div className="calendar-container">
          <Calendar
            onClickDay={handleDayClick}
            value={null} // ใช้การเลือกหลายวันเอง
            activeStartDate={currentMonth}
            onActiveStartDateChange={({ activeStartDate }) => setCurrentMonth(activeStartDate)}
            tileClassName={({ date }) => {
              const dateStr = date.toLocaleDateString("en-CA"); // ใช้ format เดียวกับ currentDate
              return selectedDates.includes(dateStr) || timeSelections[dateStr]?.length > 0
                ? "selected-day"
                : "";
            }}
          />
        </div>

        {/* แถบเวลา ขวา */}
        <div className="time-selector">
          {/* Group selector */}
          <div className="group-selector">
            <div className="group-selector-header">Select Group</div>
            <div className="groups-list">
              {groups.map(group => (
                <div
                  key={group.id}
                  className={`group-select-item ${selectedGroup?.id === group.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedGroup(group);
                    fetchExistingAvailabilities(group.id);
                    // ส่ง event เพื่ออัพเดท Friend component
                    window.dispatchEvent(new CustomEvent('groupSelected', { 
                      detail: { groupId: group.id, groupName: group.group_name } 
                    }));
                  }}
                >
                  {group.group_name}
                </div>
              ))}
              {groups.length === 0 && (
                <div className="no-groups">No groups available</div>
              )}
            </div>
          </div>

          {!currentDate && <div className="select-day-text">Select Day</div>}
          {currentDate && (
            <div className="time-list">
              <div className="time-date">{currentDate}</div>
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className={`time-slot ${
                    timeSelections[currentDate]?.includes(time) ? "selected" : ""
                  } ${isTimeSlotExisting(currentDate, time) ? "existing" : ""}`}
                  onClick={() => handleTimeClick(currentDate, time)}
                >
                  {time}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save button */}
      {selectedGroup && (selectedDates.length > 0 || Object.keys(timeSelections).length > 0) && (
        <div className="save-container">
          <button onClick={handleSaveAvailability} className="save-button">
            Save Availability
          </button>
        </div>
      )}
    </div>
  );
}

export default Available;
