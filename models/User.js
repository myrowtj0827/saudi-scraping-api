const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * User schema
 */
const UserSchema = new Schema({
	role: {
		type: String,
		required: true,
	},
	full_name: {
		type: String,
		required: true,
	},
	user_name: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: true
	},
	birthday: {
		type: Date,
		required: true,
	},
	industry: {
		type: String,
		default: '',
	},
	industry_name: {
		type: String,
		default: '',
	},
	business_name: {
		type: String,
		default: '',
	},
	avatar: {
		type: String,
		default: '',
	},
	brand_logo: {
		type: String,
		default: '',
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
		default: '',
	},
	expectation: {
		type: String,
		default: '',
	},
	created_at: {
		type: Date,
		default: new Date(),
	},
	updated_at: {
		type: Date,
		default: new Date(),
	}
});

module.exports = User = mongoose.model("users", UserSchema);
