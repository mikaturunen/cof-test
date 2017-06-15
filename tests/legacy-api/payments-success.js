const test = require('tape')
const payments = require('../../source/resources/payments')
const path = require('path')
const config = require('konfig')({ path: path.join(__dirname, '..', '..', 'source', 'config') })
const crypto = require('crypto')
const xmlParser = require('js2xmlparser')
const helper = require('./helper')

const VERSION = '0001'
const STAMP = '11111111'
const AMOUNT = 1000
const REFERENCE = '12344'
const MERCHANT = config.app.merchant_id
const RETURN = 'http://demo1.checkout.fi/xml2.php?test=1'
const CANCEL = 'http://demo1.checkout.fi/xml2.php?test=2'
const REJECT = ''
const DELAYED = ''
const DELIVERY_DATE = '20170602'
const MESSAGE = ''
const LANGUAGE = 'FI'
const COUNTRY = 'FIN'
const CURRENCY = 'EUR'
const CONTENT = 1
const ALGORITHM = 3
const TYPE = 0
const DEVICE = 10
const FIRSTNAME = 'Keijo'
const FAMILYNAME = 'Romanof'
const ADDRESS = 'Katutie 12'
const POSTCODE = '00100'
const POSTOFFICE = 'Helsinki'
const EMAIL = 'keijo@couch.com'
const DESCRIPTION = ''

const jsonToXml = {
  request: {
    '@': {
      type: 'aggregator',
      test: 'false'
    },
    aggregator: config.app.merchant_id,
    version: '0002',
    token: 'feeba684-f35a-4c98-a846-14d0b1a02024',
    stamp: '1491913443',
    device: 10,
    content: 1,
    algorithm: 3,
    currency: 'EUR',
    commit: false,
    items: [{
      description: '',
      price: {
        '@': {
          currency: 'EUR',
          vat: 24
        },
        '#': 2400
      },
      merchant: '391830'
    }],
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

const xml = new Buffer(
    xmlParser.parse('checkout', jsonToXml)
  )
  .toString('base64')

const query = [
    xml,
    config.app.secret_key
  ]
  .join('+')

const MAC = crypto.createHash('md5', config.app.secret_key)
  .update(query)
  .digest('hex')
  .toUpperCase()

const requiredParameters = [
  { key: 'VERSION', value: VERSION },
  { key: 'STAMP', value: STAMP },
  { key: 'AMOUNT', value: AMOUNT },
  { key: 'REFERENCE', value: REFERENCE },
  { key: 'MESSAGE', value: MESSAGE },

  { key: 'LANGUAGE', value: LANGUAGE },
  { key: 'MERCHANT', value: MERCHANT },
  { key: 'RETURN', value: RETURN },
  { key: 'CANCEL', value: CANCEL },
  { key: 'REJECT', value: REJECT },

  { key: 'DELAYED', value: DELAYED },
  { key: 'COUNTRY', value: COUNTRY },
  { key: 'CURRENCY', value: CURRENCY },
  { key: 'DEVICE', value: DEVICE },
  { key: 'CONTENT', value: CONTENT },

  { key: 'TYPE', value: TYPE },
  { key: 'ALGORITHM', value: ALGORITHM },
  { key: 'DELIVERY_DATE', value: DELIVERY_DATE }, //Ymd php date.
  { key: 'FIRSTNAME', value: FIRSTNAME },

  { key: 'FAMILYNAME', value: FAMILYNAME },
  { key: 'ADDRESS', value: ADDRESS },
  { key: 'POSTCODE', value: POSTCODE },
  { key: 'POSTOFFICE', value: POSTOFFICE },
  { key: 'SECRET_KEY', value: config.app.secret_key }
]

let parameters = helper.getNumberOfParameters(requiredParameters, 24)
let values = Object.keys(parameters).map(key => parameters[key]).join('+')
let properties = Object.keys(parameters).map(key => key).join('+')

const calculatedMac = helper.generateHmac(values, 'md5', config.app.secret_key)

parameters.MAC = calculatedMac

test('Make a payment', test => {
  console.log('properties', properties)
  console.log('values:', values)
  console.log('hmac:', calculatedMac)

  test.plan(1)
  test.timeoutAfter(1500)

  // Notice how loosely the return is handled. Assuming it's okay when we see the <trade> closing tag.

  payments
    .openPaymentWall(parameters)
    .then(response => test.equal(response.indexOf('</trade>') != -1, true))
})
