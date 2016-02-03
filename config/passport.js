var LocalStrategy = require('passport-local').Strategy;

var mysql = require('mysql');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'summer_camp'
});

module.exports = function(passport){
    passport.serializeUser(function(user, done){
        done(null, user)
    });

    passport.deserializeUser(function(user, done){
        done(null, user);
    });

    passport.use('local-login', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
    },
        function(req, email, password, done){
            connection.query("select * from nastavnik where email = '" + email + "'", function(err, rows){
                console.log(rows[0]);
                if(err) {
                    console.log('u1');
                    return done(err);
                } if(!rows.length) {
                    console.log('u2');
                    return done(null, false, req.flash('loginMessage', 'Korisnik nije pronađen'));
                } if(!(rows[0].pass === password)) {
                    console.log('u3');
                    return done(null, false, req.flash('loginMessage', 'Krivi podatci'));
                }

                return done(null, rows[0]);
            });
        }
    ));

    passport.use('local-login-2', new LocalStrategy({
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true
        },
        function(req, email, password, done){
            connection.query("select * from polaznik where email = '" + email + "'", function(err, rows){
                console.log(rows[0].password);
                if(err) {
                    console.log('u1');
                    return done(err);
                } if(!rows.length) {
                    console.log('u2');
                    return done(null, false, req.flash('loginMessage', 'Korisnik nije pronađen'));
                } if(!(rows[0].password === password)) {
                    console.log('u3');
                    return done(null, false, req.flash('loginMessage', 'Krivi podatci'));
                }

                return done(null, rows[0]);
            });
        }
    ));

    passport.use('local-signup', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
        function(req, email, password, done){
         connection.query("select * from polaznik where email = ?", [email], function(err, rows){
             console.log(rows);
             if(err) {
                 return done(err);
             }
             if(rows.length) {
                return done(null, false, req.flash('signupMessage', 'Korisnik sa tim emailom već postoji'));
             } else {
              var newUser = new Object();

                 console.log(email);
                 newUser.email = email;
                 newUser.password = password;
                 newUser.ime = req.body.polaznik_ime;
                 newUser.prezime = req.body.polaznik_prezime;
                 newUser.adresa = req.body.polaznik_adresa;
                 newUser.mjesto = req.body.polaznik_mjesto;
                 newUser.datum_rodjenja = req.body.polaznik_datum;

                 var data = {
                     ime: req.body.polaznik_ime, prezime: req.body.polaznik_prezime,
                     email: email, adresa: req.body.polaznik_add, mjesto_id: req.body.polaznik_mjesto,
                     datum_rodjenja: req.body.polaznik_datum, password: password
                 };

                 var insertQuery = "INSERT INTO polaznik SET ?";
                 var q = connection.query(insertQuery, data, function(error, rows){

                     if(error) {
                         console.log(error);
                     }

                     newUser.polaznik_id = rows.insertId;

                     console.info(rows);
                     done(null, newUser);
                 });

                 console.log(q.sql);

             }});
        }));
};