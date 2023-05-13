const queryString = window.location.search; // We get the query string.
const urlParams = new URLSearchParams(queryString); // Params.

var username = urlParams.get('username');
var isExist = false;

// Object to send a private message.

var userObjectPrivateMessage = {
    usernameFrom : '',
    usernameTo : '',
    message : ''
}


const listMessage = document.querySelector('.list-message');
const chatMessage = document.querySelector('.chat-message');
const listUserDiv = document.querySelector('.list-user-div');
const listMessagePrivate = document.querySelector('.list-private-message');
const buttonPublic = document.querySelector('.btn-public'); // Public Send.
const buttonPrivate = document.querySelector('.btn-private'); // Private Send.




const socket = io();

socket.emit('enter', username);


// We inform everyone that a new user just connect.

socket.on('user connected' , (user)  =>{ // We receive the information. That work !

    socket.on('user list', (userList) =>{ // We write the user that are connected.
        console.log(userList);
        listUserDiv.innerHTML = ""; 
        userList.forEach(function(u, index){
            console.log(`User : ${u}`);
            listUserDiv.innerHTML += `<button index="${index}" onclick='selectUserMessagePrivate(${index}, "${localStorage.username}", "${u}")'>${u}</button>`;

        });

    });

    listMessage.innerHTML += `<br>A new user just connect ${user} say welcome to him !`;

});

// Listen private message.

socket.on('private message', (messageObject) =>{
    var username = urlParams.get('username');
    localStorage.username = username;

    console.log(`Oooh ! ${messageObject.user} : ${messageObject.message}`);


    createMessage(messageObject, username);
});

// We receive here all the messages from other users.

socket.on('message from user', (messageObject) =>{
    var username = urlParams.get('username');
    localStorage.username = username;

    createMessage(messageObject, localStorage.username);
    //console.log(messageObject.isUserItself);
});


// Function to send a message to everyone.

function sendMessage(){
    socket.emit('send message', chatMessage.value);
}

// Function to select user to send it a private message.

function selectUserMessagePrivate(index, userFrom, userTo){
    
    userObjectPrivateMessage.usernameFrom = userFrom;
    userObjectPrivateMessage.usernameTo = userTo;

    console.log(`${userFrom} to ${userTo}`);

    // Switch mode.

    listMessagePrivate.classList.remove('hidden');
    listMessage.classList.add('hidden');
    buttonPrivate.classList.remove('hidden');
    buttonPublic.classList.add('hidden');


    //socket.emit('private message', userFrom, userTo, chatMessage.value);

}

// Function to send a private message to someone.

function sendPrivateMessage(){
    userObjectPrivateMessage.message = chatMessage.value;

    socket.emit('private message', userObjectPrivateMessage);
}

// Function to create the message.

function createMessage(messageObj, username){
    const messageDiv = document.createElement('div');
    
    messageDiv.classList.add('message');
    messageDiv.innerHTML = `<p> ${messageObj.user} : ${messageObj.message} </p>`;

    if(username == messageObj.user){ // We want that if the user itself send the message is message is going to appear in blue if not it will appear in green.
        messageDiv.classList.add('blue')
        messageDiv.classList.add('message', 'message-right');
    }
    else{
        messageDiv.classList.add('green');
        messageDiv.classList.add('message', 'message-left');
       
    }

    listMessage.appendChild(messageDiv);
    listMessage.scrollTop = listMessage.scrollHeight;
}



