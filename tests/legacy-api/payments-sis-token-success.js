const test = require('tape')
const payments = require('../../source/resources/payments')
const path = require('path')
const config = require('konfig')({ path: path.join(__dirname, '..', '..', 'source', 'config') })
const crypto = require('crypto')
const helper = require('./helper')

const rawXml = `<?xml version="1.0"?>
  <checkout xmlns="http://checkout.fi/request">
      <request type="aggregator" test="false">
          <aggregator>375917</aggregator>
          <token>02343287-1e1a-4b92-8008-367e6ce35221</token>
          <version>0002</version>
          <stamp>123456789</stamp>
          <reference>123456</reference>
          <device>10</device>
          <content>1</content>
          <type>0</type>
          <algorithm>3</algorithm>
          <currency>EUR</currency>
          <commit>false</commit>
          <description>SiS tokenized payment test request</description>
          <items>
              <item>
                  <code/>
                  <description>sub trade</description>
                  <price currency="EUR" vat="23">2500</price>
                  <merchant>391830</merchant>
                  <control/>
              </item>
              <amount currency="EUR">2500</amount>
          </items>
          <buyer>
              <country>FIN</country>
              <language>FI</language>
          </buyer>
          <delivery>
              <date>20170619</date>
          </delivery>
      </request>
  </checkout>`

const xml = new Buffer(
    rawXml
  )
  .toString('base64')

test('Make a token payment (MD5)', test => {
  const query = [
      xml,
      config.app.secret_key
    ]
    .join('+')

  const mac = crypto.createHash('md5')
    .update(query)
    .digest('hex')
    .toUpperCase()

  console.log('test raw xml:', rawXml)

  test.plan(1)
  test.timeoutAfter(1500)

  // Notice how loosely the return is handled. Assuming it's okay when we see the <trade> closing tag.
  payments
    .openPaymentWall({
      'CHECKOUT_XML': xml,
      'CHECKOUT_MAC': mac
    })
    // There are two cases that we consider a success for this now
    // 1. we managed to make auth hold
    // 2. or we got a response that someone already made the auth hold with this stamp
    .then(response => test.equal(
      response.indexOf('<statusCode>201</statusCode>') != -1 ||
      response.indexOf('<statusCode>409</statusCode>') != -1, 
      true
    ))
})

test('Make a token payment (SHA256-HMAC)', test => {
  const mac = crypto.createHmac('sha256', config.app.secret_key)
    .update(xml)
    .digest('hex')
    .toUpperCase()

  console.log('test raw xml:', rawXml)

  test.plan(1)
  test.timeoutAfter(1500)

  // Notice how loosely the return is handled. Assuming it's okay when we see the <trade> closing tag.
  payments
    .openPaymentWall({
      'CHECKOUT_XML': xml,
      'CHECKOUT_MAC': mac
    })
    // There are two cases that we consider a success for this now
    // 1. we managed to make auth hold
    // 2. or we got a response that someone already made the auth hold with this stamp
    .then(response => test.equal(
      response.indexOf('<statusCode>201</statusCode>') != -1 ||
      response.indexOf('<statusCode>409</statusCode>') != -1, 
      true
    ))
})
