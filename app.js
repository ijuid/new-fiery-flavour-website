//loads express frameworl
const express = require("express");
const session = require('express-session');
const app = express();

//middleware to parse json and url-encoded form data
app.use(express.json());
app.use(session({ secret: 'email123', resave: false, saveUninitialized: true }));
app.use(express.urlencoded({ extended: true }));

//sets ejs as the template engine
app.set("view engine", "ejs");

//serves static files from the public directory
app.use(express.static("public"));

const port = process.env.PORT || 3000;

//mysql driver
const mysql = require("mysql");
const http = require("http");
const {it, todo} = require("node:test");

//creates a basic http server
const server = http.createServer(function (req, res) {
    res.writeHead(200, { "Content-Type": "text/plain" }); // Set the response HTTP header with HTTP status and Content type
    res.end("Hello, World!\n"); // Send the response body as 'Hello, World!'
});

//creating a mysql connection pool
const pool = mysql.createPool({
    connectionLimit: 100,
    host: "localhost",
    user: "fiery",
    password: "123",
    database: "website",
});
let out = "";

//tests initial connection to the pool
pool.getConnection(function (err, con) {
    if (err) throw err;
    console.log("Connected!");
});

//utility function to run sql queries with a callback
function queryDatabase(query, callback) {
    pool.getConnection((err, connection) => {
        if (err) {
            return callback(err, null); //connection error
        } else if (connection) {
            //executes the sql query
            connection.query(query, (err, rows, fields) => {
                connection.release(); //returns connection to pool
                if (err) {
                    return callback(true, err); //connection error
                }
                return callback(null, rows); //successful results
            });
        } else {
            return callback(true, "No connection");
        }
    });
}

//creates the reservation table if it does not exist
pool.getConnection(function (err, con) {
    if (err) throw err;
    console.log("Connected");

    con.query(
        "CREATE TABLE IF NOT EXISTS reservation (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), partySize TINYINT, bookingDate VARCHAR(10), bookingTime VARCHAR(5), phoneNum VARCHAR(10), email VARCHAR(255) NOT NULL)",
        (err) => {
            con.release();
            if (err) throw err;
            console.log("Created table");
        }
    );
});

//inserts a reservation into the database
app.post("/register", (req, res) => {
    console.log("registering...");
    //inserting into database
    pool.getConnection(function (err, con) {
        if (err) throw err;
        console.log("Connected");

        const selector = "SELECT * FROM reservation WHERE bookingDate= ? AND bookingTime = ? AND email = ?  "
        const checkValues = [req.body.date, req.body.time, req.body.email];

        con.query(selector, checkValues, function (err, data) { //checks if person has already booked the time
            if (err) throw err;
            if(data.length > 0){
                return res.render("new-table", {invalid: 'Slot already booked'});
            }
            const sqlAdder = "INSERT INTO reservation (name, partySize, bookingDate , bookingTime, phoneNum, email) VALUES (?)";
            const mainValues = [req.body.fname, req.body.size, req.body.date, req.body.time, req.body.contactNum, req.body.email];

            con.query(sqlAdder, [mainValues], function (err, result) { // putting this inside the 1st con.query makes it synchronous
                con.release();
                if (err) throw err;
                else {
                    console.log("1 record inserted!");
                    res.render("confirmed");
                }
            });
        });
    });
});


