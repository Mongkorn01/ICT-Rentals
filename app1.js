// cp .env.example .env
const express = require('express');
const dotenv = require("dotenv");
const mysql = require('mysql2');
const path = require('path')

/* 1. Create a router object and register the router */
const app = express();
const router = express.Router();
app.use(express.urlencoded({ extended: true }));
app.use('/', router)
dotenv.config();

/* Connect to DB*/
var connection = mysql.createConnection({
    host : process.env.MYSQL_HOST,
    user : process.env.MYSQL_USERNAME,
    password : process.env.MYSQL_PASSWORD,
    database : process.env.MYSQL_DATABASE
});

connection.connect(function(err){
    if(err) throw err;
    console.log(`Connected DB: ${process.env.MYSQL_DATABASE}`);
});

router.get('/', (req,res) => {
    console.log(`Request at ${req.url}`)
    res.sendFile(path.join(__dirname, '/html/search.html'))
});

app.listen(process.env.PORT, () => {
    console.log(`Server listening on port: ${process.env.PORT}`)
    console.log(`Visit the website: http://localhost:${process.env.PORT}`);
})