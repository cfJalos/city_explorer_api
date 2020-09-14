'use strict'
// loads environmental variables
require('dotenv').config();

//application dependencies
const express = require('express'); //PULL IN PACKAGE FROM NPM
const cors = require('cors');

//application setup
const PORT = process.env.PORT
const app = express();

app.use(cors());


app.use(express.static('./public'));

//server listener for request

app.listen(PORT, () => console.log(`App is listening on ${PORT}`));

