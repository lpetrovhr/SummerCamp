var mysql = require('mysql');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'summer_camp',
    multipleStatements: true
});

module.exports = function(app, passport){
    app.get('/',function(req, res) {
        var queryString = "select * from mjesto";
        connection.query(queryString, function(error, rows){
            if(error) {
                console.log(error);
            }
            res.render('index', {title: 'Summer Camp', grad: rows});
    })});

    app.route('/profesor-login')
        .post(passport.authenticate('local-login', {
            successRedirect: '/korisnik',
            failureRedirect: '/',
            failureFlash: true,
            successFlash: true
        }));

    app.route('/polaznik-login')
        .post(passport.authenticate('local-login-2',{
            successRedirect: '/polaznik',
            failureRedirect: '/',
            failureFlash: true,
            successFlash: true
        }));

    app.route('/registracija')
        .post(passport.authenticate('local-signup',{
            successRedirect: '/polaznik',
            failureRedirect: '/',
            failureFlash: true,
            successFlash: true
        }));

    app.route('/polaznik')
        .get(isLoggedIn, getSviProgrami, getUpisaniProgrami, renderPolaznik);

    app.route('/korisnik')
        .get(isLoggedIn,getGrad, getNastavnik, getProgram, renderKorisnik);

    app.route('/lista')
        .get(function(req, res){
           res.render('lista',{title: 'Lista Programa'})
        });

    app.route('/mojiProgrami')
        .get(isLoggedIn, function(req, res){
            var user = req.user;
            if(!user.nastavnik_id) {
                res.redirect('/');
            }

            var queryString = "SELECT * FROM program WHERE nastavnik_id= ? " +
                "ORDER BY termin asc";
            connection.query(queryString, [user.nastavnik_id], function(error, rows){
                if(error) {
                    console.log(error);
                }

                res.render('moji-programi', {user: user, title: 'Moji programi', program: rows});
            });
        });

    app.route('/polaznikProgrami')
        .get(isLoggedIn, function(req, res){
            var user = req.user;
            if(user.nastavnik_id){
                res.redirect('/');
            }

            var queryString = "SELECT * FROM polaznik_program " +
                "INNER JOIN polaznik ON polaznik.polaznik_id = polaznik_program.polaznik_id " +
                "INNER JOIN program ON program.program_id = polaznik_program.program_id " +
                "WHERE polaznik_program.polaznik_id = ? " +
                "ORDER BY termin asc ";

            connection.query(queryString,[user.polaznik_id] ,function(error, rows){
                if(error) {
                    console.log(error);
                }

                console.log(rows);

                res.render('programi-polaznika', {user: user, title: 'Moji programi', program: rows})
            });
        });

    app.route('/dodaj-predavaca')
        .post(function(req, res){
            console.log(req.body.predavac_ime);
            console.log(req.body.predavac_prezime);
            console.log(req.body.predavac_email);
            console.log(req.body.predavac_pass);
            console.log(req.body.predavac_add);
            console.log(req.body.predavac_mjesto);
            console.log(req.body.predavac_datum);
            var dataSet = {
                ime: req.body.predavac_ime, prezime: req.body.predavac_prezime,
                email: req.body.predavac_email, pass: req.body.predavac_pass,
                adresa: req.body.predavac_add, mjesto_id: req.body.predavac_mjesto,
                datum_rodjenja: req.body.predavac_datum
            };
            connection.query("insert into nastavnik set ?", dataSet,function(error){
                if(error) {
                    console.log(error);
                }

                res.redirect('/korisnik');
            });
        });

    app.route('/dodaj-program')
        .post(function(req, res){
            console.log(req.body.program_naziv);
            console.log(req.body.program_min);
            console.log(req.body.program_max);
            console.log(req.body.program_termin);
            console.log(req.body.program_prostorija);
            console.log(req.body.program_add);
            console.log(req.body.program_mjesto);
            console.log(req.body.program_predavac);

            var dataSet = {
                naziv: req.body.program_naziv, maksimalni_broj: req.body.program_max,
                minimalni_broj: req.body.program_min, termin: req.body.program_termin,
                prostorije: req.body.program_prostorija, adresa: req.body.program_add,
                mjesto_id: req.body.program_mjesto, nastavnik_id: req.body.program_predavac,
                broj_upisanih: 0
            };
            connection.query("insert into program set ?", dataSet, function(error){
               if(error) {
                   console.log(error);
               }


                res.redirect('/korisnik');
            });
        });

    app.route('/editClass')
        .get(function(req, res){
            console.log(req.param('ajaxValue'));
            var id = req.param('ajaxValue');
            var queryString = "select program.*, mjesto.mjesto_id, mjesto.naziv as naziv_mjesta, nastavnik.* from program " +
                "INNER JOIN  mjesto ON mjesto.mjesto_id = program.mjesto_id " +
                "INNER JOIN  nastavnik ON nastavnik.nastavnik_id = program.nastavnik_id " +
                "where program_id = ?";


            connection.query(queryString, id, function(error, rows){
                if(error) {
                    console.log(error);
                }

                res.send({tecaj: rows});
            });
        });

    app.route('/editClass/save/:id')
        .post(function(req, res){
            console.log(req.params.id);
            var id = req.params.id;
            var dataSet = {
                naziv: req.body.program_naziv, maksimalni_broj: req.body.program_max,
                minimalni_broj: req.body.program_min, termin: req.body.program_termin,
                prostorije: req.body.program_prostorija, adresa: req.body.program_add,
                mjesto_id: req.body.program_mjesto, nastavnik_id: req.body.program_predavac
            };

            var queryString = "update program set ? where program_id = ?";
            connection.query(queryString, [dataSet, id], function(err, rows){
                if(err){
                    console.log('Error on query update');
                }

                res.redirect('/korisnik');
            });
        });

    app.route('/classEnrole/:id')
        .get(function(req, res){
            var user = req.user;
            var program_id = req.params.id;
            var dataSet = {polaznik_id: user.polaznik_id,
            program_id: program_id};
            console.log(dataSet);
            var queryString1 = "INSERT INTO polaznik_program SET ?";

            connection.query(queryString1, [dataSet], function(error, rows){
                if(error) {
                    console.log(error);

                    req.flash('info', 'Već ste upisali ovaj tečaj');
                }

                res.redirect('/polaznik');
            });
        });

    app.route('/classUnrole/:id')
        .get(function(req, res){
            var user = req.user;
            var program_id = req.params.id;
            var queryString = "DELETE FROM polaznik_program WHERE polaznik_id = ? AND program_id = ?";
            connection.query(queryString, [user.polaznik_id, program_id], function(error, rows){
                if(error){
                    console.log(error);
                }

                res.redirect('/polaznik');
            });
        });

    app.route('/getMyClass')
        .get(function(req, res){
            var id = req.param('ajaxValue');
            var user = req.user;

            var queryString = "SELECT * FROM program WHERE program_id = ?" +
                "ORDER by termin asc";
            connection.query(queryString, [id], function(error, row){
                if(error) {
                    console.log(error);
                }

                res.send({mojProgram: row});
            });
        });

    app.route('/logout')
        .get(function(req, res){
            req.logout();
            res.redirect('/');
        });
};

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
};

