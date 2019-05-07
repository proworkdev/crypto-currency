const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema({
    senderAddress: String,
    receiverAddress: String,
    amount: String,
    transactionID : String,
    transactionType : String
});

module.exports = mongoose.model('transactions', transactionSchema);
