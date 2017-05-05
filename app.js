var express = require('express');
var request = require('request');
var rp = require('request-promise');

try {
  var config = require('./config'); // Local config file not included in git
}
catch (err) {
  var config = 'foo';// PROCESS.ENV for Heroku eventually
}

var YELP_TOKEN;

var app = express();

let bars = [{
  type: 'bars',
  id: 'sports-bar',
  attributes: {
    name: 'Sports Bar',
    location: 'Brighton, MA',
    going: 0,
    rating: 4,
    description: 'This is a great bar to catch a game at.',
    image: 'http://www.hermarys.com/wp-content/uploads/sports-bar-600x360.png'
  }
}, {
  type: 'bars',
  id: 'dive-bar',
  attributes: {
    name: 'Dive Bar',
    location: 'Allston, MA',
    going: 0,
    rating: 3,
    description: 'This is a great bar to have a cheap beer.',
    image: 'https://divebardiscourse.files.wordpress.com/2015/09/dive-counter.jpg'
  }
}, {
  type: 'bars',
  id: 'wine-bar',
  attributes: {
    name: 'Wine Bar',
    location: 'Brookline, MA',
    going: 0,
    rating: 5,
    description: 'This is a great bar to have wine at.',
    image: 'https://vinepair.com/wp-content/uploads/2015/10/Krog-Bar.jpg'
  }
}];

var yelpTokenApiPromise = new Promise(function(resolve, reject) {

  let options = {
    method: 'POST',
    uri: 'https://api.yelp.com/oauth2/token',
    form: {
      grant_type: 'client_credentials',
      client_id: config.YELP_CLIENT_ID,
      client_secret: config.YELP_CLIENT_SECRET,
    },
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    json: true
  };

  rp(options)
    .then(body => {
      YELP_TOKEN = body.access_token;
      resolve(YELP_TOKEN);
    })
    .catch(err => {
      reject(Error(err));
    })
});

function searchYelpLocation (location) {
  let options = {
    method: 'GET',
    uri: 'https://api.yelp.com/v3/businesses/search?limit=15&categories=bars&location=' + location,
    headers: {
      'authorization': 'BEARER ' + YELP_TOKEN
    },
    json: true
  };

  return new Promise(function(resolve, reject) {
    rp(options)
      .then(body => {
        resolve(body);
      })
      .catch(err => {
        reject(Error(err));
      })
  })
}


app.get('/', function (req, res) {

  res.send('Hello World!');
});

app.get('/api', function (req, res) {
  res.send('You have accessed the API route');
});

app.get('/api/bars', function (req, res) {
  console.log('getting local info');
  console.log(req.queryParams);

  yelpTokenApiPromise.then(result => {
    console.log('Received Yelp Token');

    searchYelpLocation('Boston').then(results => {
      // TODO: Figure out caching info so we don't make new calls every time
      // TODO: Why aren't the google maps showing up
      // TODO: Add actual search button for location 
      // TODO: authentication
      // TODO: storing who's going where in our db

      let bars = [];
      for (let i = 0; i < results.businesses.length; i++) {
        let bar = {};
        bar.type = 'bars';
        bar.id = results.businesses[i].id;
        bar.attributes = {
          name: results.businesses[i].name,
          location: results.businesses[i].location.address1 + ' ' + results.businesses[i].location.city + ', ' + results.businesses[i].location.state,
          rating: results.businesses[i].rating,
          image: results.businesses[i].image_url,
        };
        bars.push(bar);
      }

      if (req.queryParams !== undefined && req.queryParams.name !== undefined) {
        let filteredBars = bars.filter(function (i) {
          return i.attributes.name.toLowerCase().indexOf(req.queryParams.name.toLowerCase()) !== -1;
        });
        res.send({ data: filteredBars });
      } else {
        res.send({ data: bars });
      }

    });
  }, err => {
    console.log(err);
  });

});

app.get('/api/bars:id', function(req, res) {
  res.send({ data: bars.find((bar) => req.params.id == bar.id) });
})

app.listen(3000, function () {
  console.log('Listening on port 3000');
});