function getGrad(req, res, next){
    var queryString = "select * from mjesto";
    connection.query(queryString, function(error, rows){
        if(error) {
            console.log(error);
        }

        req.mjesto = rows;
        return next();
    });
};

function getNastavnik(req, res, next){
    var queryString = "select * from nastavnik WHERE nastavnik.nastavnik_id != ?";
    connection.query(queryString, 1, function (error, rows) {
        if(error){
            console.log(error);
        }

        req.nastavnik = rows;
        return next();
    });
};

function getProgram(req, res, next){
    var queryString = "SELECT * FROM program INNER JOIN nastavnik ON program.nastavnik_id = nastavnik.nastavnik_id";
    connection.query(queryString, function(error, rows){
        if(error) {
            console.log(error);
        }
        req.program = rows;
        return next();
    });
};

function renderKorisnik(req, res){
    var user = req.user;
    if(!user.nastavnik_id) {
        res.redirect('/');
    }
    res.render('korisnik', { title: 'Korisničke stranice', user: user, grad: req.mjesto, predavac: req.nastavnik, program: req.program})
};

function getSviProgrami(req, res, next){
    var queryString = "select program.*, mjesto.mjesto_id, mjesto.naziv as naziv_mjesta, nastavnik.* from program " +
        "INNER JOIN  mjesto ON mjesto.mjesto_id = program.mjesto_id " +
        "INNER JOIN  nastavnik ON nastavnik.nastavnik_id = program.nastavnik_id " +
        "WHERE program.broj_upisanih < program.maksimalni_broj " +
        "order by program.termin asc";

    connection.query(queryString, function(error, rows){
        if(error){
            console.log(error);
        }
        req.sviProgrami = rows;
        return next();
    });
};

function getUpisaniProgrami(req, res, next){
    var user = req.user;
    var queryString = "SELECT * FROM polaznik_program " +
        "INNER JOIN polaznik ON polaznik.polaznik_id = polaznik_program.polaznik_id " +
        "INNER JOIN program ON program.program_id = polaznik_program.program_id " +
        "INNER JOIN nastavnik on nastavnik.nastavnik_id = program.nastavnik_id " +
        "WHERE polaznik_program.polaznik_id = ? ";

    connection.query(queryString, [user.polaznik_id], function(error, rows){
        if(error){
            console.log(error);
        }
        req.upisaniProgrami = rows;
        return next();
    });
};

function renderPolaznik(req, res){
    var user= req.user;
    if(user.nastavnik_id){
        res.redirect('/');
    }
    console.log(req.upisaniProgrami);
    console.log(req.sviProgrami);
    res.render('polaznik', {user: user, title: 'Korisničke stranice', sviProgrami: req.sviProgrami, upisaniProgrami: req.upisaniProgrami, message: req.flash('info')});
};