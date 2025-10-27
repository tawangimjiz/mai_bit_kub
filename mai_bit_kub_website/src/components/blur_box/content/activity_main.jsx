import React, { useState } from "react";
import { useEffect } from "react";
import { toast } from "react-toastify";
import "./activity_main.css";

import Create_icon from "../../../assets/create.png";
import Sport_icon from "../../../assets/sport.png";
import Music_icon from "../../../assets/music.png";
import Indoor_icon from "../../../assets/indoor.png";
import Adventure_icon from "../../../assets/adventure.png";
import Back from "../../../assets/back.png";

import Biking_icon from "../../../assets/biking_icon.png";
import Dancing_icon from "../../../assets/dancing_icon.png";
import Drawing_icon from "../../../assets/drawing_icon.png";
import Hiking_icon from "../../../assets/hiking_icon.png";
import Serfing_icon from "../../../assets/serfing_icon.png";
import Singing_icon from "../../../assets/singing_icon.png";
import Pingpong_icon from "../../../assets/pingpong.png";
import Boxing_icon from "../../../assets/boxing.png";
import Swimming_icon from "../../../assets/water.png";
import Gaming_icon from "../../../assets/game_icon.png";
import Photography_icon from "../../../assets/photography.png";
import Boardgame_icon from "../../../assets/boardgame_icon.png";
import Diving_icon from "../../../assets/diving_icon.png";
import Add_activity_icon from "../../../assets/add_activity.png";

