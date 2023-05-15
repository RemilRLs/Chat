const queryString = window.location.search; // We get the query string.
const urlParams = new URLSearchParams(queryString); // Params.

var username = urlParams.get('username');
var isExist = false;
var chatIdSelected;

// Object to send a private message.

var userObjectPrivateMessage = {
    usernameFrom : '',
    usernameTo : '',
    message : '',
    channelId : ''
}

const chat = document.querySelector('.chat-general');
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
            listUserDiv.innerHTML += `<button index="${index}" onclick='selectUserMessagePrivate(${index}, "${urlParams.get('username')}", "${u}")'>${u}</button>`;

        });

    });

    listMessage.innerHTML += `<br>A new user just connect ${user} say welcome to him !`;

});

// Listen private message.

socket.on('private message', (messageObject) =>{
    var username = urlParams.get('username');
    localStorage.username = username;

    console.log(`Oooh ! ${messageObject.user} : ${messageObject.message}`);

    chatPrivateSelect = document.getElementById(messageObject.channelId);
    console.log(chatPrivateSelect);


    createMessage(messageObject, username, chatPrivateSelect);
});

// We receive here all the messages from other users.

socket.on('message from user', (messageObject) =>{
    var username = urlParams.get('username');
    localStorage.username = username;           

    createMessage(messageObject, localStorage.username, listMessage);
});

socket.on('start private chat', (privateChatObject) =>{
    channelId = privateChatObject.channelId;
    chatDivSelected = channelId;

    console.log(chatDivSelected);

    createPrivateChannel(privateChatObject.userFrom, privateChatObject.userTo);
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



    createPrivateChannel(userFrom, userTo);
    chatDivSelected = showPrivateChannel(userFrom, userTo);
    chatIdSelected = userFrom + '-' + userTo;

    // We send the information to the user in question that a channel have been open.

    var privateChatObject = {
        userFrom : userFrom,
        userTo : userTo,
        channelId : [userFrom, userTo].sort().join('-')
    }

    socket.emit('start private chat', privateChatObject);

}

// Function to send a private message to someone.

function sendPrivateMessage(){
    let channelId = [userObjectPrivateMessage.usernameFrom, userObjectPrivateMessage.usernameTo].sort().join('-'); 

    userObjectPrivateMessage.message = chatMessage.value;
    userObjectPrivateMessage.channelId = channelId;

    console.log(`${userObjectPrivateMessage.usernameFrom} to ${userObjectPrivateMessage.usernameTo}`);
    socket.emit('private message', userObjectPrivateMessage);
}

// Function to create the message.

function createMessage(messageObj, username, targetDiv){
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

    targetDiv.appendChild(messageDiv);
    targetDiv.scrollTop = targetDiv.scrollHeight;
}

// Create a channel for talk in private with your friends.

function createPrivateChannel(userFrom, userTo){

    let channelId = [userFrom, userTo].sort().join('-'); // We sort because even if we are in another user it will not switch the name.


    chatPrivate = document.getElementById(channelId);

    if(!chatPrivate){ // The channel doesn't exist.
        chatPrivate = document.createElement('div');
        chatPrivate.classList.add('list-private-message', 'hidden');
        chatPrivate.id = channelId;

    }


    chat.appendChild(chatPrivate);
}

// Function to show the only channel that we just selected.

function showPrivateChannel(userFrom, userTo){

    let channelId = [userFrom, userTo].sort().join('-'); // We sort because even if we are in another user it will not switch the name.

    /* 
        Example : Imagine I select the user Remil from Utyz the ID will be Utyz-Remil but if Remil select Utyz it will be Remil-Utyz so we sort.
    */

    listChannelPrivate = document.querySelectorAll('.list-private-message');

    listChannelPrivate.forEach(function(channel, index){
        channel.classList.add('hidden');
    });

    channelSelect = document.getElementById(channelId);
    channelSelect.classList.remove('hidden');

    return channelSelect; // We get the channel that the user just selected.
}