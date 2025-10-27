import './Home.css'
import Button from "../components/button/button.jsx"

function Home() {
    const isSignedIn = !!localStorage.getItem('username');

    return(
        <div>
            <h1>MAI BIT KUB</h1>
            <p>It’s often hard to meet up with friends because of different schedules, preferences, and budgets. That’s why we created Mai Bit Kub — a website that helps find the best time, activity, and budget for everyone.</p>
            {!isSignedIn && (
                <div className="navigate-to">
                    <div className="SIGN-IN"><Button type="main" text="SIGN IN" link_to={"/signin"}></Button></div>
                    <div className="SIGN-UP"><Button type="secondary" text="SIGN UP" link_to={"/signup"}></Button></div>
                </div>
            )}
        </div>
    );
}

export default Home
