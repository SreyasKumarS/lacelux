const mongoose = require('mongoose');
const moment = require('moment');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required:true,
    },
    type: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        get: function(val) {
          return moment(val).format('DD-MM-YYYY'); 
        }
    }
}, { toJSON: { getters: true }, toObject: { getters: true } }); 

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
