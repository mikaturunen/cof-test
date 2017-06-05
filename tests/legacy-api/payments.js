const test = require('tape')
const payments = require('../source/resources/payments')
const path = require('path')
const config = require('konfig')({ path: path.join(__dirname, '..', 'source', 'config') })
const crypto = require('crypto')
const xmlParser = require("js2xmlparser");


// I'm lazy, write all the defaults into some sort of constants for now
/*
const VERSION = '0001'
const STAMP = new Date().getTime()
const AMOUNT = 1000
const REFERENCE = '12344'
const MESSAGE = ''
const LANGUAGE = ''
const MERCHANT = config.app.merchant_id
const RETURN = 'http://demo1.checkout.fi/xml2.php?test=1'
const CANCEL = 'http://demo1.checkout.fi/xml2.php?test=2'
const REJECT = ''
const DELAYED = ''
const COUNTRY = 'FIN'
const CURRENCY = 'EUR'
const DEVICE = 10
const CONTENT = 1
const TYPE = 0
const ALGORITHM = 3
const DELIVERY_DATE = '20170602'
const FIRSTNAME = 'Keijo'
const FAMILYNAME = 'Romanof'
const ADDRESS = 'Katutie 12'
const POSTCODE = '00100'
const POSTOFFICE = 'Helsinki'
const EMAIL = 'keijo@couch.com'
const DESCRIPTION = ''
*/

const VERSION = '0001'
const STAMP = new Date().getTime()
const AMOUNT = 1000
const REFERENCE = '12344'
const MESSAGE = ''
const LANGUAGE = ''
const MERCHANT = config.app.merchant_id
const RETURN = 'http://demo1.checkout.fi/xml2.php?test=1'
const CANCEL = 'http://demo1.checkout.fi/xml2.php?test=2'
const REJECT = ''
const DELAYED = ''
const COUNTRY = 'FIN'
const CURRENCY = 'EUR'
const DEVICE = 10
const CONTENT = 1
const TYPE = 0
const ALGORITHM = 3
const DELIVERY_DATE = '20170602'
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
    aggregator: '375917',
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

console.log(xml)

// TODO calculate hmac to be ready
const query = [
    xml,
    config.app.secret_key
  ]
  .join('+')

const MAC = crypto.createHash('md5')
  .update(query)
  .digest('hex')
  .toUpperCase()

console.log(`query is: ${query} and MAC: ${MAC}.`)

// First test is to fetch completely empty payment wall with no POST content
test('Validate reply from empty POST to payment wall (error case)', test => {
  test.plan(3)
  test.timeoutAfter(1500)

  const request = {}
  const expectedMessage = "Misconfiguration"
  const expectedOutgoingHttpStatus = 500
  const expectedIntegrationReply = 'Yhtään tietoa ei siirtynyt POST:lla checkoutille'

  payments
    .openPaymentWall(request)
    .catch(error => {
      test.equal(error.status, expectedOutgoingHttpStatus, 'Status code is 500')
      test.equal(error.message, expectedMessage, 'Misconfigured')
      test.equal(error.raw, expectedIntegrationReply, 'Checkout reply verified')
    })
})

/**
 * Creates a super simple payment api validator that just sends the given request object
 * to the payment api, attempts to create a payment and checks the reply with expected.
 *
 * @param {string} name  Name for the test
 * @param {Object} request Payment api POST body payload
 * @param {string} expected What we are expecting to receive from the payment api.
 */
const successPathTestCreator = (name, request, expected) => {
  test(name, test => {
    test.plan(1)
    test.timeoutAfter(1500)

    payments
      .openPaymentWall(request)
      .then(response => test.equal(response, expected))
  })
}

