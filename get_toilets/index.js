// index.js

const serverless = require('serverless-http');
const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 3001
const bodyParser = require('body-parser')

const AWS = require('aws-sdk')
AWS.config.update({region: 'ap-southeast-2'})

const ddb = new AWS.DynamoDB() 
const ddbGeo = require('dynamodb-geo')

const config = new ddbGeo.GeoDataManagerConfiguration(ddb, 'toilets-rated')
config.hashKeyLength = 5

const myGeoTableManager = new ddbGeo.GeoDataManager(config)

// Configure middleware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/', function (req, res) {
  if (!req.body.minlat || !req.body.minlng
    || !req.body.maxlat || !req.body.maxlng) return res.status(422).send('Missing parameters')

  console.log(`Called with ${req.body}`)

  myGeoTableManager.queryRectangle({
    MinPoint: {
      latitude: req.body.minlat,
      longitude: req.body.minlng
    },
    MaxPoint: {
      latitude: req.body.maxlat,
      longitude: req.body.maxlng
    }
  })
// Print the results, an array of DynamoDB.AttributeMaps
  .then((locations) => {
    console.log('Locations found: ', locations.length)
    res.send(locations)
  })  
})

// if running locally
if (!process.env.PORT) {
  app.listen(port, () => console.log(`DEV MODE: listening on ${port}`))
}

module.exports.handler = serverless(app)
