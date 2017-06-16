const test = require('tape')
const payments = require('../../source/resources/payments')
const path = require('path')
const config = require('konfig')({ path: path.join(__dirname, '..', '..', 'source', 'config') })
const xmlParser = require('js2xmlparser')
const crypto = require('crypto')
const helper = require('./helper')

const items = {
  item: {
    code: '123',
    stamp: '1234444444',
    description: '',
    price: {
      '@': {
        currency: 'EUR',
        vat: 24
      },
      '#': 2400
    },
    merchant: '391830',
    reference: '11113333'
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
    stamp: '1491913443',
    reference: '12344',
    description: 'Hi, my name is description',
    device: 10,
    content: 1,
    type: 0,
    algorithm: 3,
    currency: 'EUR',
    commit: false,
    items: [
      items
    ],
    buyer: {
      '@': {
        vatid: ''
      },
      country: 'FIN',
      language: 'FI',
      firstname: '',
      familyname: '',
      address: '',
      postalcode: '',
      postaloffice: '',
      email: '',
      gsm: ''
    },
    delivery: {
      company: {
        '@': {
          vatid: ''
        }
      },
      firstname: '',
      familyname: '',
      address: '',
      postalcode: '',
      postaloffice: '',
      country: '',
      email: '',
      gsm: '',
      language: '',
      date: 20171212
    },
    control: {
      '@': {
        type: 'default'
      },
      return: 'http://localhost:8080/thankyou',
      reject: 'http://localhost:8080/thankyou',
      cancel: 'http://localhost:8080/thankyou'
    }
  }
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

const mac = crypto.createHash('md5')
  .update(query)
  .digest('hex')
  .toUpperCase()

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
