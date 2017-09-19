const path = require('path')
const config = require('konfig')({ path: path.join(__dirname, '..', 'config') })
const unirest = require('unirest')
const xml2js = require('xml2js')
const bunyan = require('bunyan')
const log = bunyan.createLogger({ name: 'refunds' })

/**
 * Makes a refund against the Checkout API.
 *
 * @param {Object} payload Request POST body
 * @param {Object} headers Complete unirest headers. Defaults to empty headers.
 * @returns {Promise} Resolves to refund reply. Rejects on refund error.
 */
const refund = (payload, headers)  => {
  headers = headers ? headers : {}

  log.info(`Calling refund.`)

  return new Promise((resolve, reject) => unirest
    .post(config.app.api_refund.url)
    .strictSSL(config.app.api_refund.strictSSL)
    .headers(headers)
    .send(payload)
    .end(result => {
      log.info('Received reply for refund:', result.body)
      return resolve(result.body)
      // First make sure we have handled the http error codes
      if (successCodes.indexOf(result.code) === -1) {
        // ERROR
        const message = 'Received http error'
        log.error(message)
        reject({ status: 502, message: message, raw: result.body })
      } else if (result.body === checkoutEmptyPostError) {
        // TODO handle the remaining  errors the payment wall can give inside a HTTP 200 OK-
        // HTTP status was okay but something was configured incorrectly or miscommunicated
        log.error('HTTP status was okay but something was configured incorrectly or miscommunicated:', result.code)
        reject({ status: 500, message: 'Misconfiguration', raw: result.body })
      } else {
        resolve(result.body)
      }
    }))
}

module.exports = {
  refund: refund
}
