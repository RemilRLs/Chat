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



app.use(compression()); // Reduce frame size.

// Use static server middleware
app.use(serve_static(__dirname));

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

app.post('/', async function(req, res) { // We get the form username.
    const username = req.body.username; // We get the username of the user.
    const password = req.body.password; // We get the password of the user.
    const passwordConfirm = req.body.passwordConfirm;

    console.debug(`${username} & ${password} & ${passwordConfirm}`);

    if(password !== passwordConfirm){ // Password didn't match verification.
        res.status(422).send("Password didn't match, please retry..."); // Input not conform (422).
        return;
    }

    hashedPassword = await hashPassword(password); // We hash the password of the user.

    const user = {
        username: username,
        password: hashedPassword
    }

    const data = JSON.stringify(user); // We convert the user information into a string.

    console.debug(`${user.username} & ${user.password}`);

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

        res.json({message: 'Login success', redirectUrl: `/chat?username=${username}&password=${hashedPassword}`}); // All test passed.
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


// Endpoint to give him the list of user.




io.on('connection', function(socket){
    var isUserAlreadyExist = false;

    console.debug("A user just connected", socket.id);
    

    // We create a socket for the user.
    socket.on('enter', (username) =>{
        // TODO check if the user already exist.


        listUser[socket.id] = username;
        listUserPrivate[username] = socket.id; // For private message -> More simple to do that.

        console.debug('User connected');

        io.emit('user connected', username); // Everyone will be inform that a new user just connected.

        listUsername.forEach(function(u, index){
            if(u === username){
                isUserAlreadyExist = true;
            }

        });
        if(!isUserAlreadyExist){
            listUsername.push(username);
        }


        io.emit('user list', listUsername);


    });

    socket.on('send message', (msg) =>{ // We emit to everyone the message from the user.
        console.debug(msg, listUser[socket.id]); // OH !

    
        var messageObject = {
            message : msg,
            user : listUser[socket.id]
        }

       
        io.emit('message from user', messageObject); // To everyone
    });


    socket.on('private message',(messagePrivateObject) =>{
        console.debug(`Sending a private message from ${messagePrivateObject.usernameFrom} to ${messagePrivateObject.usernameTo} message : ${messagePrivateObject.message}`);
        

        var messageObject = {
            message : messagePrivateObject.message,
            user : listUser[socket.id],
            channelId : messagePrivateObject.channelId
        }

        socket.emit('private message', messageObject); // We resend to yourself the message to see that one.
        socket.to(listUserPrivate[messagePrivateObject.usernameTo]).emit('private message', messageObject); // For the destinataire.
        
    });

    // We receive that someone want to pen a conversation with another one.

    socket.on('start private chat', (privateChatObject) =>{
        socket.to(listUserPrivate[privateChatObject.userTo]).emit('start private chat', privateChatObject);
    });

    socket.on('disconnect', function(){
        console.debug("A user just disconnected", socket.id);
        delete listUser[socket.id]; // We delete the user because he just disconnected.
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