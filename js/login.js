const errorMessage = document.querySelector('.error-message');
const username = document.querySelector('.input-username');
const password = document.querySelector('.input-password');

// User Credential Object.

var credentialUser = {
  username: '',
  password: ''
}


// Listener.

document.addEventListener("DOMContentLoaded", function () {
  var usernameInputs = document.querySelectorAll(".input-username");
  var usernameLabels = document.querySelectorAll(".username");

  var passwordInputs = document.querySelectorAll(".input-password");
  var passwordLabels = document.querySelectorAll(".password");



  // We want to delete labels when the user input have character inside of it.
  

  usernameInputs.forEach(function (usernameInput, index) { // For each class I add a listener.
    usernameInput.addEventListener("input", function () {
      if (usernameInput.value.length > 0) {
        usernameLabels[index].style.display = "none";
      } else {
        usernameLabels[index].style.display = "block";
      }
    });
  });

  passwordInputs.forEach(function (passwordInput, index) {
    passwordInput.addEventListener("input", function () {
      if (passwordInput.value.length > 0) {
        passwordLabels[index].style.display = "none";
      } else {
        passwordLabels[index].style.display = "block";
      }
    });
  });
});

// Function that check the credential of the user (send request first to the server).

function credentialSubmit(){

  credentialUser.username = username.value;
  credentialUser.password = password.value;

  console.log("Je passe ici");

  fetch('http://localhost:8080/login',{
    method: 'POST',
    headers : {
      'Content-Type' : 'application/json',
    },
    body: JSON.stringify(credentialUser),
    
  })
  .then(response =>{
    if(!response.ok){
      errorMessage.innerHTML += `Wrong password or username, please retry...`
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  });
}

