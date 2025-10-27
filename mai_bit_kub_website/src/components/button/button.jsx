import "./button.css"
import { Link } from "react-router-dom";

function base_Button(opa, stroke, text, font_color){
    return(
        <button  style = {{backgroundColor: `rgba(234, 91, 111, ${opa/100})`, borderWidth: `${stroke}px`, borderStyle: "solid", color: `#${font_color}`}}>
            {text}
        </button>
    );
}

function Button( {type, text, link_to}){
    if(type == "main"){
        return(
            <Link to = {link_to}>
                {base_Button(100, 0, text, "FFFBDE")}
            </Link>
        );
    }
    if(type == "secondary"){
        return(
            <div>
                <Link to = {link_to}>
                    {base_Button(20, 2, text, "000000")}
                </Link>
            </div>
        );
    }
}
export default Button