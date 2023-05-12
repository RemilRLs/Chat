const queryString = window.location.search; // We get the query string.
const urlParams = new URLSearchParams(queryString); // Params.
const username = urlParams.get('username');
const listMessage = document.querySelector('.message');
const chatMessage = document.querySelector('.chat-message');


const socket = io();

socket.emit('enter', username);


// We inform everyone that a new user just connect.

socket.on('user connected' , (user)  =>{ // We receive the information. That work !

    listMessage.innerHTML += `<br>A new user just connect ${user} say welcome to him !`;

});

// We receive here all the messages from other users.

socket.on('message from user', (messageObject) =>{
    listMessage.innerHTML += `<br>${messageObject.user} : ${messageObject.message}`;
});


// Function to send a message to everyone.

function sendMessage(){
    socket.emit('send message', chatMessage.value);
}


//sendMessage();
