const USERNAME = 'RESELLER_USERNAME'
const PASSWORD = 'RESELLER_PASSWORD'
const URL = 'RESELLER_URL'
if (process.env[USERNAME] === undefined || process.env[PASSWORD] === undefined || process.env[URL] === undefined) {
    console.log('Missing one or more env variables: ', [USERNAME, PASSWORD, URL])
    console.log('Skipping reseller create merchant test.')
    process.exit(0)
}

const test = require('tape')
const unirest = require('unirest')

const url = process.env[URL]
const username = process.env[USERNAME]
const password = process.env[PASSWORD]

/**
 * Attempts to do the basic-auth based createMerchant call.
 * 
 * @param {Object} test Test harness from Tape.
 */
const resellerCreateMerchantTest = (test) => {
   const body = {
       company: 'Dummy Shop Ltd',
       'vat_id': '123456-3',
       name: 'Mad Mikes discount stuff',
       email: 'email@address.com',
       gsm: '1234567890',
       address: 'Random dummy address street 123',
       url: 'http://google.com',
       // shop-in-shop vendor = 5, shop-in-shop marketplace = 4
       type: '4', 
       info: 'General information about the Merchant',
       // 0, 25 or 45, this value is the merchants monthly payment in €, if using a custom pricing use pricing code (that checkout
       //  finland will create), if creating marketplace use 0
       kkhinta:  '25' 
   }

   test.plan(1)
   test.timeoutAfter(5000)

   unirest
    .post(url)
    .send(body)
    .headers({ 
        'Content-Type': `application/x-www-form-urlencoded`, 
        'Authorization': `Basic ${new Buffer(username + ':' + password).toString('base64')}`
    })
    // NOTE assume it's a success when we can find .png from the reply as it's the banner url
    .end(result => {
        if (result.code === 200) {
            console.log('Reply from the reseller merchant creation:')
            console.log(result.body)
            test.equal(result.body.indexOf('.png') != -1, true)
        } else {
            console.log('http response', result.code)
            test.equal(true, false)
        }
    })
}

test('Reseller createMerchant', test => resellerCreateMerchantTest(test))
