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
const {it} = require("node:test");

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
                for (let i =0; i<data.length; i++){
                   if(data[i] == null){
                       break;
                   } else{
                       let sqlDate = data[i].bookingDate;  // e.g., '2025-12-26'
                       let parts = sqlDate.split('-');
                       let formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
                       fullDate += (i+1) + ") " + formattedDate + " at " + data[i].bookingTime + " with a party size of: " + data[i].partySize +'<br>' ;
                   }
                }
                const items = {
                    fullName: data[0].name,
                    theEmail: req.body.email,
                    date: data[0].bookingDate,
                    time: data[0].bookingTime,
                    fullDate1: fullDate
                };
                req.session.sessOldEmail = items.theEmail
                res.render("results", items);

            }else{
              res.render("log-in", {invalid: 'Invalid Email'});
            }
        })
    })
});

app.post("/delete", (req, res) => {
    const sql2 = "DELETE FROM reservation WHERE email = ?";
    //THIS WONT WORK! MUST MAKE NEW VIEWS FILE FOR DELETING, WILL ALLOW CHOOSING EACH RESERVATION
    //if (req.body.email !== req.session.sessOldEmail){
      //  res.render("results", {invalid: 'Invalid old email'});
    //}
    pool.getConnection(function (err, con) {
        if (err) {
            return res.json(err);
        }
        con.query(sql2, req.body.email, (err, data) => {
            con.release();
            if (err) {
                res.render("invalid-email");
            }else if(data.affectedRows===0){
                    res.render("invalid-email");
            }else {
                res.render("deletion");
            }
        });
    });

});


app.post("/change", (req, res) => {
    const sql3 = "UPDATE reservation SET email = ? WHERE email= ?";
    let arr=[
        req.body.newEmail,
        req.body.oldEmail
    ]
    if (req.body.oldEmail !== req.session.sessOldEmail){
        res.render("email-change", {invalid: 'Invalid Email'});
    }
    else {
        pool.getConnection(function (err, con) {
            if (err) {
                return res.json(err);
            }
            con.query(sql3, arr, (err, data) => {
                con.release();
                if (err) {
                    return res.json(err);
                } else if (data.affectedRows === 0) {
                    res.render("email-change", {invalid: 'Invalid Email'});
                } else {
                    res.render("change-successful");
                }
            });

        });
    }
});


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

app.get("/email-change", (req, res) => {
    res.render("email-change");
});

//starts express server
app.listen(port, "0.0.0.0", () => {
    console.log(`Sandbox listening on http://0.0.0.0:${port}`);
});
