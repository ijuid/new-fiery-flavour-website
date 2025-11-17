var http = require("http");
const express = require("express");
const app = express();
const port = 3000;
const mysql = require("mysql");

const pool = mysql.createPool({
  connectionLimit: 100,
  host: "sql8.freesqldatabase.com",
  user: "sql8807974",
  password: "HkHxHIDR42",
  database: "sql8807974",
});
let out = "";

pool.getConnection(function (err, con) {
  if (err) throw err;
  console.log("Connected!");
  //...
});


con.connect((err) => {
  if(err) throw err;
  console.log("connected to database!");

con.query("drop table if exists reservations;", (err,result)=>{
  console.log("drop table:");
  console.log(result);
  out += "drop table:" + err + "\n";

  con.query("create table reservations ( name VARCHAR(255), size INTEGER(50), bookingDate DATETIME, contactNumber INTEGER(11), email VARCHAR(255);", (err,result) =>{
    console.log("create table:");
    console.log(result);
    out += "create table:" + err + "\n";
  });
});


  

app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.sendFile("public/index.html", { root: __dirname });
});

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/new-table", (req, res) => {
  res.render("new-table");
});

app.get("/log-in", (req, res) => {
  res.render("log-in");
});

app.listen(port, () => {
  console.log(`Sandbox listening on port ${port}`);
});
});
