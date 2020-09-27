module.exports = {
	TRIAL_PERIOD: 1, // free trial period
	PENDING_EXPIRATION: 172800000, // 48 hours in milliseconds
	VERIFY_EXPIRATION: 172800000, // 48 hours in milliseconds
	PASSWORD_LENGTH: 20, // length of generated password

	/**
	 * MongoDB URL from system environment variable "MONGO_URL".
	 */
	// MONGO_URL: process.env.MONGO_URL,
	MONGO_URL: "mongodb://127.0.0.1:27017/saudi",
	// MONGO_URL: "mongodb+srv://shurenyu:cjy3219891@cluster0-q89pr.azure.mongodb.net/test",

	/**
	 * Secret key for JWT
	 */
	SECRET_KEY: "SOCIAL_INVESTME",

	/**
	 * This setting is used only for the content of the mails with link to ... (in forgot-password)
	 */

	//FRONT_URL: "http://localhost:3000",
	FRONT_URL: "https://vigorous-golick-f5efa9.netlify.app/",

	/**
	 * TODO: must be replaced for production
	 * SocialInvestme Mailer
	 */
	// MAIL_SG_API: process.env.SEND_GRID_API_KEY,
	MAIL_SENDER: "addison56@ethereal.email",
	// MAIL_SENDER: process.env.MAIL_SENDER_ADDRESS,
};
