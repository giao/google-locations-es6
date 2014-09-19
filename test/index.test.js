var GoogleLocations = require('../lib/google-locations'),
    vows = require('vows'),
    fakeweb = require('node-fakeweb'),
    assert = require('assert');

fakeweb.allowNetConnect = false;

// fake the search - basic example
fakeweb.registerUri({
  uri: 'https://maps.googleapis.com/maps/api/place/search/json?location=37.4229181%2C-122.0854212&radius=10&language=en&rankby=prominence&key=fake_key',
  body: '{"results" : [{"name": "Google", "place_id":"ABC123"}], "status" : "OK"}'
});
// fake the search -- by address example
fakeweb.registerUri({
  uri: 'https://maps.googleapis.com/maps/api/place/search/json?location=37.4229181%2C-122.0854212&rankby=distance&radius=&language=en&key=fake_key',
  body: '{"results" : [{"name": "Google", "place_id":"ABC123"}], "status" : "OK"}'
});
// fake the autocomplete
fakeweb.registerUri({
  uri: 'https://maps.googleapis.com/maps/api/place/autocomplete/json?language=en&key=fake_key',
  body: '{"predictions" : [{"description": "Google", "id":"1"}, {"description": "Goodfellas Bar & Grill", "id":"2"}, {"description": "Goose Farm", "id": "3"}], "status" : "OK"}'
});
//fake the details
fakeweb.registerUri({
  uri: 'https://maps.googleapis.com/maps/api/place/details/json?placeid=ABC123&language=en&key=fake_key',
  body: '{"result" : {"name": "Google", "rating": 2.5}, "status" : "OK"}'
});
//fake the geocoding
fakeweb.registerUri({
  uri: 'https://maps.googleapis.com/maps/api/geocode/json?address=1600%2BAmphitheatre%2BPkwy%2C%2BMountain%2BView%2C%2BCA&language=en&key=fake_key',
  body: '{"results" : [{"address_components" : [], "formatted_address" : "1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA", "geometry" : {"location" : {"lat" : 37.42291810, "lng" : -122.08542120}}}], "status" : "OK"}'
});
//fake the reverse geocoding
fakeweb.registerUri({
  uri: 'https://maps.googleapis.com/maps/api/geocode/json?latlng=40.714224%2C-73.961452&language=en&key=fake_key',
  body: '{"results" : [{"address_components" : [], "formatted_address" : "277 Bedford Avenue, Brooklyn, NY 11211, USA", "geometry" : {"location" : { "lat" : 40.714232, "lng" : -73.9612889}}}], "status": "OK"}'
});

vows.describe('URL Generation').addBatch({
  'default url': {
    topic: new GoogleLocations('fake_key'),

    'should have a default url for place search': function(topic) {
      assert.equal(topic._generateUrl({}, 'place', 'search').href, 'https://maps.googleapis.com/maps/api/place/search/json?key=fake_key');
    },

    'should have a default url for place autocomplete': function(topic) {
      assert.equal(topic._generateUrl({}, 'place', 'autocomplete').href, 'https://maps.googleapis.com/maps/api/place/autocomplete/json?key=fake_key');
    },

    'should have a default url for geocode address lookup': function(topic) {
      assert.equal(topic._generateUrl({}, 'geocode', null).href, 'https://maps.googleapis.com/maps/api/geocode/json?key=fake_key');
    },

    'should have my key as a query param': function(topic) {
      assert.equal(topic._generateUrl({key: 'fake_key'}, 'search').query, 'key=fake_key');
    }
  }
}).export(module);

vows.describe('Places Search').addBatch({
  'new search': {
    topic: function() {
      new GoogleLocations('fake_key').search({}, this.callback);
    },

    'should not have an error': function(err, response){
      assert.isNull(err);
    },
    
    'should be status OK': function(err, response){
      assert.equal(response.status, 'OK');
    },

    'should include location description': function(err, response){
      assert.equal(response.results[0].name, 'Google');
    }
  }
}).export(module);

vows.describe('Places Autocomplete').addBatch({
  'new autocomplete': {
    topic: function() {
      new GoogleLocations('fake_key').autocomplete({}, this.callback);
    },

    'should not have an error': function(err, response){
      assert.isNull(err);
    },
    
    'should be status OK': function(err, response){
      // console.log(response); process.exit();
      assert.equal(response.status, 'OK');
    },

    'should include description for predictions': function(err, response){
      assert.equal(response.predictions[0].description, 'Google');
    }
  }
}).export(module);

vows.describe('Place Details').addBatch({
  'new search': {
    topic: function() {
      new GoogleLocations('fake_key').details({placeid: 'ABC123'}, this.callback);
    },
    'should get details': function(err, response){
      assert.equal(response.result.rating, 2.5);
    }
  }
}).export(module);

vows.describe('Geocode Address').addBatch({
  'new address lookup': {
    topic: function() {
      new GoogleLocations('fake_key').geocodeAddress({address: '1600 Amphitheatre Pkwy, Mountain View, CA'}, this.callback);
    },
    'should get latitude': function(err, response){
      assert.equal(response.results[0].geometry.location.lat, 37.42291810);
    },
    'should get longitude': function(err, response){
      assert.equal(response.results[0].geometry.location.lng, -122.08542120);
    },
    'should get formatted address': function(err, response){
      assert.equal(response.results[0].formatted_address, '1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA');
    }
  }
}).export(module);

vows.describe('Reverse Geocode').addBatch({
  'new geocode lookup': {
    topic: function() {
      new GoogleLocations('fake_key').reverseGeocode({latlng: [40.714224, -73.961452]}, this.callback);
    },
    'should get latitude': function(err, response){
      assert.equal(response.results[0].geometry.location.lat, 40.714232);
    },
    'should get longitude': function(err, response){
      assert.equal(response.results[0].geometry.location.lng, -73.9612889);
    },
    'should get formatted address': function(err, response){
      assert.equal(response.results[0].formatted_address, '277 Bedford Avenue, Brooklyn, NY 11211, USA');
    }
  }
}).export(module);

vows.describe('Place Details via Address Query').addBatch({
  'get details from address/name query': {
    topic: function(){
      new GoogleLocations('fake_key').findPlaceDetailsWithAddress({address: '1600 Amphitheatre Pkwy, Mountain View, CA', name: 'Google'}, this.callback);
    },
    'should get a location': function(err, response){
      assert.equal(response.result.name, 'Google');
    }
  }
}).export(module);
