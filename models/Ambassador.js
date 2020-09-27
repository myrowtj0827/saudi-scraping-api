const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * Ambassador schema
 */
const AmbassadorSchema = new Schema({
    owner_full_name: {
        type: String,
        required: true,
    },
    owner_birthday: {
        type: Date,
        required: true,
    },
    user_image: {
        type: String,
        required: false,
    },
    industry: {
        type: String,
        required: true,
    },
    industry_name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true
    },
    facebook: {
        type: Array,
        default: [],
    },
    twitter: {
        type: Array,
        default: [],
    },
    instagram: {
        type: Array,
        default: [],
    },
    description: {
        type: String,
        required: true,
    },
    expectation: {
        type: String,
        required: true,
    },
});

module.exports = Ambassador = mongoose.model("ambassadors", AmbassadorSchema);
