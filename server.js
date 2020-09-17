'use strict'
// loads environmental variables
require('dotenv').config();

//application dependencies
const express = require('express'); //PULL IN PACKAGE FROM NPM
const cors = require('cors');
const superagent = require('superagent');

// Bring in the postgres client library so we can connect to db
const pg = require('pg');

//application setup
const PORT = process.env.PORT
const app = express();


// Initialize Postgres
// Need to tell pg.Client where our DB is
const client = new pg.Client(process.env.DATABASE_URL);
// client.on('error', err => console.error(err));

// Incorporate "cors" to allow access to the server
app.use(cors());


app.use(express.static('./public'));

//server listener for request/start server


// API Routes
app.get('/location', handleLocation);
app.get('/weather', handleWeather);
app.get('/trails', handleTrails);

app.use('*', errorHandler);


//helper function

function handleLocation (request, response) {

  let city = request.query.city
  const SQL = `SELECT * FROM location WHERE search_query=$1;`;
  let safeValues = [city]
  client.query(SQL, safeValues)
    .then(results => {
      if (results.rows.length > 0) {
        console.log('getting city from memory', request.query.city)
        response.status(200).json(results.rows[0]);
      }
      else {
        let url = `https://us1.locationiq.com/v1/search.php`;

        let queryObject = {
          key: process.env.GEOCODE_API_KEY,
          city: request.query.city,
          format: 'json',
          limit: 1
        };

        superagent.get(url).query(queryObject)
          .then(APIresult => {
            const data = APIresult.body[0];
            const location = new Location(city, data)
            const queryString = ('INSERT INTO location (search_query, formatted_query, latitude, longitude) VALUES ($1,$2,$3,$4)');
            const safeValues = [city, location.formatted_query, location.latitude, location.longitude];
            console.log(safeValues);
            client.query(queryString, safeValues)
              // eslint-disable-next-line no-unused-vars
              .then(insertedData => response.send(location))
              .catch(error => {
                console.log(error);
                response.status(500).send(error.message);
              })
              .catch(error => {
                console.log(error);
                response.status(500).send(error.message);
              });
          })
      }
    })
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
  let lat = request.query.latitude;
  let lon = request.query.longitude;
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
  this.formatted_query = geoData.display_name;
  this.latitude = geoData.lat;
  this.longitude = geoData.lon;
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

function startServer() {
  app.listen(PORT, () => {
    console.log('Server is listening on port', PORT);
  });
}

client.connect()
  .then(startServer)
  .catch(e => console.log(e));
