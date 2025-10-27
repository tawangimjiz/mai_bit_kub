import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "./budget_main.css";
import Budget_main from "../../../assets/budget_icon.png";

function Budget() {
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [budgetId, setBudgetId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [minAllowed, setMinAllowed] = useState(0);
  const [showMaxNotice, setShowMaxNotice] = useState(false);
  const [maxBelowMin, setMaxBelowMin] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (id) setUserId(Number(id)); // convert to int for Prisma
    else console.error("No userId in localStorage");
  }, []);

  // Load existing budget for the user (if any) and show it (read-only until Edit)
  useEffect(() => {
    async function loadBudget() {
      try {
        const id = localStorage.getItem("userId");
        if (!id) {
          console.log('No userId in localStorage');
          return;
        }
        
        console.log('Loading budget for userId:', id);
        const res = await fetch(`http://localhost:3000/api/budget`);
        if (!res.ok) {
          console.log('Failed to fetch budget, status:', res.status);
          return;
        }
        
        const all = await res.json();
        console.log('All budgets:', all);
        
        const mine = all.find(b => String(b.user_id) === String(id));
        console.log('My budget:', mine);
        
        if (mine) {
          setBudgetId(mine.budget_id || null);
          // แสดงค่า min_budget และ max_budget แม้จะเป็น null
          const minVal = mine.min_budget !== null && mine.min_budget !== undefined ? String(mine.min_budget) : "";
          const maxVal = mine.max_budget !== null && mine.max_budget !== undefined ? String(mine.max_budget) : "";
          
          console.log('Setting minBudget:', minVal, 'maxBudget:', maxVal);
          setMinBudget(minVal);
          setMaxBudget(maxVal);
          setIsSaved(true);
          
          // also notify activity about existing saved budget
          window.dispatchEvent(new CustomEvent('userBudgetUpdated', { 
            detail: { 
              maxBudget: Number(mine.max_budget || 0), 
              minBudget: Number(mine.min_budget || 0) 
            } 
          }));
        } else {
          console.log('No budget found for this user');
        }
      } catch (err) {
        console.error('Failed to load existing budget', err);
      }
    }

    if (userId) {
      loadBudget();
    }
  }, [userId]);

  // Listen for selected activities min cost to enforce minBudget
  useEffect(() => {
    function handler(e) {
      const maxMin = e?.detail?.maxMin ?? 0;
      setMinAllowed(maxMin);
    }

    window.addEventListener('selectedActivitiesMinCost', handler);
    return () => window.removeEventListener('selectedActivitiesMinCost', handler);
  }, [minBudget]);

  const handleSave = async () => {
    if (!userId) {
      toast.error("No user selected!");
      return;
    }

    // Interpret inputs: if Min is empty we allow save as long as Max >= minAllowed.
    const max = parseFloat(maxBudget) || 0;
    const min = minBudget === "" ? null : parseFloat(minBudget);

    // If user provided a Min, enforce it is < Max (Min does NOT have to meet minAllowed)
    // if (min !== null) {
    //   if (min >= max) {
    //     toast.error("Min budget must be less than Max budget!");
    //     return;
    //   }
    // }

    // Require Max to meet the selected-activities minimum (so selected activities are affordable)
    // if (max < minAllowed) {
    //   toast.error(`Max budget must be at least ${minAllowed}`);
    //   return;
    // }

    try {
      const method = budgetId ? 'PUT' : 'POST';
      const body = budgetId ? { budget_id: budgetId, min_budget: min, max_budget: max } : { user_id: userId, min_budget: min, max_budget: max };
      const res = await fetch(`http://localhost:3000/api/budget`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Save failed:", text);
        throw new Error(text || "Failed to save budget");
      }

      const result = await res.json();
      console.log("Budget saved:", result);
      setIsSaved(true);
      if (!budgetId && result?.budget_id) setBudgetId(result.budget_id);
      // notify other components (Activity) that user's budget changed
      try {
        const max = Number(result.max_budget ?? max);
        const min = Number(result.min_budget ?? min);
        window.dispatchEvent(new CustomEvent('userBudgetUpdated', { detail: { maxBudget: max, minBudget: min } }));
      } catch (e) {
        // ignore
      }
      toast.success("Budget saved successfully!");
    } catch (err) {
      console.error("Error saving budget:", err);
      toast.error("Error saving budget: " + err.message);
    }
  };

  const handleEdit = () => setIsSaved(false);

  // Prevent user from entering a maxBudget lower than the required minimum (minAllowed).
  const handleMaxBudgetChange = (e) => {
    const v = e.target.value;
    // allow clearing
    if (v === "") {
      setMaxBudget("");
      setMaxBelowMin(false);
      // notify others that budget was cleared/changed
      window.dispatchEvent(new CustomEvent('userBudgetUpdated', { detail: { maxBudget: null, minBudget: minBudget === "" ? null : Number(minBudget || 0) } }));
      return;
    }

    const num = parseFloat(v);
    if (Number.isNaN(num)) {
      setMaxBudget(v);
      setMaxBelowMin(false);
      return;
    }

    // Accept the input (allow the user to type intermediate values). Track whether
    // the numeric value is below the required minimum so we can show a warning on blur
    setMaxBudget(v);
    if (minAllowed && num < Number(minAllowed)) setMaxBelowMin(true);
    else setMaxBelowMin(false);

    // notify other components (Activity) about the change immediately so clearing enables selections
    window.dispatchEvent(new CustomEvent('userBudgetUpdated', { detail: { maxBudget: Number(v), minBudget: minBudget === "" ? null : Number(minBudget || 0) } }));
  };

  const handleMinBudgetChange = (e) => {
    const v = e.target.value;
    if (v === "") {
      setMinBudget("");
      window.dispatchEvent(new CustomEvent('userBudgetUpdated', { detail: { minBudget: null, maxBudget: maxBudget === "" ? null : Number(maxBudget || 0) } }));
      return;
    }
    const num = parseFloat(v);
    if (Number.isNaN(num)) {
      setMinBudget(v);
      return;
    }

    setMinBudget(v);
    window.dispatchEvent(new CustomEvent('userBudgetUpdated', { detail: { minBudget: Number(v), maxBudget: maxBudget === "" ? null : Number(maxBudget || 0) } }));
  };

  // Interpret numeric values
  const maxNum = maxBudget === "" ? NaN : parseFloat(maxBudget);
  const minNum = minBudget === "" ? null : parseFloat(minBudget);

  // canSave: must have a numeric max; if min provided it must be less than max
  const canSave = !Number.isNaN(maxNum) && (minNum === null ? true : (minNum < maxNum));

  // Allow save when Max meets the required minimum from selected activities
  // (even if Min is empty). If Min is provided, it's still required to be < Max.
  const canSaveWithMinAllowed = canSave && (maxNum >= minAllowed);

  return (
    <div className="budget">
      <img src={Budget_main} alt="budget icon" />
      <div className={`amount-container ${isSaved ? "disabled" : ""}`}>
        <div className="budget-wrapper">
          <input
            type="number"
            placeholder="Min Budget"
            className="budget-min"
            value={minBudget}
            onChange={handleMinBudgetChange}
            disabled={isSaved}
          />
          <span className="currency">฿</span>

        </div>
        <div className="budget-wrapper">
          <input
            type="number"
            placeholder="Max Budget"
            className="budget-max"
            value={maxBudget}
            onChange={handleMaxBudgetChange}
            disabled={isSaved}
            min={minAllowed || undefined}
            onFocus={() => { if (minAllowed && Number(minAllowed) > 0) setShowMaxNotice(true); }}
            onBlur={() => {
              setShowMaxNotice(false);
              if (maxBelowMin) toast.warn(`Max budget cannot be less than required minimum ฿${minAllowed}`);
            }}
          />
          <span className="currency">฿</span>
        </div>
      </div>
      {showMaxNotice && minAllowed > 0 ? (
        <div className="notice" style={{ color: parseFloat(minBudget || 0) < minAllowed ? '#b00020' : '#333' }}>
          <span>more than: {minAllowed} ฿</span>
        </div>
      ) : null}
      {/* Debug panel to show budget-related state for troubleshooting */}
      {/* <div style={{ marginTop: 8, padding: 8, background: '#f7f7f7', borderRadius: 6, fontSize: 12 }}>
        <strong>DEBUG</strong>
        <div>minBudget: {String(minBudget)}</div>
        <div>maxBudget: {String(maxBudget)}</div>
        <div>minAllowed (from activities): {String(minAllowed)}</div>
        <div>canSave: {String(canSave)}</div>
        <div>canSaveWithMinAllowed: {String(canSaveWithMinAllowed)}</div>
      </div> */}
      {!isSaved ? (
        <button onClick={handleSave} disabled={!canSaveWithMinAllowed} className="save-btn">
          Save Budget
        </button>
      ) : (
        <button onClick={handleEdit} className="save-btn">
          Edit Budget
        </button>
      )}
    </div>
  );
}

export default Budget;
