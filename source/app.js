const path = require('path')
const config = require('konfig')({ path: path.join(__dirname, 'config') })
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const unirest = require('unirest')
const R = require('ramda')
const crypto = require('crypto')

const payments = require('./resources/payments')


app.use(bodyParser.json())

app.get('/', (request, response) => {
  payments.openPaymentWall({
    
  })
  .then(result => response.json(result))
  .catch(error => response.status(error.status).json(error.message))
})

app.listen(config.app.port, _ => console.log(`Merchant test shop runnig on port ${config.app.port}.`))
