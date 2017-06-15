const crypto = require('crypto')
const payments = require('../../source/resources/payments')

module.exports = {
  /**
   * Gets number of parameters from the required parameters list for the HTTP POST body
   *
   * @param {Object} requiredParameters { key: string, value: any } object pairs that will be used to turn into HTTP body
   * @param {number} count How many parameters to iterate from the Object
   * @returns {Object} Returns object with uppercased property names for payment API of checkout
   */
  getNumberOfParameters: (requiredParameters, count) => {
    let collectionOfParametersToSend = {}

    for (let i=0; i<count; i++) {
      collectionOfParametersToSend[requiredParameters[i].key] = requiredParameters[i].value
    }

    return collectionOfParametersToSend
  },

  /**
   * Creates a super simple payment api validator that just sends the given request object
   * to the payment api, attempts to create a payment and checks the reply with expected.
   *
   * @param {Object} test Tape tester
   * @param {string} name  Name for the test
   * @param {Object} request Payment api POST body payload
   * @param {string} expected What we are expecting to receive from the payment api.
   */
  successPathTestCreator: (test, name, request, expected) => {
    test(name, test => {
      test.plan(1)
      test.timeoutAfter(1500)

      payments
        .openPaymentWall(request)
        .then(response => test.equal(response, expected))
    })
  }
}
