const test = require('tape')
const refunds = require('../../source/resources/refunds')
const path = require('path')
const config = require('konfig')({ path: path.join(__dirname, '..', '..', 'source', 'config') })
const crypto = require('crypto')
const helper = require('./helper')
const xmlParser = require('js2xmlparser')


const jsonToXml = {
  identification: {
    merchant: config.app.merchant_id,
    // unique identifier for this refund message
    stamp: 11111112
  },
  message: {
    refund: {
      // unique identifier for the payment we are refunding
      stamp: 11111112,
      // reference for the payment we are refunding
      reference: 12344,
      // sum we are refunding, in cents
      amount: 1000,
      receiver: {
        email: 'email@osoi.te'
      }
    }
  }
}

const rawXml = xmlParser.parse('checkout', jsonToXml)
console.log("Raw xml =>\n", rawXml)

const base64Xml = new Buffer(
    rawXml
  )
  .toString('base64')

console.log('Base64 of the XML =>\n', base64Xml)

const key = config.app.secret_key
const mac = crypto.createHash('sha256', key)
  .update(base64Xml)
  .digest('hex')
  .toUpperCase()

console.log(`MAC from XML with "sha256" and secret "${key}" =>\n`, mac)

const body = {
  'data': base64Xml,
  'mac': mac
}

test('Make a refund', test => {
  console.log('test body:\n', body)

  test.plan(1)
  test.timeoutAfter(3500)

  // Notice how loosely the return is handled. Assuming it's okay when we see the <trade> closing tag.
  refunds
    .refund(body)
    .then(response => test.equal(response.indexOf('</trade>') != -1, true))
})
