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

function sns_alert(name) {
  var params = {
    Message: 'Code brown! New toilet created at ' + name, /* required */
    PhoneNumber: '+61466979566',
  };
  
  // Create promise and SNS service object
  var publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();
  
  // Handle promise's fulfilled/rejected states
  publishTextPromise.then(
    function(data) {
      console.log("Message ${params.Message} send sent to the topic ${params.TopicArn}");
      console.log("MessageID is " + data.MessageId);
    }).catch(
      function(err) {
      console.error(err, err.stack);
    });
}

// Configure middleware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/', function (req, res) {
  if (!req.body.lat || !req.body.lng
    || !req.body.name || !req.body.address) return res.status(422).send('Missing parameters')

  console.log(`Called with ${req.body}`)

  sns_alert(req.body.name)
  myGeoTableManager.putPoint({
    RangeKeyValue: { S: uuid.v4() }, // Use this to ensure uniqueness of the hash/range pairs.
    GeoPoint: {
        latitude: req.body.lat,
        longitude: req.body.lng
    },
    PutItemInput: {
        Item: {
          name: { S: req.body.name }, // Specify attribute values using { type: value } objects, like the DynamoDB API.
          address: { S: req.body.address }
        }
    }
  }).promise()
  .then((locations) => {
    console.log('Location added: ', req.body.name)
    sns_alert() 
       
    res.sendStatus(200)
  })
})

// if running locally
if (!process.env.PORT) {
  app.listen(port, () => console.log(`DEV MODE: listening on ${port}`))
}

module.exports.handler = serverless(app)