// this is the order they are validated in the backend based on pure blackbox tests
// note that this order differs from the order they are defined in the document and used in hmac calculation -> https://checkoutfinland.github.io/#payment
// for example version is first id wise and merchant seventh
const requiredParameters = [
  { key: 'MERCHANT', value: MERCHANT },
  { key: 'VERSION', value: VERSION },
  { key: 'STAMP', value: STAMP },
  { key: 'AMOUNT', value: AMOUNT },
  { key: 'REFERENCE', value: REFERENCE },
  { key: 'RETURN', value: RETURN },
  { key: 'CANCEL', value: CANCEL },
  { key: 'CURRENCY', value: CURRENCY },
  { key: 'DEVICE', value: DEVICE },
  { key: 'CONTENT', value: CONTENT },
  { key: 'TYPE', value: TYPE },
  { key: 'ALGORITHM', value: ALGORITHM },
  { key: 'DELIVERY_DATE', value: DELIVERY_DATE }, //Ymd php date.. jesus
  { key: 'MAC', value: MAC },
  { key: 'FIRSTNAME', value: FIRSTNAME },
  { key: 'FAMILYNAME', value: FAMILYNAME },
  { key: 'ADDRESS', value: ADDRESS },
  { key: 'POSTCODE', value: POSTCODE },
  { key: 'POSTOFFICE', value: POSTOFFICE },
  { key: 'EMAIL', value: EMAIL }
]

// Gets number of parameters to POST to the payment api
const getNumberOfParameters = count => {
  let collectionOfParametersToSend = {}

  for (let i=0; i<count; i++) {
    collectionOfParametersToSend[requiredParameters[i].key] = requiredParameters[i].value
  }

  return collectionOfParametersToSend
}

// 1. test name
// 2. POST body to send
// 3. what to validate from the reply. The payment wall has silly success replies so..
successPathTestCreator(
  `Validate reply from POST to payment wall with 1 required parameter (MERCHANT)`,
  getNumberOfParameters(1),
  `<p>Maksutapahtuman luonti ei onnistunut (-1).</p><p>Error in field/Virhekentässä: VERSION</p><p><a href=''>Palaa takaisin verkkokauppaan</a></p>`
)

successPathTestCreator(
  `Validate reply from POST to payment wall with 1 required parameter (VERSION)`,
  {
    VERSION: '0001'
  },
  `<p>Maksutapahtuman luonti ei onnistunut (-7).</p><p>Error in field/Virhekentässä: MERCHANT</p><p><a href=''>Palaa takaisin verkkokauppaan</a></p>`
)

successPathTestCreator(
  `Validate reply from POST to payment wall with 1 required parameter (VERSION incorrect)`,
  {
    VERSION: '12312312'
  },
  `<p>Maksutapahtuman luonti ei onnistunut (-1).</p><p>Error in field/Virhekentässä: VERSION</p><p><a href=''>Palaa takaisin verkkokauppaan</a></p>`
)

successPathTestCreator(
  `Validate reply from POST to payment wall with 2 required parameters`,
  getNumberOfParameters(2),
  `Maksutapahtuman luonti ei onnistunut (1).`
)

successPathTestCreator(
  `Validate reply from POST to payment wall with 3 required parameters`,
  getNumberOfParameters(3),
  `<p>Maksutapahtuman luonti ei onnistunut (-3).</p><p>Error in field/Virhekentässä: AMOUNT (minimiostos 1,00e)</p><p><a href=\'\'>Palaa takaisin verkkokauppaan</a></p>`
)

successPathTestCreator(
  `Validate reply from POST to payment wall with broken amounts`,
  {
    MERCHANT: '375917' ,
    VERSION: '0001',
    STAMP: new Date().getTime(),
    VALUE: 10
  },
  `<p>Maksutapahtuman luonti ei onnistunut (-3).</p><p>Error in field/Virhekentässä: AMOUNT (minimiostos 1,00e)</p><p><a href=\'\'>Palaa takaisin verkkokauppaan</a></p>`
)

successPathTestCreator(
  `Validate reply from POST to payment wall with 4 required parameters`,
  getNumberOfParameters(4),
  `<p>Maksutapahtuman luonti ei onnistunut (-4).</p><p>Error in field/Virhekentässä: REFERENCE</p><p><a href=\'\'>Palaa takaisin verkkokauppaan</a></p>`
)

