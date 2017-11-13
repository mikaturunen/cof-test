const crypto = require('crypto')
const path = require('path')
const test = require('tape')

const config = require('konfig')({ path: path.join(__dirname, '..', '..', 'source', 'config') })
const payments = require('../../source/resources/payments')
const status = require('../../source/resources/status')

const payment = {
  VERSION:       '0001',
  STAMP:         new Date().getTime(),
  AMOUNT:        1000,
  REFERENCE:     '123453',
  MESSAGE:       '',
  LANGUAGE:      'FI',
  MERCHANT:      config.app.merchant_id,
  RETURN:        'http://demo1.checkout.fi/',
  CANCEL:        'http://demo1.checkout.fi/',
  REJECT:        '',
  DELAYED:       '',
  COUNTRY:       'FIN',
  CURRENCY:      'EUR',
  DEVICE:        10,
  CONTENT:       1,
  TYPE:          0,
  ALGORITHM:     3,
  DELIVERY_DATE: '20170919',
  FIRSTNAME:     'Keijo',
  FAMILYNAME:    'Romanof',
  ADDRESS:       'Katutie 12',
  POSTCODE:      '00100',
  POSTOFFICE:    'Helsinki'
}

const statusAlgorihm = {
  'md5': 1,
  'sha256': 3,
  'sha256-hmac': 4
}

const hashPayload = Object.keys(payment).map((key) => payment[key]).join('+')

const calculateMac = (algorithm, payload, secret) =>
  (algorithm === 'sha256-hmac' ? crypto.createHmac('sha256', secret) : crypto.createHash(algorithm))
    .update(payload)
    .digest('hex')
    .toUpperCase()

payment.MAC = calculateMac('sha256-hmac', hashPayload, config.app.secret_key)

const statusTest = (algorithm) => (test) => {
  test.plan(2)

  // Since the payment creation info is fixed, the same payment is returned on
  // subsequent runs of this test. This is intentional as this tests status query
  payments
    .openPaymentWall(payment)
    .then(response => {
      test.equal(response.indexOf('</trade>') != -1, true, 'Trade created succesfully')

      const statusQuery = {
        VERSION:    payment.VERSION,
        STAMP:      payment.STAMP,
        REFERENCE:  payment.REFERENCE,
        MERCHANT:   payment.MERCHANT,
        AMOUNT:     payment.AMOUNT,
        CURRENCY:   payment.CURRENCY,
        FORMAT:     1,
        ALGORITHM:  statusAlgorihm[algorithm],
        SECRET_KEY: config.app.secret_key
      }

      if (algorithm === 'sha256-hmac') {
        delete statusQuery.SECRET_KEY;
      }

      const statusHashPayload = Object.keys(statusQuery).map((key) => statusQuery[key]).join('+')

      statusQuery.MAC = calculateMac(algorithm, statusHashPayload, config.app.secret_key);

      status
        .queryStatus(statusQuery)
        .then((response) => {
          console.log(response)
          test.equal(response.indexOf('</status>') != -1, true, 'Status returned')
        })
    })
}

test('Status query (MD5)', statusTest('md5'))

test('Status query (SHA256)', statusTest('sha256'))

test('Status query (SHA256-HMAC)', statusTest('sha256-hmac'))
