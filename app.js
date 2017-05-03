var express = require('express');
var request = require('request');

try {
  var config = require('./config'); // Local config file not included in git
}
catch (err) {
  var config = 'foo';// PROCESS.ENV for Heroku eventually
}

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

app.get('/', function (req, res) {

  console.log('getting local info');
  request.post("https://api.yelp.com/oauth2/token", {form: {
    grant_type: 'client_credentials',
    client_id: config.YELP_CLIENT_ID,
    client_secret: config.YELP_CLIENT_SECRET
    }}, function(err, httpResponse, body) {
      console.log(body);
  })

  res.send('Hello World!');
});

app.get('/api', function (req, res) {
  res.send('You have accessed the API route');
});

app.get('/api/bars', function (req, res) {
  if (req.queryParams !== undefined && req.queryParams.name !== undefined) {
    let filteredBars = bars.filter(function (i) {
      return i.attributes.name.toLowerCase().indexOf(req.queryParams.name.toLowerCase()) !== -1;
    });
    res.send({ data: filteredBars });
  } else {
    res.send({ data: bars });
  }
});

app.get('/api/bars:id', function(req, res) {
  res.send({ data: bars.find((bar) => req.params.id == bar.id) });
})

app.listen(3000, function () {
  console.log('Listening on port 3000');
});
