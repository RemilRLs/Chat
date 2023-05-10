var express = require('express');
var serve_static = require('serve-static');
var http = require('http');
var compression = require('compression');

const {Server} = require("socket.io");
const io = new Server();
const app = express();

app.use(compression()); // Reduce frame size.

// Use static server middleware
app.use(serve_static(__dirname));

app.use(express.json());


// Middleware to display request parameters and path
app.use(function(req, res, next) {
    console.debug('Path:', req.path);
    console.debug('Parameters:', req.query);
    next(); // Go to the next action/function.
});

app.get('/', function(req, res) { // If the user go the root we give him index.html
    res.sendFile(path.join(__dirname + '/index.html'));
});



app.use(express.json()); // Middleware that is going to analyse the body of the request of the user.
app.use(express.urlencoded({ extended: true })); // Same.

// Endpoint to check the credential of the user.

app.post('/', function(req, res) { // We get the form username.
    const username = req.body.username; // We get the username of the user.
    const password = req.body.password; // We get the password of the user.
    const passwordConfirm = req.body.passwordConfirm;

    console.log(`${username} & ${password} & ${passwordConfirm}`);

    if(password !== passwordConfirm){ // Password didn't match verification.
        res.status(422).send("Password didn't match, please retry..."); // Input not conform (422).
        return;
    }

    res.json({message: 'Credential receive', redirectUrl: '/login.html'}); // We answer with a json respond -> Everything is fine.
    
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

    