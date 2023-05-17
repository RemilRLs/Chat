const emojiList = document.querySelector('.emoji-list');
const emojiButton = document.querySelector('.button-emoji');


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