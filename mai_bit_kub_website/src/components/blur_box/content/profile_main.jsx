import "./profile_main.css"
import Profile_main from "../../../assets/profile_icon_main.png"

function Profile(){
    return(
        <div className = "profile">
            <img src = {Profile_main}></img>
            <div className = "username">USERNAME</div>
        </div>
    );
}

export default Profile;