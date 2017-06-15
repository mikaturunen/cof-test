const test = require('tape')
const payments = require('../../source/resources/payments')
const path = require('path')
const config = require('konfig')({ path: path.join(__dirname, '..', '..', 'source', 'config') })
const xmlParser = require('js2xmlparser')
const crypto = require('crypto')
const helper = require('./helper')

const items = {
  item: {
    description: '',
    price: {
      '@': {
        currency: 'EUR',
        vat: 24
      },
      '#': 2400
    },
    merchant: '391830'
  },
  amount: 2400
}

const jsonToXml = {
  request: {
    '@': {
      type: 'aggregator',
      test: 'false'
    },
    aggregator: config.app.merchant_id,
    version: '0002',
    token: '02343287-1e1a-4b92-8008-367e6ce35221',
    stamp: '1491913443',
    device: 10,
    content: 1,
    algorithm: 3,
    currency: 'EUR',
    commit: false,
    items: [
      items
    ],
    buyer: {
      country: 'FIN',
      language: 'FI'
    },
    delivery: {
      date: 20110303
    }
  },
  description: 'SiS tokenized payment test request : 11.04.2017 12:37:29'
}

const rawXml = xmlParser.parse('checkout', jsonToXml)

const xml = new Buffer(
    rawXml
  )
  .toString('base64')

const query = [
    xml,
    config.app.secret_key
  ]
  .join('+')

const mac = helper.generateHmac(query, 'md5', config.app.merchant_id)

test('Make a payment', test => {
  console.log('test raw xml:', rawXml)

  test.plan(1)
  test.timeoutAfter(1500)

  // Notice how loosely the return is handled. Assuming it's okay when we see the <trade> closing tag.
  payments
    .openPaymentWall({
      'CHECKOUT_XML': xml,
      'CHECKOUT_MAC': mac
    })
    .then(response => test.equal(response.indexOf('</trade>') != -1, true))
})