app.post("/sign-in", (req, res) => {
    const sql1 = "SELECT * FROM reservation WHERE email = ?";
    pool.getConnection(function (err, con) {
        if (err){
            return res.json(err);
        }
        con.query(sql1 ,req.body.email, (err, data) => {
            con.release();
            if (err){
                return res.json(err);
            }
            if(data.length > 0){
                //for loop and concat all the booking dates and times into 1 value!!
                var fullDate = "";
                var dateArr = []
                var timeArr = []
                for (let i =0; i<data.length; i++){
                   if(data[i] == null){
                       break;
                   } else{
                       let sqlDate = data[i].bookingDate;  // e.g., '2025-12-26'
                       let parts = sqlDate.split('-');
                       let formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
                       fullDate += (i+1) + ") " + formattedDate + " at " + data[i].bookingTime + " with a party size of: " + data[i].partySize +'<br>' ;

                      dateArr.push(data[i].bookingDate);
                      timeArr.push(data[i].bookingTime);
                   }

                }
                req.session.userData = {
                    fullName: data[0].name,
                    theEmail: req.body.email,
                    date: /*data[0].bookingDate,*/ dateArr,
                    time: /*data[0].bookingTime,*/ timeArr,
                    fullDate1: fullDate //LEAVE IT FOR NOW
                };
                req.session.sessOldEmail = req.body.email
                return res.redirect("/results");

            }else{
               res.render("log-in", {invalid: 'Invalid Email'});
            }
        })
    })
});

app.post("/delete", (req, res) => {
    const sql2 = "SELECT * FROM reservation WHERE email = ?"; //@TODO REUSE FROM SQL1!!!!
    pool.getConnection(function (err, con) {
        if (err) {
            return res.json(err);
        }
        con.query(sql2, (err, data) => {
            //con.release();
            if (err) {
                res.render("invalid-email");
            }
            let deleteSql = "DELETE * FROM reservation WHERE email = ? AND bookingDate = ? AND bookingTime = ?";
            for(let i=0; i<10; i++){  //data.length?
                if (req.body.date + i){
                    var details = [req.session.sessOldEmail, req.body.date + i [0], req.body.date + i [1]];
                    con.query(deleteSql, details, (err, data) => {
//                        if (err) {
  //                          res.render("invalid-email");
    //                    }
                    });

                }
            }
            con.release();
            return res.redirect("deletion");
            /*else if(data.affectedRows===0){
                    res.render("invalid-email");
            }else {
                res.render("deletion");
            }*/
        });
    });

});


app.post("/change", (req, res) => {
    const sql3 = "UPDATE reservation SET email = ? WHERE email= ?";
    let arr=[
        req.body.newEmail,
        req.session.sessOldEmail
    ];
        pool.getConnection(function (err, con) {
            if (err) {
                return res.json(err);
            }
            con.query(sql3, arr, (err, data) => {
                con.release();
                if (err) {
                    return res.json(err);
                }else {
                    return res.redirect("change-successful");
                }
            });
        });
});

//@TODO
app.post("/name-change", (req, res) => {
    const sql4 = "UPDATE reservation SET name = ? WHERE name= ?";
    pool.getConnection(function (err, con) {
        if (err) {
            return res.json(err);
        }
        const arr = [req.fname, req.session.fullName];
        con.query(sql4, arr, (err, data) => {
            con.release();
            if (err) {
                return res.json(err);
            }else {
                req.session.fullName = data[0].name;
                return res.redirect("change-successful");  //DOESNT WORK
            }
        });
    });
});



function dataCollector(userData) {
    var items = {
        fullName: userData.fullName,
        theEmail: userData.theEmail,
        date: userData.date,
        time: userData.time,
        fullDate1: userData.fullDate1
    }
    return items;
}


//route handlers to render pages
app.get("/", (req, res) => {
    res.render("index");
});

app.get("/new-table", (req, res) => {
    res.render("new-table");
});

app.get("/log-in", (req, res) => {
    res.render("log-in");
});

app.get("/results", (req, res) => {
    if (!req.session.userData){
        return res.render("log-in");
    }
    const userData = req.session.userData;
    res.render("results", dataCollector(userData))
});

app.get("/email-change", (req, res) => {
    const userData = req.session.userData;
    res.render("email-change", dataCollector(userData));
});

app.get("/change-successful", (req, res) => {
    res.render("change-successful");
});

app.get("/deletion", (req, res) => {
    res.render("change-successful");
});

//starts express server
app.listen(port, "0.0.0.0", () => {
    console.log(`Sandbox listening on http://0.0.0.0:${port}`);
});
