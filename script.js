var express = require('express');
var serve_static = require('serve-static');
var http = require('http');
var compression = require('compression');




const app = express();
const server = http.createServer(app);
var io = require('socket.io')(server); // 1 hour to fix that...
const bcrypt = require('bcrypt');
const fs = require('fs');


var listUser = {}; // We store here the user list that are connected to the chat.
var listUserPrivate = {}; // Store the user list for private message key : username | value : socket.id.
var listUsername = [];
var avatarSelected = '';


app.use(compression()); // Reduce frame size.



// Middleware to display request parameters and path
app.use(function(req, res, next) {
    console.debug('Path:', req.path);
    console.debug('Parameters:', req.query);
    next(); // Go to the next middleware.
});
        


app.use(express.json()); // Middleware that is going to analyse the body of the request of the user.
app.use(express.urlencoded({ extended: true })); // Same.

// Endpoint to check the credential of the user.

app.get('/register', (req, res) =>{
    res.sendFile(__dirname + '/index.html');
});

app.get('/', (req, res) =>{
    res.sendFile(__dirname + '/login.html');
});

// Use static server middleware
app.use(serve_static(__dirname));


app.post('/', async function(req, res) { // We get the form username.
    const username = req.body.username; // We get the username of the user.
    const password = req.body.password; // We get the password of the user.
    const passwordConfirm = req.body.passwordConfirm;
    const avatarName = req.body.pathAvatar;


    console.debug(`${username} & ${password} & ${passwordConfirm} ${avatarName}`);

    if(password !== passwordConfirm){ // Password didn't match verification.
        res.status(422).send("Password didn't match, please retry..."); // Input not conform (422).
        return;
    }

    hashedPassword = await hashPassword(password); // We hash the password of the user.

    const user = {
        username: username,
        password: hashedPassword,
        avatar : avatarName
    }



    const data = JSON.stringify(user); // We convert the user information into a string.

    console.debug(`${user.username} & ${user.password} & ${user.avatar}`);

    fs.readFile(__dirname + '/database/user_database.json', (err, fileData) => {

        if(err){ // Error when we read the file.
            console.error(`Something went wrong reading the database ${err}`);
            return;
        }

        // We write the user credential into the json tab.
        const users = JSON.parse(fileData); 
        users.push(user); // We go to the end of the tab and we push the user credential into.


        // Then after so many attempt that we have done I can finally put me credential into me file.
        
        fs.writeFile(__dirname + '/database/user_database.json', JSON.stringify(users), (error) => {
            if (error) {
                console.error(`Cannot write into the database... Error : ${error}`);
                return;
            }

            console.debug(`User added to the database.`);
        });
    });

    res.json({message: 'Credential receive', redirectUrl: '/login.html'}); // We answer with a json respond -> Everything is fine.
    
});

// Endpoint to check if a username is already taken.

app.post('/validateUsername', function(req, res){
    
    fs.readFile(__dirname + '/database/user_database.json', (err, data) => {
        if(err){
            console.error(`Something went wrong when reading the database ${err}`);
            return;
        }

        const users = JSON.parse(data);

        for(let user of users){ // We go through each user of the database.
            if(user['username'] === req.body.username){
                res.status(422).json({message:'Username already taken...'});
                return;
            }
        }
        res.json({message: 'Username validation'});
    });

    
});

// Endpoint login page.

app.get('/login', (req, res) =>{
    res.sendFile(__dirname + '/login.html');
});

app.post('/login',  function(req, res){
    const username = req.body.username;
    const password = req.body.password;

    var userFind = '';
    var hashedPassword = ``;

    // We check if the user exist into the database.

    fs.readFile(__dirname + '/database/user_database.json', async function(err, data)  {
        if(err){
            console.error(`Something went wrong when reading the database ${err}`);
            return;
        }

        const users = JSON.parse(data);

        for(let user of users){ // We go through each user of the database.
            if(user['username'] === username){ // We found the user.
                userFind = user['username'];
                hashedPassword = user['password'];

            }
        }

        if(!userFind){
            res.status(422).json({message: 'Invalid username or password'});
            return;
        }
        console.debug(`${userFind} & ${hashedPassword}`);

        const matchPassword = await bcrypt.compare(password, hashedPassword); // We compare the hash with password.
        
        if(!matchPassword){
            res.status(422).json({message: 'Invalid username or password'});
            return;
        }

        res.json({message: 'Login success', redirectUrl: `/chat?username=${username}&password=${hashedPassword}`, username: `${username}`}); // All test passed.
    });
    
    



    //console.debug(`${req.body.username} & ${hashedPassword}`);

});


app.get('/chat', (req, res) =>{

    var username = req.query.username;
    var hashedPassword = req.query.password;
    var isAccountExist = false;

    fs.readFile(__dirname + '/database/user_database.json', (err, data) =>{
        if(err){
            console.debug(`Something went wrong when opening the database... Error : ${err}`);
            return;
        }

        users = JSON.parse(data);

        for(let user of users){ // We go through each user of the database.
            if(user['username'] === username && user['password'] == hashedPassword){ // We found the user,
                isAccountExist = true; // So it's valid.
            }
            
        }

        if(isAccountExist){
            res.sendFile(__dirname + '/chat.html');
        }
        else{
            res.sendFile(__dirname + '/login.html');
        }
    });
    


});


// Get the avatar of the user

