const test = require('tape')
const payments = require('../../source/resources/payments')
const path = require('path')
const config = require('konfig')({ path: path.join(__dirname, '..', '..', 'source', 'config') })
const xmlParser = require('js2xmlparser')
const crypto = require('crypto')
const helper = require('./helper')
const unirest = require('unirest')

const basketStamp = new Date().getTime()
const firstItemStamp = basketStamp + 1
const secondItemStamp = basketStamp + 2
const thirdItemStamp = basketStamp + 3
const firstItemPrice = Math.floor(Math.random() * 200) + 100
const secondItemPrice = Math.floor(Math.random() * 200) + 100
const thirdItemPrice = Math.floor(Math.random() * 200) + 100
const sum = firstItemPrice + secondItemPrice + thirdItemPrice
const firstItemCode = Math.floor(Math.random() * 21000) + 1000
const secondItemCode = Math.floor(Math.random() * 100) + 1000
const thirdItemCode = Math.floor(Math.random() * 12313213) + 1000
const aggregator = config.app.merchant_id
const firstSubMerchant = 391830
const secondSubMerchant = 391830

const getRawXml = (basketStamp) => `<?xml version='1.0'?>
<checkout xmlns='http://checkout.fi/request'>
    <request type='aggregator' test='false'>
        <aggregator>${aggregator}</aggregator>
        <version>0002</version>
        <stamp>${basketStamp}</stamp>
        <reference>${basketStamp}</reference>
        <description>Test</description>
        <device>10</device>
        <content>1</content>
        <type>0</type>
        <algorithm>3</algorithm>
        <currency>EUR</currency>
        <commit>false</commit>
        <items>
            <item>
                <code>${firstItemCode}</code>
                <stamp>${firstItemStamp}</stamp>
                <description>Description 1</description>
                <price currency='EUR' vat='24'>${firstItemPrice}</price>
                <merchant>${firstSubMerchant}</merchant>
                <reference>${firstItemStamp}</reference>
            </item>
            <item>
                <code>321</code>
                <stamp>${secondItemStamp}</stamp>
                <description>Description 2</description>
                <price currency='EUR' vat='24'>${secondItemPrice}</price>
                <merchant>${secondSubMerchant}</merchant>
                <reference>${secondItemStamp}</reference>
            </item>
            <item>
                <code>${thirdItemCode}</code>
                <stamp>${thirdItemStamp}</stamp>
                <description>Description 3</description>
                <price currency='EUR' vat='24'>${thirdItemPrice}</price>
                <merchant>${secondSubMerchant}</merchant>
                <reference>${thirdItemStamp}</reference>
            </item>
            <amount currency='EUR'>${sum}</amount>
        </items>
        <buyer vatid=''>
            <country>FIN</country>
            <language>FI</language>
            <firstname> </firstname>
            <familyname> </familyname>
            <address> </address>
            <postalcode> </postalcode>
            <postaloffice> </postaloffice>
            <email> </email>
            <gsm> </gsm>
        </buyer>
        <delivery>
            <company vatid=''></company>
            <firstname> </firstname>
            <familyname> </familyname>
            <address> </address>
            <postalcode> </postalcode>
            <postaloffice> </postaloffice>
            <country> </country>
            <email> </email>
            <gsm> </gsm>
            <language> </language>
            <date>20170616</date>
        </delivery>
        <control type='default'>
            <return>http://google.com</return>
            <reject>http://google.com</reject>
            <cancel>http://google.com</cancel>
        </control>
    </request>
</checkout>`

// eg. https://payment.checkout.fi/p/38314471/66E6CFC7-D4FCDE50-CBD3C6EB-ADEB0225-E00BACD3-25AF1A6F-A6428A83-4ADC9B17
const paymentUrlPattern = new RegExp('^https://.*?/p/[0-9]+/[a-z0-9]{8}-[a-z0-9]{8}-[a-z0-9]{8}-[a-z0-9]{8}-[a-z0-9]{8}-[a-z0-9]{8}-[a-z0-9]{8}-[a-z0-9]{8}$', 'i')

const getHashPayload = (base64xml) => [
  base64xml,
  config.app.secret_key
]
.join('+')

const calculateMac = (algorithm, payload) =>
  crypto.createHash(algorithm)
    .update(getHashPayload(payload))
    .digest('hex')
    .toUpperCase()

const createSiSPayment = (algorithm) => {
  const rawXml = getRawXml(new Date().getTime())
  const payload = new Buffer(rawXml).toString('base64')
  const mac = calculateMac(algorithm, payload)

  console.log('test raw xml:', rawXml)

  // Notice how loosely the return is handled. Assuming it's okay when we see the <trade> closing tag.
  return payments
    .openPaymentWall({
      'CHECKOUT_XML': payload,
      'CHECKOUT_MAC': mac
    })
}

const sisTest = (algorithm) => (test) => {
  test.plan(1)
  test.timeoutAfter(1500)
  createSiSPayment(algorithm).then(response => test.equal(response.indexOf('</trade>') != -1, true))
}

test('Make a SiS payment (MD5)', sisTest('md5'))

test('Make a SiS payment (SHA-256)', sisTest('sha256'))

test('Verify payment URL (hosted SiS payment wall)', (test) => {
  test.plan(4)
  test.timeoutAfter(1500)
  createSiSPayment('sha256')
    .then((response) => {
      const matches = response.match(/<paymentURL>(.*?)<\/paymentURL>/)
      test.equal(matches.length, 2, 'Response XML contains payment URL')
      const url = matches[1]
      test.equal(paymentUrlPattern.test(url), true, 'Payment URL pattern')
      unirest
        .get(url)
        .strictSSL(config.app.api_payment.strictSSL)
        .end((result) => {
          test.equal(result.status, 200, 'Payment URL open HTTP status')
          test.ok(result.body.indexOf('orderWindow') > -1, 'Payment URL HTML contains business ID')
        })
    })
})
