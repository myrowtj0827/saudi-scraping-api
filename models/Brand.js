const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * Brand schema
 */
const BrandSchema = new Schema({
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
	brand_logo: {
		type: String,
		default: '',
	},
	business_name: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true
	},
	website: {
		type: String,
		default: '',
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
	media: {
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
	service_type: {
		type: String,
		required: false
	},
	password: {
		type: String,
		required: true
	},
});

module.exports = Brand = mongoose.model("business", BrandSchema);
