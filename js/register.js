var user = { // Structure/Object of the user.
    username: '',
    password: '',
    passwordConfirm: ''
  };


  const usernameForm = document.querySelector('.square-name');
  const passwordForm = document.querySelector('.square-password');
  const usernameInput = document.querySelector('.name');
  const passwordInput = document.querySelector('.password');
  const passwordConfirmInput = document.querySelector('.confirmpassword');
  const usernameErrorMessage = document.querySelector('.error-username');
  const passwordErrorMessage = document.querySelector('.error-password');
  var isValidUsername = false;


// Function to check username form.

function usernameSubmit() {

    passwordErrorMessage.innerHTML = ``; // We reset the innerHTML for the username.


    fetch ('http://localhost:8080/validateUsername',{
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({username: usernameInput.value}),
    })
    .then(response => {
        if (!response.ok) { // If the username already exist.
            isValidUsername = false;

            usernameErrorMessage.style.display = 'block';
        
            usernameErrorMessage.innerHTML += `<p>Username already taken, please retry...</p>`

            throw new Error(`HTTP error! status: ${response.status}`);
            
        }
        else{
            isValidUsername = true;

            if(usernameInput.value.length > 0 && isValidUsername){ // We only want valid username.
                usernameErrorMessage.style.display = 'none';
        
        
                usernameForm.classList.remove('active');
                passwordForm.classList.add('active'); // We go to the password form.
                user.username = usernameInput.value;  // We get the username.
        
        
                console.debug(`The username is ${user.username}`);
        
            }
            else{ // Invalid username.
                usernameErrorMessage.style.display = 'block';
                
                usernameErrorMessage.innerHTML += `<p>You need to have a valid username, please retry...</p>`
        
            }
        }
        return response.json();
    })
    .then(data =>{
        console.debug(`Success : ${data.message}`);
    })
    .catch(error =>{
        console.error(`Error : ${error.message}`);
        
    });




}

// Function to check password form.

function passwordSubmit() {

    passwordErrorMessage.innerHTML = ``; // We reset the innerHTML for the password.

    if (passwordInput.value != passwordConfirmInput.value){ // We only want valid password.
        passwordErrorMessage.style.display = 'block';
        passwordErrorMessage.innerHTML += `Password didn't match, please retry...`

    }
    else if((passwordInput.value.length < 8 || passwordConfirmInput.value.length < 8) && (passwordConfirmInput.value != passwordInput.value)){ // Password to short and didn't match.
        
        passwordErrorMessage.style.display = 'block';
        passwordErrorMessage.innerHTML += `Password must be at least 8 characters long. <br> Password didn't match, please retry...<br>`
    }
    else if(passwordInput.value.length < 8 || passwordConfirmInput.value.length < 8){
        passwordErrorMessage.style.display = 'block';
        passwordErrorMessage.innerHTML += `Password must be at least 8 characters long. <br>`
    }
    else if(!/\d/.test(passwordInput.value)){ // Password with no number.
        passwordErrorMessage.style.display = 'block';
        passwordErrorMessage.innerHTML += `Password must contain at least one number.<br>`
    }
    else{ // Password match / validation.
        
        passwordErrorMessage.style.display = 'none';

        user.password = passwordInput.value; // We get the password.
        user.passwordConfirm = passwordInput.value; // We get the confirm password.
        
    }

    checkCredential(user); // We check the credential.
}

// Function to validate the information and send it to the server.
function checkCredential(userObject){

    if(userObject.username && userObject.password){ // Validation of the credential.
        console.debug(`Validation of the credential. Sending information to the server...`);

        // Sending information to the server.

        fetch('http://localhost:8080/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userObject),
        })
        .then(response => response.json()) // We wait a answer from the NodeJS server.
        .then(data => { // Validation
            console.log('Success:', data);
            window.location.href = data['redirectUrl']; // Redirection to the login.html page.
        })
        .catch((error) => { // Error
            console.error('Error:', error);
        });
    }
}