var express = require('express');
var serve_static = require('serve-static');
var http = require('http');
var compression = require('compression');


const {Server} = require("socket.io");
const io = new Server();
const app = express();
const bcrypt = require('bcrypt');
const { slateblue } = require('color-name');
const fs = require('fs');

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

app.post('/login', async function(req, res){

    

    hashedPassword = await hashPassword(req.body.password);

    console.debug(`${req.body.username} & ${hashedPassword}`);

    res.json({message:'Credential are valid.'});
});


var serveur = http.Server(app);

serveur.listen(8080, function(){
    console.log('Listening on port 8080');
});



io.sockets.on('connection', function(socket){
    console.log("Un client s'est connecté");

    socket.on('disconnect', function(){
        console.log("Un client s'est déconnecté");
    });
});


/* General function of the program. */


async function hashPassword(password){
    const salt = await bcrypt.genSalt(10); // Level of security here 10.
    const hashedPassword = await bcrypt.hash(password, salt); // We hash the password with the salt that we just created.

    return hashedPassword;
}