successPathTestCreator(
  `Validate reply from POST to payment wall with 5 required parameters`,
  getNumberOfParameters(5),
  `<p>Maksutapahtuman luonti ei onnistunut (-8).</p><p>Error in field/Virhekentässä: RETURN</p><p><a href=\'\'>Palaa takaisin verkkokauppaan</a></p>`
)

successPathTestCreator(
  `Validate reply from POST to payment wall with 6 required parameters`,
  getNumberOfParameters(6),
  `<p>Maksutapahtuman luonti ei onnistunut (-9).</p><p>Error in field/Virhekentässä: CANCEL</p><p><a href=\'\'>Palaa takaisin verkkokauppaan</a></p>`
)

successPathTestCreator(
  `Validate reply from POST to payment wall with 7 required parameters`,
  getNumberOfParameters(7),
  `<p>Maksutapahtuman luonti ei onnistunut (-13).</p><p>Error in field/Virhekentässä: CURRENCY</p><p><a href=\'http//demo1.checkout.fi/xml2.php?test=2\'>Palaa takaisin verkkokauppaan</a></p>`
)

successPathTestCreator(
  `Validate reply from POST to payment wall with 8 required parameters`,
  getNumberOfParameters(8),
  `<p>Maksutapahtuman luonti ei onnistunut (-14).</p><p>Error in field/Virhekentässä: DEVICE</p><p><a href=\'http//demo1.checkout.fi/xml2.php?test=2\'>Palaa takaisin verkkokauppaan</a></p>`
)

successPathTestCreator(
  `Validate reply from POST to payment wall with 9 required parameters`,
  getNumberOfParameters(9),
  `<p>Maksutapahtuman luonti ei onnistunut (-15).</p><p>Error in field/Virhekentässä: CONTENT</p><p><a href=\'http//demo1.checkout.fi/xml2.php?test=2\'>Palaa takaisin verkkokauppaan</a></p>`
)

successPathTestCreator(
  `Validate reply from POST to payment wall with 10 required parameters`,
  getNumberOfParameters(10),
  `<p>Maksutapahtuman luonti ei onnistunut (-16).</p><p>Error in field/Virhekentässä: TYPE</p><p><a href=\'http//demo1.checkout.fi/xml2.php?test=2\'>Palaa takaisin verkkokauppaan</a></p>`
)

successPathTestCreator(
  `Validate reply from POST to payment wall with 11 required parameters`,
  getNumberOfParameters(11),
  `<p>Maksutapahtuman luonti ei onnistunut (-17).</p><p>Error in field/Virhekentässä: ALGORITHM</p><p><a href=\'http//demo1.checkout.fi/xml2.php?test=2\'>Palaa takaisin verkkokauppaan</a></p>`
)

successPathTestCreator(
  `Validate reply from POST to payment wall with 12 required parameters`,
  getNumberOfParameters(12),
  `<p>Maksutapahtuman luonti ei onnistunut (-18).</p><p>Error in field/Virhekentässä: DELIVERY_DATE</p><p><a href=\'http//demo1.checkout.fi/xml2.php?test=2\'>Palaa takaisin verkkokauppaan</a></p>`
)

successPathTestCreator(
  `Validate reply from POST to payment wall with 13 required parameters`,
  getNumberOfParameters(13),
  `<p>Maksutapahtuman luonti ei onnistunut (-24).</p><p>Error in field/Virhekentässä: MAC</p><p><a href=\'http//demo1.checkout.fi/xml2.php?test=2\'>Palaa takaisin verkkokauppaan</a></p>`
)


test("Paska", test => {
  test.plan(1)
  test.timeoutAfter(5000)

  payments
    .openPaymentWall({
      'CHECKOUT_XML': xml,
      'CHECKOUT_MAC': MAC
    })
    .then(response => test.equal(response, "paska"))
})