// -----------------------------------------------------
// ✅ กำหนดกิจกรรมหลัก / ย่อย
// -----------------------------------------------------
const mainActivities = [
  {
    name: "SPORT",
    icon: Sport_icon,
    subActivities: [
      { name: "PINGPONG", icon: Pingpong_icon },
      { name: "BOXING", icon: Boxing_icon },
      { name: "SWIMMING", icon: Swimming_icon },
      { name: "SERFING", icon: Serfing_icon },
    ],
  },
  {
    name: "MUSIC",
    icon: Music_icon,
    subActivities: [
      { name: "SINGING", icon: Singing_icon },
      { name: "DANCING", icon: Dancing_icon },
    ],
  },
  {
    name: "INDOOR",
    icon: Indoor_icon,
    subActivities: [
      { name: "VIDEO GAME", icon: Gaming_icon },
      { name: "BOARD GAME", icon: Boardgame_icon },
    ],
  },
  {
    name: "ADVENTURE",
    icon: Adventure_icon,
    subActivities: [
      { name: "HIKING", icon: Hiking_icon },
      { name: "BIKING", icon: Biking_icon },
      { name: "DIVING", icon: Diving_icon },
    ],
  },
  {
    name: "CREATE",
    icon: Create_icon,
    subActivities: [
      { name: "PHOTOGRAPHY", icon: Photography_icon },
      { name: "DRAWING", icon: Drawing_icon },
    ],
  },
];
function Activity() {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [userActivities, setUserActivities] = useState(new Set());
  const [userActivityCosts, setUserActivityCosts] = useState({});
  const [userBudgetMin, setUserBudgetMin] = useState(null);
  const [userBudgetMax, setUserBudgetMax] = useState(null);
  const [activityCosts, setActivityCosts] = useState({});
  const [initialBudgetExists, setInitialBudgetExists] = useState(false);

  // เพิ่มกิจกรรมให้ user โดยคลิกที่ subActivity (toggle behavior)
  async function addUserActivity(activityName) {
    try {
      // 1️⃣ ดึง activity_id จากชื่อกิจกรรม
      const resAct = await fetch(`/api/activity/by-name?name=${encodeURIComponent(activityName)}`);
      if (!resAct.ok) throw new Error(`Activity API error: ${resAct.status}`);
  let activity = await resAct.json();

      // If not found, try some common name variants (case variants) before giving up
      async function fetchByNameVariant(name) {
        try {
          const r = await fetch(`/api/activity/by-name?name=${encodeURIComponent(name)}`);
          if (!r.ok) return null;
          const a = await r.json();
          return a;
        } catch (e) {
          return null;
        }
      }

      if (!activity?.activity_id) {
        // try lowercase
        const low = await fetchByNameVariant(activityName.toLowerCase());
        if (low?.activity_id) activity = low;
      }

      if (!activity?.activity_id) {
        // try title case (first letter uppercase, rest lowercase)
        const title = activityName.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const tit = await fetchByNameVariant(title);
        if (tit?.activity_id) activity = tit;
      }

      if (!activity?.activity_id) {
        console.error("Activity not found:", activityName);
        return;
      }

      // Prevent selecting activity if user has saved a Min Budget and activity's min_cost is below that
      const actMin = activity.min_cost != null ? Number(activity.min_cost) : null;
      // Allow selection if either:
      // - user's saved min_budget exists and activity.min_cost < min_budget
      // - user's saved max_budget exists and max_budget > activity.min_cost
      // If no budget exists at all (initialBudgetExists === false), allow selection.
      const allowByMin = userBudgetMin != null && actMin != null && actMin < userBudgetMin;
      const allowByMax = userBudgetMax != null && actMin != null && userBudgetMax > actMin;
      if (initialBudgetExists && !(allowByMin || allowByMax)) {
        toast.warn(`Cannot select ${activityName}: does not meet your saved budget constraints.`);
        return;
      }

      // 2️⃣ Toggle userActivity: create, or if exists (409) delete
      const userId = parseInt(localStorage.getItem('userId') || '1', 10);

      const resUA = await fetch("http://localhost:3000/api/activity/useractivity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          activity_id: activity.activity_id,
          preference_level: 1,
        }),
      });

      // If it already exists, toggle: delete the userActivity
        if (resUA.status === 409) {
        console.warn('UserActivity already exists for this user/activity — attempting to remove (toggle)');
        const resDel = await fetch("http://localhost:3000/api/activity/useractivity", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, activity_id: activity.activity_id }),
        });

        if (!resDel.ok) {
          throw new Error(`Failed to remove activity: ${resDel.status}`);
        }
        // update local selected set and costs
        setUserActivities(prev => {
          const s = new Set(prev);
          s.delete(activityName);
          return s;
        });
        setUserActivityCosts(prev => {
          const p = { ...prev };
          delete p[activityName];
          const mins = Object.values(p).filter(v => v != null);
          const maxMin = mins.length ? Math.max(...mins) : 0;
          window.dispatchEvent(new CustomEvent('selectedActivitiesMinCost', { detail: { maxMin } }));
          return p;
        });
        console.log('✅ Removed activity (toggled off)');
        return;
      }

      if (!resUA.ok) throw new Error(`UserActivity API error: ${resUA.status}`);
      const data = await resUA.json();
      console.log("✅ Added activity:", data);
      // update local selected set and costs
      setUserActivities(prev => {
        const s = new Set(prev);
        s.add(activityName);
        return s;
      });
      setUserActivityCosts(prev => {
        const p = { ...prev };
        // activity may have activity_name or name depending on source
        const actName = activity.activity_name || activity.name || activityName;
        p[actName] = activity.min_cost != null ? Number(activity.min_cost) : null;
        const mins = Object.values(p).filter(v => v != null);
        const maxMin = mins.length ? Math.max(...mins) : 0;
        window.dispatchEvent(new CustomEvent('selectedActivitiesMinCost', { detail: { maxMin } }));
        return p;
      });
    } catch (err) {
      console.error("❌ Error adding activity:", err);
    }
  }

  // fetch user's existing activities to mark selected sub-cards
  useEffect(() => {
    const fetchUserActivities = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) return;
      try {
        const res = await fetch(`/api/activity/useractivity?userId=${userId}`);
        if (!res.ok) return;
        const data = await res.json();
        const names = data.map(u => u.activity?.name).filter(Boolean);
        const costs = {};
        data.forEach(u => {
          if (u.activity?.name) costs[u.activity.name] = u.activity.min_cost ?? null;
        });
        setUserActivities(new Set(names));
        setUserActivityCosts(costs);
        const mins = Object.values(costs).filter(v => v != null);
        const maxMin = mins.length ? Math.max(...mins) : 0;
        window.dispatchEvent(new CustomEvent('selectedActivitiesMinCost', { detail: { maxMin } }));
      } catch (e) {
        console.error('Failed to load user activities', e);
      }
    };

    fetchUserActivities();

    // also fetch user's budget (max) to determine affordability
    const fetchUserBudget = async () => {
      try {
        const uid = localStorage.getItem('userId');
        if (!uid) return;
        const res = await fetch(`/api/budget`);
        if (!res.ok) return;
        const all = await res.json();
        const mine = all.find(b => String(b.user_id) === String(uid));
        if (mine) {
          setInitialBudgetExists(true);
          setUserBudgetMin(Number(mine.min_budget) > 0 ? Number(mine.min_budget) : null);
          setUserBudgetMax(Number(mine.max_budget) > 0 ? Number(mine.max_budget) : null);
        } else {
          setInitialBudgetExists(false);
          setUserBudgetMin(null);
          setUserBudgetMax(null);
        }
      } catch (err) {
        console.error('Failed to fetch budget', err);
      }
    };

    fetchUserBudget();

    // prefetch min_cost for all sub-activities so we can disable unaffordable ones
    const fetchActivityCosts = async () => {
      try {
        const names = [];
        mainActivities.forEach(m => m.subActivities.forEach(s => names.push(s.name)));
        const costs = {};
        await Promise.all(names.map(async (n) => {
          try {
            const r = await fetch(`/api/activity/by-name?name=${encodeURIComponent(n)}`);
            if (!r.ok) return;
            const a = await r.json();
            costs[n] = a?.min_cost != null ? Number(a.min_cost) : null;
          } catch (e) { /* ignore */ }
        }));
        setActivityCosts(costs);
      } catch (e) {
        console.error('Failed to fetch activity costs', e);
      }
    };

    fetchActivityCosts();

    // listen for updates when the user saves/changes their budget elsewhere (Budget component)
    function onBudgetUpdated(e) {
      try {
        const min = e?.detail?.minBudget;
        if (min != null && Number(min) > 0) setUserBudgetMin(Number(min));
        else setUserBudgetMin(null);
        const max = e?.detail?.maxBudget;
        if (max != null && Number(max) > 0) setUserBudgetMax(Number(max));
        else setUserBudgetMax(null);
        // If either min or max > 0, consider that a saved/active budget exists.
        if ((min != null && Number(min) > 0) || (max != null && Number(max) > 0)) setInitialBudgetExists(true);
        else setInitialBudgetExists(false);
      } catch (err) {
        // ignore
      }
    }
    window.addEventListener('userBudgetUpdated', onBudgetUpdated);
    // cleanup
    return () => window.removeEventListener('userBudgetUpdated', onBudgetUpdated);
  }, []);

  try {
    return (
      <div className="display">
        {!selectedActivity ? (
          <div className="activity_icon">
            {mainActivities.map((act, idx) => (
              <div
                key={idx}
                className="activity_card"
                onClick={() => setSelectedActivity(act)}
              >
                <img src={act.icon} alt={act.name} />
                <div className="activity_name">{act.name}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="sub_activity_container">
            <button className="back_btn" onClick={() => setSelectedActivity(null)}>
              <img src={Back} alt="Back" />
            </button>

            <div className="sub_activity_icon">
              {(selectedActivity?.subActivities || []).map((sub, idx) => {
                const cost = activityCosts[sub.name];
                const allowByMin = userBudgetMin != null && cost != null && cost < userBudgetMin;
                const allowByMax = userBudgetMax != null && cost != null && userBudgetMax > cost;
                const disabled = cost != null && initialBudgetExists && !(allowByMin || allowByMax);
                // only show selected visual when it's selected AND not disabled by budget
                const isSelected = userActivities.has(sub.name) && !disabled;
                return (
                  <div
                    key={idx}
                    className={`sub_card ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                    onClick={() => { if (!disabled) addUserActivity(sub.name); }}
                    style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
                    title={disabled ? `Does not meet your saved budget constraints (min ${userBudgetMin || '-'}, max ${userBudgetMax || '-'})` : ''}
                  >
                    <img src={sub.icon} alt={sub.name} />
                    <div className="sub_name">{sub.name}</div>
                  </div>
                );
              })}
            </div>
            {/* Debug row: show budget and per-subactivity cost/disabled state to troubleshoot why a card is disabled */}
            {/* <div style={{ marginTop: 10, fontSize: 12, color: '#444' }}>
              <div><strong>DEBUG (activity)</strong></div>
              <div>User min budget: {userBudgetMin == null ? 'none' : `฿${userBudgetMin}`}; max budget: {userBudgetMax == null ? 'none' : `฿${userBudgetMax}`}</div>
              <div style={{ marginTop: 6 }}>
                {(selectedActivity?.subActivities || []).map((s) => {
                  const c = activityCosts[s.name];
                  const dis = c != null && initialBudgetExists && userBudgetMin != null && c < userBudgetMin;
                  return (
                    <div key={`dbg-${s.name}`} style={{ marginBottom: 3 }}>
                      {s.name}: min_cost={c == null ? 'unknown' : `฿${c}`} — disabled: {String(dis)}
                    </div>
                  );
                })}
              </div>
            </div> */}
          </div>
        )}
      </div>
    );
  } catch (err) {
    console.error('Activity render error:', err);
    return (
      <div style={{ padding: 20 }}>
        <h3>มีข้อผิดพลาดเกิดขึ้นขณะแสดงผล Activity</h3>
        <div style={{ color: '#b00020' }}>{String(err && err.message)}</div>
        <div style={{ marginTop: 8 }}>ดู Console เพื่อดูรายละเอียดเพิ่มเติม</div>
      </div>
    );
  }
}

export default Activity;