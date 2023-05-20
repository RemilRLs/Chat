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
const listMessagePrivate = document.querySelector('.list-private-messages');
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
            listUserDiv.innerHTML += `<div class="user-div"><button class="user-button" index="${index}" onclick='selectUserMessagePrivate(${index}, "${urlParams.get('username')}", "${u.username}")'><img src="/ressources/avatars/${u.avatar}"><span class="username">${u.username}</span></button></div>`;

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


    createMessage(messageObject, username, chatPrivateSelect, messageObject.avatar);
});

// We receive here all the messages from other users.

socket.on('message from user', (messageObject) =>{
    var username = urlParams.get('username');
    localStorage.username = username;
    console.log(`AVATAR : ${messageObject.avatar}`);

    createMessage(messageObject, localStorage.username, listMessage, messageObject.avatar);
});

socket.on('start private chat', (privateChatObject) =>{
    channelId = privateChatObject.channelId;
    chatDivSelected = channelId;
    console.log(chatDivSelected);

    createPrivateChannel(privateChatObject.userFrom, privateChatObject.userTo);
});

// Display history message  socket.

socket.on('message list', (messageObject) =>{
    removeMessage();

    var username = urlParams.get('username');
    localStorage.username = username;
    
    messageObject.forEach(function(messageObj, index){

        createMessage(messageObj, username, listMessage, messageObj.avatar);
    });
});
// Function to send a message to everyone.

function sendMessage(){
    socket.emit('send message', chatMessage.value);
}

// Function to select user to send it a private message.

function selectUserMessagePrivate(index, userFrom, userTo){
    
    userObjectPrivateMessage.usernameFrom = userFrom;
    userObjectPrivateMessage.usernameTo = userTo;

    if(userTo === userFrom){
        chatMessage.placeholder = `Send a message to yourself (why not)`;
    }
    else{
        chatMessage.placeholder = `Send a message to ${userTo}`;
    }
    

    
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

function createMessage(messageObj, username, targetDiv, avatarName){
    console.log(avatarName);
    const messageDiv = document.createElement('div');
    var currentdate = new Date(); 
    
    messageDiv.classList.add('message');
    messageDiv.innerHTML += `<div class='avatar-icon'><img src="/ressources/avatars/${avatarName}"></div>`
    


    let p = document.createElement('p');

    if(currentdate.getDate() == messageObj.date){
        p.innerHTML = `<span class="user-from">${messageObj.user}  &#160 <p>Today at ${messageObj.hour}:${messageObj.minute}</p></span>  <p class="message-is">${messageObj.message}</p>`;
    }

    
    
    if(username == messageObj.user){ // If it's me that send the message the message will be on the right.
        p.classList.add('blue');
        messageDiv.classList.add('message', 'message-right');
    }
    else{ // Not me, on the left.
        p.classList.add('green');
        messageDiv.classList.add('message', 'message-left');
    }
    
    messageDiv.appendChild(p);
    

    targetDiv.appendChild(messageDiv);
    targetDiv.scrollTop = targetDiv.scrollHeight;
    chatMessage.value = ``; // We reset the input chat.
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


    listMessagePrivate.appendChild(chatPrivate);
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

// Function to remove every message from a div.

function removeMessage(){
    listMessage.innerHTML = ``;
}