app.post('/avatar', (req, res) =>{
    console.debug(`Avatar receive, name is : ${req.body.fileName}`);

    avatarSelected = req.body.fileName;

    res.json({message: 'Avatar validation'});
});

// Endpoint to give him the list of user.




io.on('connection', function(socket){
    var isUserAlreadyExist = false;
    var getAvatarName;

    console.debug("A user just connected", socket.id);

    // We get the list of avatar and send it to the client.

    var filePath = fs.readdirSync(__dirname + '/ressources/avatars');
    io.emit('get file', (filePath));

    // We create a socket for the user.
    socket.on('enter', (username) =>{
        

        

        listUser[socket.id] = username;
        listUserPrivate[username] = socket.id; // For private message -> More simple to do that.

        console.debug('User connected');

        io.emit('user connected', username); // Everyone will be inform that a new user just connected.

        listUsername.forEach(function(u, index){
            if(u.username === username){
                isUserAlreadyExist = true;
            }

        });
        if(!isUserAlreadyExist){
            var objectUser = {
                username : username,
                avatar : ''
            }

            fs.readFile(__dirname + '/database/user_database.json', (err, user) =>{
                if(err){
                    console.debug(`Cannot read the database message, please retry...`);  
                }

                var userListDatabase = JSON.parse(user);

                userListDatabase.forEach(function(user){
                    if(user.username === objectUser.username){
                        objectUser.avatar = user.avatar;
                    }
                });
            });

            listUsername.push(objectUser);
        }
        

        io.emit('user list', listUsername);
        
        // We going to send the history of the general chat.

        fs.readFile(__dirname + '/database/message_database.json', (err, message) =>{
            if(err){
                console.debug(`Cannot read the database message, please retry...`);
            }

            var messageList = JSON.parse(message);  // We get the list of message.
            io.emit('message list', messageList);
            console.debug("Sending message list");
            
        });
        
    });

    socket.on('send message', (msg) =>{ // We emit to everyone the message from the user.
        console.debug(msg, listUser[socket.id]); // OH !
        var currentdate = new Date();  // To get the date.
        
    
        var messageObject = {
            message : msg,
            user : listUser[socket.id],
            avatar : '',
            date : currentdate.getDate(),
            month : currentdate.getMonth() + 1,
            year : currentdate.getFullYear(),
            hour : currentdate.getHours(),
            minute : currentdate.getMinutes(),
        }

        // We add the message to the database.

        try {
            // We need to read it asynchrone because there is some operation that I can't do :( withouth it

            const data = fs.readFileSync(__dirname + '/database/message_database.json');
            const message = JSON.parse(data);
    
            const userData = fs.readFileSync(__dirname + '/database/user_database.json');
            const listUser = JSON.parse(userData);
            
            // We try to found the avatar of the user and we display it.


            listUser.forEach(function(user, index){
                if(user.username === messageObject.user){
                    messageObject.avatar = user.avatar; // AAAA It was in asynchrone.
                    console.log(`Avatar is : ${messageObject.avatar}`);
                }
            });
    
            message.push(messageObject); // We go to the end of the tab and we push the message into.

            fs.writeFile(__dirname + '/database/message_database.json', JSON.stringify(message), (error) => {
                if (error) {
                    console.error(`Cannot write into the database message... Error : ${error}`);
                    return;
                }
            });


                console.debug(`Message added to the database.`);
        
       
        io.emit('message from user', messageObject); // To everyone
        } 
        catch (err) {
            console.debug(`Something went wrong when opening the databases... Error : ${err}`);
        }
    
        console.log(`Avatar is : ${messageObject.avatar}`);
        
    
    
            
            

    });


    socket.on('private message',(messagePrivateObject) =>{
        var currentdate = new Date(); 
        console.debug(`Sending a private message from ${messagePrivateObject.usernameFrom} to ${messagePrivateObject.usernameTo} message : ${messagePrivateObject.message}`);
        

        var messageObject = {
            message : messagePrivateObject.message,
            user : listUser[socket.id],
            channelId : messagePrivateObject.channelId,
            avatar : ``,
            date : currentdate.getDate,
            hour : currentdate.getHours
        }

        const userData = fs.readFileSync(__dirname + '/database/user_database.json');
        const userList = JSON.parse(userData);
        
        userList.forEach(function(user, index){
            if(user.username === messageObject.user){
                messageObject.avatar = user.avatar; // AAAA It was in asynchrone.
            }
        });

        socket.emit('private message', messageObject); // We resend to yourself the message to see that one.
        socket.to(listUserPrivate[messagePrivateObject.usernameTo]).emit('private message', messageObject); // For the destinataire.
        
    });

    // We receive that someone want to pen a conversation with another one.

    socket.on('start private chat', (privateChatObject) =>{
        socket.to(listUserPrivate[privateChatObject.userTo]).emit('start private chat', privateChatObject);
    });

    socket.on('disconnect', () => {
        let username = listUser[socket.id];
        if(username) {
            delete listUser[socket.id];
            delete listUserPrivate[username];
            // Emit to other users that this user has disconnected
            io.emit('user disconnected', username); 
        }
    });
    

});

server.listen(8080, function(){
    console.debug('Listening on port 8080');
});



/* General function of the program. */


async function hashPassword(password){
    const salt = await bcrypt.genSalt(10); // Level of security here 10.
    const hashedPassword = await bcrypt.hash(password, salt); // We hash the password with the salt that we just created.

    return hashedPassword;
}