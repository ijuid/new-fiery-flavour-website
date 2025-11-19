//loads express frameworl
const express = require("express");
const app = express();

//middleware to parse json and url-encoded form data
app.use(express.json());
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
    host: "sql8.freesqldatabase.com",
    user: "sql8807974",
    password: "HkHxHIDR42",
    database: "sql8807974",
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
        "CREATE TABLE IF NOT EXISTS reservation (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), partySize TINYINT, bookingDate VARCHAR(10), bookingTime VARCHAR(5), phoneNum VARCHAR(10), email VARCHAR(255) UNIQUE NOT NULL)",
        (err) => {
            con.release();
            if (err) throw err;
            console.log("Created table");
        }
    );
});

//inserts a reservation into the database
app.post("/register", (req, res) => {
    //logs incoming form data
    console.log(req.body.fname);
    console.log(req.body.size);
    console.log(req.body.date);
    console.log(req.body.time);
    console.log(req.body.contactNum);
    console.log(req.body.email);

    //inserting into database
    pool.getConnection(function (err, con) {
        if (err) throw err;
        console.log("Connected");

        const sql =
            "INSERT INTO reservation (name, partySize, bookingDate , bookingTime, phoneNum, email) VALUES (?)";

        const values = [
            req.body.fname,
            req.body.size,
            req.body.date,
            req.body.time,
            req.body.contactNum,
            req.body.email,
        ];

        //execute insert query
        con.query(sql, [values], function (err, result) {
            con.release();
            if (err) throw err;
            else {
                console.log("1 record inserted!");
                res.render("confirmed");
            }
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
                const items = {
                    fullName: data[0].name,
                    theEmail: req.body.email,
                    date: data[0].bookingDate,
                    time: data[0].bookingTime
                };
                res.render("results", items);

            }else{
                res.render("log-in",{message: "Email not found"});
            }
        })
    })
});

    app.post("/delete", (req, res) => {
        const sql2 = "DELETE FROM reservation WHERE email = ?";
        pool.getConnection(function (err, con) {
            if (err) {
                return res.json(err);
            }
            con.query(sql2, req.body.email, (err, data) => {
                con.release();
                if (err) {
                    return res.json(err);
                }else if (data.length < 0){
                    res.render("results");
                } else {
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
    pool.getConnection(function (err, con) {
        if (err) {
            return res.json(err);
        }
        con.query(sql3, arr, (err, data) => {
            con.release();
            if (err) {
                return res.json(err);
            }else if (data.length < 0){
                res.render("email-change");
            } else {
                res.render("change-successful");
            }
        });

    });
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
