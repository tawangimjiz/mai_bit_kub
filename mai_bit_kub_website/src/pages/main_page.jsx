import "./main_page.css"
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Blur_box from "../components/blur_box/blur_box.jsx"
import Budget_content from "../components/blur_box/content/budget_main.jsx"
import Activity_content from "../components/blur_box/content/activity_main.jsx"
import Friend_content from "../components/blur_box/content/friend_main.jsx"
import Avai_content from "../components/blur_box/content/available_main.jsx"
import GroupList from "../components/GroupList/GroupList.jsx"

function main_page(){
    const navigate = useNavigate();
    const [showGroupList, setShowGroupList] = useState(true);

    useEffect(() => {
        const username = localStorage.getItem('username');
        if (!username) {
            navigate('/signin');
        }
    }, [navigate]);

    return(
        <div className="main-layout">
            <div className={`sidebar ${showGroupList ? 'show' : 'hide'}`}>
                <button 
                    className="toggle-sidebar-btn"
                    onClick={() => setShowGroupList(!showGroupList)}
                >
                    {showGroupList ? '>' : '<'}
                </button>
                <GroupList />
            </div>
            <div className="main-content">
                <div className="top">
                    <Blur_box width={2} height={2}>
                        <Budget_content />
                    </Blur_box>
                    <Blur_box width={2} height={2}>
                        <Activity_content />
                    </Blur_box>
                </div>
                <div className="bottom">
                    <Blur_box width={8} height={2}>
                        <Friend_content />
                    </Blur_box>
                    <Blur_box width={1.145} height={2}>
                        <Avai_content />
                    </Blur_box>
                </div>
            </div>
        </div>
    );
}

export default main_page;