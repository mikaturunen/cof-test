const bunyan = require('bunyan')
const path = require('path')
const unirest = require('unirest')

const config = require('konfig')({ path: path.join(__dirname, '..', 'config') })
const log = bunyan.createLogger({ name: 'status' })

/**
 * Attempts to query trade status
 *
 * @param {Object} payload Request POST body
 * @param {Object} headers Complete unirest headers. Defaults to empty headers.
 * @returns {Promise}
 */
const queryStatus = (payload, headers) => {
  headers = headers ? headers : {}

  return new Promise((resolve, reject) => unirest
    .post(config.app.api_status.url)
    .strictSSL(config.app.api_status.strictSSL)
    .headers(headers)
    .send(payload)
    .end(result => {
      if (result.code !== 200) {
        return reject({ status: result.code, message: 'HTTP status not 200', raw: result.body })
      }

      if (result.body.trim() === 'error') {
        return reject({ status: 400, message: 'Error response', raw: result.body })
      }

      resolve(result.body)
    }))
}

module.exports = {
  queryStatus
}
