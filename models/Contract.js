const constants = require("../utils/constants");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * User Schema
 */
const ContractSchema = new Schema({
    ambassador_id: {
        type: String,
        required: true,
    },
    business_id: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
    },
    created_at: {
        type: Date,
        default: new Date()
    },
    updated_at: {
        type: Date,
        default: new Date()
    },
});

module.exports = Contract = mongoose.model("contracts", ContractSchema);
