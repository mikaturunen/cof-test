const test = require('tape')
const payments = require('../../source/resources/payments')
const path = require('path')
const config = require('konfig')({ path: path.join(__dirname, '..', '..', 'source', 'config') })
const xmlParser = require('js2xmlparser')
const crypto = require('crypto')
const helper = require('./helper')

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

const rawXml = `<?xml version='1.0'?>
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
