'use strict'
// loads environmental variables
require('dotenv').config();

//application dependencies
const express = require('express'); //PULL IN PACKAGE FROM NPM
const cors = require('cors');
const superagent = require('superagent');

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
app.get('/trails', handleTrails);

app.use('*', errorHandler);


//helper function

function handleLocation (request, response) {
  let city = request.query.city;
  let key = process.env.GEOCODE_API_KEY;
  let url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;


  superagent.get(url)
    .then(data => {
      const locData = JSON.parse(data.text)
      const locArr = new Location(city, locData);
      // console.log(locArr);
      response.send(locArr);
    })
    .catch(() => response.status(500).send('So sorry, something went wrong.'));
}


function handleWeather(request, response) {
  let key = process.env.WEATHER_API_KEY;
  let city = request.query.search_query;
  let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&country=us&days=8&key=${key}`;


  superagent.get(url)
    .then(data => {
      console.log(data.body.data);
      const weatherArr = data.body.data
      const weatherConst = weatherArr.map(entry => new Weather(entry));
      response.send(weatherConst);
    })
    .catch(() => response.status(500).send('So sorry, something went wrong.'));
}


function handleTrails(request, response){
  let lat = request.query.lat;
  let lon = request.query.lon;
  let key = process.env.HIKING_API_KEY;
  let url = `https://www.hikingproject.com/data/get-trails?lat=${lat}&lon=${lon}&maxDistance=10&key=${key}`;

  superagent.get(url)
    .then(hike => {
      const hikingData = hike.body.trails;
      const trailData = hikingData.map(active => new Hiking(active));
      response.send(trailData);
    })
    .catch(() => response.status(500).send('So sorry, something went wrong.'));
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

function Hiking(active) {
  this.name = active.name
  this.location = active.location
  this.length = active.length
  this.stars = active.stars
  this.star_votes = active.starVotes
  this.summary = active.summary
  this.trail_url = active.url
  this.conditions = active.conditionDetails
  this.condition_date = active.conditionDate.slice(0,9);
  this.condition_time = active.conditionDate.slice(11,19);
}
