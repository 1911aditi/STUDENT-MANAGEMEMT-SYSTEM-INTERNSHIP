// Show / Hide Password

const togglePassword = document.getElementById("togglePassword");

const password = document.getElementById("password");

togglePassword.addEventListener("click",function(){

    if(password.type==="password"){

        password.type="text";

        togglePassword.classList.replace("fa-eye","fa-eye-slash");

    }

    else{

        password.type="password";

        togglePassword.classList.replace("fa-eye-slash","fa-eye");

    }

});


// Login

document.getElementById("loginBtn").addEventListener("click",function(){

    const username=document.getElementById("username").value.trim();

    const pass=document.getElementById("password").value.trim();

    // Hardcoded Login
    const validUsername="admin";

    const validPassword="12345";


    if(username===validUsername && pass===validPassword){

        alert("Login Successful!");

        // Redirect to Dashboard
        window.location.href="index_demo.html";

    }

    else{

        alert("Invalid Username or Password!");

    }

});