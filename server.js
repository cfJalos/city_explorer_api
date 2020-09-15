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


// API Routes
app.get('/location', handleLocation);
app.get('/weather', handleWeather);

app.use('*', errorHandler);
// app.use('*', notFoundHandler);

//helper function

function handleLocation (request, response) {
  try {
    const locData = require('./data/location.json');
    const city = request.query.city;
    const locationData = new Location(city, locData);
    response.send(locationData);
  } catch (error){
    console.log('ERROR', error);
    response.status(500).send('So sorry, something went wrong.');
  }
}


function handleWeather(request, response) {
  try {
    const data = require('./data/weather.json');
    const weatherData = [];
    data.data.forEach(entry => {
      weatherData.push(new Weather(entry));
    });
    response.send(weatherData);
  }
  catch (error) {
    console.log('ERROR', error);
    response.status(500).send('So sorry, something went wrong.');
  }
}

function errorHandler(request, response) {
  response.status(404).send('STATUS:500 Error, wrong path');
}


function Location(city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData[0].display_name;
  this.latitude = geoData[0].lat;
  this.longitude = geoData[0].lon;
}

function Weather(entry) {
  this.forecast = entry.weather.description;
  this.time = entry.valid_date;
}
