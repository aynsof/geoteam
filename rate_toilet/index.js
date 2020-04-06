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
const uuid = require('uuid')

// Configure middleware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/', function (req, res) {
  if (!req.body.lat || !req.body.lng
    || !req.body.rating) return res.status(422).send('Missing parameters')

  console.log(`Called with ${req.body}`)

  myGeoTableManager.updatePoint({
    RangeKeyValue: { S: req.body.rangekey },
    GeoPoint: { // An object specifying latitutde and longitude as plain numbers.
        latitude: req.body.lat,
        longitude: req.body.lng
    },
    UpdateItemInput: { // TableName and Key are filled in for you
        UpdateExpression: 'SET rating = :rating',
        ExpressionAttributeValues: {
            ':rating': { N: req.body.rating}
        }
    }
  }).promise()
// Print the results, an array of DynamoDB.AttributeMaps
  .then((locations) => {
    console.log('Updated location')
    res.sendStatus(200)
  })  
})

// if running locally
if (!process.env.PORT) {
  app.listen(port, () => console.log(`DEV MODE: listening on ${port}`))
}

module.exports.handler = serverless(app)
