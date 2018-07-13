const passport = require('passport')
const LocalStrategy = require('passport-local')
const bCrypt = require('bcrypt-nodejs')
const User = require('../models/user')

const isValidPassword = function (user, password) {
  return bCrypt.compareSync(password, user.password);
}

// Generates hash using bCrypt
const createHash = function (password) {
  return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

passport.serializeUser(function (user, done) {
  console.log("=========serializeUser=============", user);

  done(null, user._id);
});

passport.deserializeUser(function (id, done) {
  console.log("===========deserializeUser===========");

  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use('login', new LocalStrategy({
  passReqToCallback: true
},
  function (req, username, password, done) {
    // check in mongo if a user with username exists or not
    console.log(req.body);
    User.findOne({ 'username': username },
      function (err, user) {
        // In case of any error, return using the done method
        if (err)
          return done(err);
        // Username does not exist, log error & redirect back
        if (!user) {
          console.log('User Not Found with username ' + username);
          return done(null, false,
            req.flash('message', 'User Not found.'));
        }
        // User exists but wrong password, log the error 
        if (!isValidPassword(user, password)) {
          console.log('Invalid Password');
          return done(null, false,
            req.flash('message', 'Invalid Password'));
        }
        // User and password both match, return user from 
        // done method which will be treated like success
        return done(null, user);
      }
    );
  }));

passport.use("signup", new LocalStrategy({
  passReqToCallback: true
},
  function (req, username, password, done) {
    console.log("passport - signup");
    console.log(req.body);
    findOrCreateUser = function () {
      // return done(null, "yes")
    //   // find a user in Mongo with provided username
      User.findOne({ 'username': username }, function (err, user) {
        // In case of any error return
        if (err) {
          console.log('Error in SignUp: ' + err);
          return done(err);
        }
        // already exists
        if (user) {
          console.log('User already exists');
          return done(null, false,
            req.flash('message', 'User Already Exists'));
        } else {
          // if there is no user with that email
          // create the user
          let newUser = new User();
          // set the user's local credentials
          newUser.username = username;
          newUser.password = createHash(password);
          newUser.name = req.body.name;
          newUser.company = req.body.company;

          // save the user
          newUser.save(function (err) {
            if (err) {
              console.log('Error in Saving user: ' + err);
              throw err;
            }
            console.log('User Registration successful');
            return done(null, newUser);
          });
        }
      });
    };

    // Delay the execution of findOrCreateUser and execute 
    // the method in the next tick of the event loop
    process.nextTick(findOrCreateUser);
  }));