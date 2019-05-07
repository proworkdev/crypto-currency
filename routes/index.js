var express = require('express');
var router = express.Router();
var txns = require('./../models/transactions');
const { RippleAPI } = require('ripple-lib');
const assert = require('assert');
assert.ok(process.env.RIPPLE_FROM_ADDRESS);
assert.ok(process.env.RIPPLE_TO_ADDRESS);
assert.ok(process.env.RIPPLE_FROM_SECRET);


// Ripple test server initialization.
const api = new RippleAPI({
  server: 'wss://s.altnet.rippletest.net:51233'
});

// Route for rendering Home.
router.get('/home', (req, res) => {
  res.render('home');
});

// Route for rendering get balance.
router.get('/getBalance', (req, res) => {
  res.render('balance');
})

// Route for checking displaying balance.
router.post('/balance', (req, res) => {

  const { wallet } = req.body;

  async function run() {

    await api.connect();

    const info = await api.getAccountInfo(wallet);

    res.render('showBalance', { data: info.xrpBalance })

  }

  run();

});

// Route for sending money view.
router.get('/sendMoney', (req, res) => {

  res.render('moneyDetails');

});

// Route for placing transaction.
router.post('/transaction', (req, res) => {

  // Destructuring to get user input data.
  const { sender, receiver, amount } = req.body;

  // Using async/await to handle asynchronous 
  async function func1() {

    await api.connect();

    // Payment object.
    const payment = {
      source: {
        address: sender,
        maxAmount: {
          value: amount,
          currency: 'XRP'
        }
      },
      destination: {
        address: receiver,
        amount: {
          value: amount,
          currency: 'XRP'
        }
      }
    };

    // Get ready to submit the payment
    const prepared = await api.preparePayment(sender, payment, {
      maxLedgerVersionOffset: 5
    });

    // Sign the payment using the sender's secret
    const { signedTransaction } = api.sign(prepared.txJSON, process.env.RIPPLE_FROM_SECRET);

    console.log('Signed', signedTransaction);

    // Submit the payment
    const result = await api.submit(signedTransaction);

    // Initializing transactions mongoose model.
    const trans = new txns();

    trans.senderAddress = sender;
    trans.receiverAddress = receiver;
    trans.amount = amount;
    trans.transactionID = result.tx_json.TxnSignature;
    trans.transactionType = 'sent';

    // Storing data in transactions collection.
    trans.save(((err) => {
      if (err) { console.log('Error while saving transaction'); }
      console.log('Transaction saved successfully.');
    }))

    res.render('transactions', { data: result })

  }

  func1();

});

// Route for getting list of transactions.
router.get('/getTransactions', (req, res) => {

  // Using async/await to get list of transactions from MongoDB collection.
  async function getTrans() {

    const transac = await txns.find({});

    // transac.forEach((trans, index) => {
    //   console.log('Checking list of transactions ==> ', trans);
    // })
res.render('getTransaction', {data : transac});
  }

  getTrans();

  

});


module.exports = router;