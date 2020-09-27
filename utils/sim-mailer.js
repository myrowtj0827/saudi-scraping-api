const config = require("../config");
const nodeMailer = require("nodemailer");
const sgTransport = require('nodemailer-sendgrid-transport');

/**
 * mailer for forgot-password and others
 */
// const simMailer = nodeMailer.createTransport(sgTransport({
// 	auth: {
// 		api_key: config.MAIL_SG_API,
// 	}
// }));

const simMailer = nodeMailer.createTransport({
	host: 'smtp.ethereal.email',
	port: 587,
	auth: {
		user: 'addison56@ethereal.email',
		pass: 'PthM36D72DJRZsC4e1'
	}
});

module.exports = simMailer;
