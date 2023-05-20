const emojiList = document.querySelector('.emoji-list');
const emojiButton = document.querySelector('.button-emoji');

const chatText = document.querySelector('.chat-message');

// Make appear the bar with the emoji.

emojiButton.addEventListener('click' ,function(){
    
    if(emojiList.classList.contains('visibility')){
        emojiList.style.display = 'none';
        emojiList.classList.remove('visibility');
    }
    else{
        emojiList.style.display = 'block';
        emojiList.classList.add('visibility');
    }
});

// We add an event listener to each emoji to add it on the chat.
document.addEventListener('DOMContentLoaded', (event) => { // We need to know when the page is fully load.

    const emojiListSpan = document.querySelectorAll('.emoji-list span');

    emojiListSpan.forEach(function (emoji){
        emoji.addEventListener('click', function(){
            chatText.value = chatText.value + emoji.textContent; // We add the emoticone.
    
            emojiList.style.display = 'none';
            emojiList.classList.remove('visibility');
        });
    });
});

// Function to display the public chat.

function displayPublicChat(){
    listChannelPrivate = document.querySelectorAll('.list-private-message');
    publicChat = document.querySelector('.list-message');
    
    chatMessage.placeholder = "Send a message into the public chat...";



    listChannelPrivate.forEach(function(channel, index){ 
        channel.classList.add('hidden');
    });

    publicChat.classList.remove('hidden');
}