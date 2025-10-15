const mensajeError= document.getElementsByClassName("error")[0];

document.getElementById("login-form").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const form = e.target;
    const user = form.elements["user"].value;
    const pass = form.elements["pass"].value;
    console.log(user)
    console.log(pass)
    console.log(e)
    const res= await fetch ("http://localhost:3000/login",{
        method: "POST",
        headers:{
            "Content-Type" : "application/json"
        },
        body: JSON.stringify({
            user, pass
        })
    });
    console.log(res)
    
    
    if (!res.ok) return mensajeError.classList.toggle("escondido",false);
    const resJson = await res.json();
    if(resJson.redirect){
        window.location.href = resJson.redirect;
    }

})
