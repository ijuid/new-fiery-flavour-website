const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = 3000;
const mysql = require("mysql");
const http = require("http");

const server = http.createServer(function (req, res){
    res.writeHead(200, { 'Content-Type': 'text/plain' }); // Set the response HTTP header with HTTP status and Content type
    res.end('Hello, World!\n'); // Send the response body as 'Hello, World!'
});

const pool = mysql.createPool({
    connectionLimit: 100,
    host: "sql8.freesqldatabase.com",
    user: "sql8807974",
    password: "HkHxHIDR42",
    database: "sql8807974",
});

function queryDatabase(query, callback) {
    pool.getConnection((err, connection) => {
        if (err) {
            return callback(err, null);
        } else if (connection) {
            connection.query(query, (err, rows, fields) => {
                connection.release();
                if (err) {
                    return callback(true, err);
                }
                return callback(null, rows);
            });
        } else {
            return callback(true, "No connection");
        }
    });
}

pool.getConnection(function(err, con){
    if (err) throw err;
    console.log("Connected");
    con.query("CREATE TABLE IF NOT EXISTS reservation (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), partySize TINYINT, bookingDate VARCHAR(10), bookingTime VARCHAR(5), phoneNum VARCHAR(10), email VARCHAR(255) UNIQUE NOT NULL)", (err)=>{
        con.release();
        if (err) throw err;
        console.log("Created table");
    })
})

app.post("/register", (req, res) => {
    pool.getConnection(function (err, con) {
        if (err) {
            return res.json("error!")
        }
        console.log("Connected");
        const sql = "INSERT INTO reservation (name, partySize, bookingDate , bookingTime, phoneNum, Email) VALUES (?)";
        const values = [
            req.body.fname,
            req.body.size,
            req.body.date,
            req.body.time,
            req.body.contactNum,
            req.body.email
        ]
        con.query(sql,[values], function (err, data){
            con.release();
            if (err) {
               throw err;
            }
            else {
                console.log("1 record inserted!");
                res.render('confirmed');
            }
        })
    });
});

app.use(express.static("public"));
app.set("view engine", "ejs");


app.get("/", (req, res) => {
  res.render("index");
});

app.get('/new-table', (req, res) => {
    res.render('new-table'); 
});

app.get('/log-in', (req, res) => {
    res.render('log-in');
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Sandbox listening on http://0.0.0.0:${port}`);
});


