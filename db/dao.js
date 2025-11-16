const mysql = require("mysql");
var express = require("express");
var router = express.Router();
var pool = mysql.createPool({
  connectionLimit: 100,
  host: "sql8.freesqldatabase.com",
  user: "sql8807974",
  password: "HkHxHIDR42",
  debug: false,
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

con.connect(function(err){
  if (err) throw err;
  console.log("Connected");
  let sql = "CREATE TABLE reservation (name VARCHAR(255), partySize INT(20), bookingDate DATE, bookingTime )
})

router.post("/booking.html", function (req, res, next) {
    console.log(req.fname);
    console.log(req.size);
    console.log(req.date);
    console.log(req.time);
    console.log(req.contactNum);
    console.log(req.email);
    con.connect(function (err) {
      if (err) throw err;
      console.log("Connected");
      var sql = Insert;
    });
  });
