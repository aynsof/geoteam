'use strict'

// Run 'node query' to see how many Starbucks are within 1km (0.6 miles) of a location in NYC.

const AWS = require('aws-sdk')
AWS.config.update({region: 'ap-southeast-2'})
var credentials = new AWS.SharedIniFileCredentials({profile: 'geoteam'});
AWS.config.credentials = credentials;

const ddb = new AWS.DynamoDB() 
const ddbGeo = require('dynamodb-geo')

const config = new ddbGeo.GeoDataManagerConfiguration(ddb, 'toilets')
config.hashKeyLength = 5

const myGeoTableManager = new ddbGeo.GeoDataManager(config)

myGeoTableManager.queryRadius({
  RadiusInMeter: 10000,
  CenterPoint: {
      latitude: -31.97215644,
      longitude: 116.06489503
  }
})
.then((locations) => {
  console.log('Locations found: ', locations.length)
  console.log(locations)
})

var minlat = -43
var minlng = 113
var maxlat = -33
var maxlng = 115

myGeoTableManager.queryRectangle({
  MinPoint: {
      latitude: minlat,
      longitude: minlng
  },
  MaxPoint: {
      latitude: maxlat,
      longitude: maxlng
  }
})
.then((locations) => {
  console.log('Locations found: ', locations.length)
  console.log(locations)
})