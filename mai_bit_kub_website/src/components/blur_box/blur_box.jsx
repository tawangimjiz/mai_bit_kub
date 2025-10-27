import "./blur_box.css"

function blur_box({children, width, height}){ //determine for ratio
    return(
        <div className = "blur_box" style = {{"--width": width, "--height": height}}>
            {children}
        </div>
    );
}

export default blur_box