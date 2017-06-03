const path = require('path')
const config = require('konfig')({ path: path.join(__dirname, '..', 'config') })
const unirest = require('unirest')

const bunyan = require('bunyan')
const log = bunyan.createLogger({ name: "payments" })

const successCodes = [ 200 ]
const checkoutError = [ 200 ]

const checkoutEmptyPostError = 'Yhtään tietoa ei siirtynyt POST:lla checkoutille'

const validatePaymentWall = (result, response) => {
  
}

const openPaymentWall = (payload, headers) => {
  headers = headers ? headers : {}
  
  log.info(`Opening payment wall.`)
  
  return new Promise((resolve, reject) => unirest
    .post(config.app.api_payment)
    .headers(headers)
    .send(payload)
    .end(result => {
      log.info('Received reply:', result.body)

      // First make sure we have handled the http error codes
      if (successCodes.indexOf(result.code) === -1) {
        // ERROR
        const message = 'Received http error'
        log.error(message)
        reject({ status: 502, message: message, raw: result.body })
      } else if (result.body === checkoutEmptyPostError) {
        // HTTP status was okay but something was configured incorrectly or miscommunicated
        log.error('HTTP status was okay but something was configured incorrectly or miscommunicated:', result.code)
        reject({ status: 500, message: 'Misconfiguration', raw: result.body })
      } else {
        resolve(result.body)
      }
    }))
}

module.exports = {
  openPaymentWall
}