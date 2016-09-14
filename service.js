var express = require('express');
var app = express();
var bodyParser  = require('body-parser');
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file

var soapclient = require('./js/soapclient');
var fs = require('fs');

app.set('superSecret', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.listen(config.port);
var plugs = Object.keys(config.plugs);

var sClients = {};
plugs.forEach(function(item) {
    var sc = new soapclient.SoapClient(config.plugs[item].pin, config.plugs[item].url);

    soapclient.login(sc).done(function (status) {
        if (!status) {
            console.log("Login failed for " + config.plugs[item].url);
            return 
        }
        if (status != "success") {
            console.log("Login returned unsuccesful for " + config.plugs[item].url);
            return
        }
        console.log(item + " soapclient ready");
        sClients[item] = sc;
    });
});


// API ROUTES -------------------

// get an instance of the router for api routes
var apiRoutes = express.Router(); 

apiRoutes.post('/authenticate', function(req, res) {
    user = req.body.name;

    if (user!=config.auth.user) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    } else if (user) {

      // check if password matches
      if (req.body.password != config.auth.pw) {
        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {

        // if user is found and password is right
        // create a token
        var token = jwt.sign({'user' : user}, app.get('superSecret'), {
          expiresIn: 60*60*24 // expires in 24 hours
        });

        // return the information including token as JSON
        res.json({
          success: true,
          message: 'Enjoy your token!',
          token: token
        });
      }   

    }
});

// route middleware to verify a token
apiRoutes.use(function(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  
  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded; 
        next();
      }
    });
  } else {
    // if there is no token
    // return an error
    return res.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });
    
  }
});

apiRoutes.get('/list', function(req, res) {
    var plugs = Object.keys(config.plugs);
    res.json({ success: true, message:  JSON.stringify(plugs)} );
}); 

// route to show a random message (GET http://localhost:8080/api/)
apiRoutes.get('/', function(req, res) {
  res.json({ message: 'D-Link Smart Plug API' });
});


// route middleware to verify plug name
apiRoutes.use(function(req, res, next) {

  var plug = req.body.plug || req.query.plug || req.headers['x-access-plug'];

  // decode token
  if (plug) {
    console.log("Plug: " + plug); 
    if (!(plug in sClients)) {
        res.json({ success: false, message: 'Unknown plug.' });
    } else {
        next();
    }
  } else {
    // if there is no plug
    // return an error
    return res.status(403).send({ 
        success: false, 
        message: 'Missing plug.' 
    });
    
  }
});

apiRoutes.get('/login', function(req, res) {
    soapclient.login(sClients[req.query.plug]).done(function (status) {
        if (!status) {
            res.json({ success: false, message: 'Failed logging into plug:' + req.query.plug + " status:" + status});
        } else {
            if (status != "success") {
                res.json({ success: false, message: 'Failed logging into plug:' + req.query.plug });
            } else {
                res.json({ success: true, message: req.query.plug +     " soapclient ready"} );
            }
        }
    });
}); 

// route to return all users (GET http://localhost:8080/api/users)
apiRoutes.get('/state', function(req, res) {
    soapclient.state(sClients[req.query.plug]).done(function (result) {
    res.json(result);
  });
});   

apiRoutes.get('/temperature', function(req, res) {
  soapclient.temperature(sClients[req.query.plug]).done(function (result) {
    res.json(result);
  });
});   

apiRoutes.get('/on', function(req, res) {
  soapclient.on(sClients[req.query.plug]).done(function (result) {
    res.json(result);
  });
});   

apiRoutes.get('/off', function(req, res) {
  soapclient.off(sClients[req.query.plug]).done(function (result) {
    res.json(result);
  });
});   

apiRoutes.get('/consumption', function(req, res) {
  soapclient.consumption(sClients[req.query.plug]).done(function (result) {
    res.json(result);
  });
}); 

apiRoutes.get('/reboot', function(req, res) {
  soapclient.reboot(sClients[req.query.plug]).done(function (result) {
    res.json(result);
  });
});   

apiRoutes.get('/ready', function(req, res) {
  soapclient.isDeviceReady(sClients[req.query.plug]).done(function (result) {
    res.json(result);
  });
}); 

// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);
