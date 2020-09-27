const express = require("express");
const router = express.Router();
const isEmpty = require("is-empty");
const config = require("../config");
const stripe = require('stripe')(config.STRIPE_SK);
const Business = require("../models/Brand");
const Ambassador = require("../models/Ambassador");
const Contract = require("../models/Contract");
const User = require("../models/User");


/**
 * update a profile
 * @route POST api/profile/update
 */
router.post("/update", (req, res) => {
	const profile = req.body;
	console.log(profile);

	// check the validation of (business_name, industry, address)
	// if(isEmpty(profile.name)){
	// 	return res.status(400).json({
	// 		msg_business: "owner full name is required"
	// 	});
	// }
	// else if(isEmpty(profile.business_name)){
	// 	return res.status(400).json({
	// 		msg_business_name: "business name is required",
	// 	});
	// }
	// else if(isEmpty(profile.industry)){
	// 	return res.status(400).json({
	// 		msg_business_industry: "Industry is required",
	// 	});
	// }
	// else if(isEmpty(profile.email)){
	// 	return res.status(400).json({
	// 		msg_business_address: "Email is required",
	// 	});
	// }
	// else {
	// 	const filter = {_id: profile.id};
	// 	User.findOneAndUpdate(filter, profile, {new: true, upsert: true, useFindAndModify: false})
	// 		.then(() => {
	// 			return res.status(200).json({msg_contract: "The profile was updated."});
	// 		}).catch(err => console.log(err));
	// }

	const filter = {_id: profile.profile_id};
	User.findOneAndUpdate(filter, profile, {new: true, upsert: true, useFindAndModify: false})
		.then((profile) => {
			console.log("@@@@@@@@@@@@@", profile);
			return res.status(200).json({msg_contract: "The profile was updated."});
		}).catch(err => console.log(err));
});

/**
 * get profile by id
 * @route api/profile/get-by-id
 */

router.post("/get-by-id", (req, res) => {
	User.findOne({_id: req.body.profile_id}).then(profile => {
		if(profile){
			return res.status(200).json({...profile});
		}
		else{
			return res.status(404).json({msg_info: "The profile not found."});
		}
	});
});


/**
 * get all businesses that are not rejected by ambassador_id.
 * @route POST api/profile/business/get
 */
router.post("/business/get", (req, res) => {
	console.log("**********", req.body);

	let block_list = [];
	Contract.find({
			ambassador_id: req.body.ambassador_id,
			status: "reject"
		}).then(data => {
			data.forEach((contract) => {
				block_list.push(contract.business_id);
			});
			console.log(block_list);

			User.find({role: "business"})
				.then(list => {
					let search_result = [];
					for (const business of list) {
						if (!block_list.includes(business._id.toString())) {
							search_result.push(business);
						}
					}
					return res.status(200).json({results: [...search_result]});
				})
				.catch(err => console.log(err));
		}).catch(err => console.log(err));
});



/**
 * get all ambassadors connected with given business_id.
 * @route POST api/profile/ambassador/get
 */
router.post("/ambassador/get", (req, res) => {
	console.log("@@@@@@@@@@@@", req.body);

	let good_list = [];
	Contract.find({
		business_id: req.body.business_id,
		status: "next_step"
	}).then(data => {
		data.forEach((contract) => {
			good_list.push(contract.ambassador_id);
		});

		User.find({role: "ambassador"})
			.then(list => {
				let search_result = [];
				for (const ambassador of list) {
					if (good_list.includes(ambassador._id.toString())) {
						console.log(ambassador._id);
						search_result.push(ambassador);
					}
				}
				return res.status(200).json({results: [...search_result]});
			})
			.catch(err => console.log(err));
	}).catch(err => console.log(err));
});


/**
 * get the diffs between two dates.
 *
 * @param prev
 * @param next
 * @returns {number} days
 */
function getDateDiff(prev, next){
	return (next.getTime() - prev.getTime()) / 86400000; // i day in milliseconds
}

/**
 * get the day in next month
 *
 * @param current
 * @param delta
 * @returns {{date: Date, diff: number}}
 */
function getNextMonth(current, delta){
	// end date in next month
	const num_days = new Date(
		current.getFullYear(),
		current.getMonth() + delta + 1,
		0).getDate();

	// get the date in next month.
	// if that's 2/31, converted to 2/28(=num_days)
	const next_date = new Date(
		current.getFullYear(),
		current.getMonth() + delta,
		current.getDate() > num_days ? num_days : current.getDate(),
		current.getHours(),
		current.getMinutes(),
		current.getSeconds(),
		current.getMilliseconds());

	// cycle duration - days between current date and the date in next month.
	const diff_days = getDateDiff(current, next_date);

	// return 'em
	return {
		diff: diff_days,
		date: next_date,
	};
}

router.post("/setcard", async (req, res) => {
	User.findOne({email: {$regex: new RegExp(`^${req.body.email}$`, 'i')}}).then(async (user) => {
		if(user){
			let is_error = false;
			// if no billing in db, create it.
			if(user.billing_info === undefined){
				if(req.body.source !== null){
					user.billing_info = await stripe.customers.create({
						source: req.body.source,
						email: req.body.email.toLowerCase(),
						name: req.body.name,
						description: req.body.description,
					});
					user
						.save()
						.then(() => {
							return res.status(200).json({
								msg: "A customer was created.",
								customer: user.billing_info,
							});
						})
						.catch(err => {
							return res.status(500).json({billing: `Error: ${err}`});
						});
				}
				else{
					return res.status(500).json({billing: "No billing information."});
				}
			}
			// if exist, change it with token information
			else{
				const new_card = await stripe.customers.createSource(
					user.billing_info.id, // customer
					{
						source: req.body.source,
					}
				);

				user.billing_info = await stripe.customers.update(
					user.billing_info.id, // customer
					{
						default_source: new_card.id,
					}
				);
				user
					.save()
					.then(() => {
						return res.status(200).json({
							msg: "A customer's default card was replaced.",
							customer: user.billing_info,
						});
					})
					.catch(err => {
						return res.status(500).json({billing: `Error: ${err}`});
					});
			}
		}
		else{
			/**
			 * We would not be arriving here, newer! Because we use an appropriate auth email.
			 */
			return res.status(500).json({billing: "The email address is not exist."});
		}
	});
});

/**
 * activate the business
 * create / update the subscription
 *
 * 1. if inputted token.id is null, use the existing customer saved in db.
 * 2. if token.id is valid, create new customer using it and save the created customer into db.
 * 3. with customer info (by step 1 or 2), get a subscription, which is one of active subscriptions, from stripe.com. must plus 1 to it's quantity.
 * 4. if no sub was gotten, create it with quantity = 1.
 * 5. return it.
 *
 * return:
 * @res.body.customer from stripe.com
 */
router.post("/activate", async (req, res) => {
	User.findOne({_id: req.body.id}).then(async (user) => {
		if(user){
			if(req.body.source){
				let is_error = false;
				// if no billing in db, create it.
				if(user.billing_info === undefined){
					user.billing_info = await stripe.customers.create({
						source: req.body.source,
						email: req.body.email.toLowerCase(),
						name: req.body.name,
						description: req.body.description,
					});
					user
						.save()
						.then(() => {
						})
						.catch(err => {
							return res.status(500).json({billing: `Error: ${err}`});
						});
				}
				// if exist, change it with token information
				else{
					const new_card = await stripe.customers.createSource(
						user.billing_info.id, // customer
						{
							source: req.body.source,
						}
					);

					user.billing_info = await stripe.customers.update(
						user.billing_info.id, // customer
						{
							default_source: new_card.id,
						}
					);
					user
						.save()
						.then(() => {
						})
						.catch(err => {
							return res.status(500).json({billing: `Error: ${err}`});
						});
				}
			}

			if(user.billing_info === undefined){
				/**
				 * 1. if inputted token.id is null, use the existing customer saved in db.
				 * 2. if token.id is valid, create new customer using it and save the created customer into db.
				 */
				let err_msg = 'processing...';
				if(req.body.source !== null){
					user.billing_info = await stripe.customers.create({
						source: req.body.source,
						email: req.body.email.toLowerCase(),
						name: req.body.name,
						description: req.body.description,
					});
					user
						.save()
						.then(() => {
							// Ok, created user was saved in database.
						})
						.catch(err => {
							err_msg = `Error: ${err}`;
							return res.status(500).json({billing: err_msg});
						});
				}
				else{
					return res.status(500).json({billing: "No billing information."});
				}
			}

			if(user.billing_info !== undefined){
				// get the subscriptions related to this customer.
				let my_subscriptions = await stripe.subscriptions.list({
					limit: 1,
					customer: user.billing_info.id,
					plan: config.SUBSCRIBER_MONTHLY_PLAN,
					status: "active",
				});

				if(my_subscriptions.data.length === 0){
					my_subscriptions = await stripe.subscriptions.list({
						limit: 1,
						customer: user.billing_info.id,
						plan: config.SUBSCRIBER_MONTHLY_PLAN,
						status: "trialing",
					});
				}

				/**
				 * 3. with customer info (by step 1 or 2), get a subscription, which is one of active subscriptions, from stripe.com. must plus 1 to it's quantity.
				 * (now, can use "user.billing_info.id" as customer info.)
				 */
				business.find({owner_id: req.body.id, activated: true}).then(async mines => {
					// get number of activated communities.
					const num_act_comms = mines.length;
					let subscription = null;
					let is_error = false;
					let last_invoice = null;
					if(my_subscriptions.data.length > 0){
						// if available to add new invoice?
						// qty is number of communities to be paid.
						// assert: qty > 0
						let qty = num_act_comms - my_subscriptions.data[0].items.data[0].quantity + 1;
						if(qty > 0){
							subscription = await stripe.subscriptions.update(
								my_subscriptions.data[0].items.data[0].subscription,
								{
									quantity: my_subscriptions.data[0].items.data[0].quantity + qty,
								}
							);
							if(subscription){
								console.log("Updated: ", subscription.id);

								// get a ticket instead of refunding.
								const init_date = new Date(subscription.billing_cycle_anchor * 1000);
								const to_date = new Date();
								let prev_due_date = init_date;
								let next_due_date = getNextMonth(init_date, 1).date;
								let i = 2;
								while(next_due_date.getTime() < to_date.getTime()){
									prev_due_date = next_due_date;
									next_due_date = getNextMonth(init_date, i).date;
									i++;
								}
								if(user.ticket_expiry === null || next_due_date.getTime() > user.ticket_expiry.getTime()){
									user.tickets = 0;
									user.ticket_expiry = next_due_date;
								}

								// qty user.tickets
								let real_qty = qty;
								if(real_qty >= user.tickets){
									real_qty -= user.tickets;
									user.tickets = 0;
								}
								else{
									user.tickets -= qty;
									real_qty = 0;
								}
								user.save().then().catch(err => console.log(err));

								console.log(real_qty);
								// get current billing cycle
								const diff = getDateDiff(prev_due_date, next_due_date);

								// calculate the proration from reminder days.
								const proration = subscription.status === "trialing" ? 0 : getDateDiff(new Date(), next_due_date) / (diff);

								// and amount for reminder of cycle.
								const amount = Math.round(real_qty * proration * subscription.plan.amount);

								// create invoice item for reminder
								const invo_item = await stripe.invoiceItems.create({
									customer: user.billing_info.id,
									amount: amount, // 5$ for 15 days.
									currency: 'usd',
									description: `One-off invoice for reminder. qty: ${real_qty}`,
								});

								// and delete all the items containing "Remaining" or "Unused".
								const invoices_to_delete = await stripe.invoiceItems.list({
									limit: 100, // max number of existing items
									customer: user.billing_info.id,
								});

								// for each starts with "Remaining..." or "Unused..."
								for(const invo_item of invoices_to_delete.data){
									if(invo_item.invoice === null &&
										(invo_item.description.startsWith("Remaining time on") ||
											invo_item.description.startsWith("Unused time on"))){
										// delete it!
										const deleted_invo_item = await stripe.invoiceItems.del(invo_item.id);
										console.log("Deleted invo item: ",
											deleted_invo_item ? deleted_invo_item.id : null);
									}
								}

								// Create one-off invoice from the existing invoice items.
								last_invoice = await stripe.invoices.create({
										customer: user.billing_info.id,
										auto_advance: true,
									},
									async function(err, invo){
										if(err){

										}
										else{
											// Prepare to pay by finalizing the created invoice.
											await stripe.invoices.finalizeInvoice(invo.id);
											console.log("One-off invoice: ", invo.id);
										}
									});
							}
							else{
								is_error = true;
							}
						}
					}
					/**
					 * 4. if no sub was gotten, create it with quantity = 1.
					 */
					else{
						const plan = await stripe.plans.retrieve(
							config.SUBSCRIBER_MONTHLY_PLAN,
						);

						subscription = await stripe.subscriptions.create({
							customer: user.billing_info.id,
							trial_period_days: plan.trial_period_days || config.TRIAL_PERIOD,
							coupon: req.body.coupon,
							items: [{
								plan: config.SUBSCRIBER_MONTHLY_PLAN,
							}],
							expand: [
								"latest_invoice.payment_intent",
							],
						});

						if(subscription && subscription.status !== "incomplete"){
							const invos = await stripe.invoices.list(
								{
									limit: 10,
									customer: user.billing_info.id,
									subscription: subscription.id,
									created: {
										gte: subscription.created,
									}
								},
							);
							if(invos.data.length > 0){
								last_invoice = invos.data[0];
								console.log("New: ", subscription.id);
							}
							else{
								is_error = true;
							}
						}
						else{
							is_error = true;
						}
					}

					/**
					 * move a business from inactive list to active one.
					 */
					if(!is_error){
						business.findOne({_id: req.body.business_id}).then(business => {
							if(business){
								business.updateOne({activated: true})
									.then(async () => {
										/**
										 * 5. return the updated subscription and an upcoming invoice.
										 */
										const uc_invoice = await stripe.invoices.retrieveUpcoming({
												customer: user.billing_info.id,
											},
											(err, invoice) => {
												if(err){
													return res.status(400).json({msg_billing: "Error: " + err});
												}
												else{
													return res.status(200).json({
														msg: "A business was activated successfully.",
														tickets: user.tickets,
														customer: user.billing_info,
														subscription: subscription,
														last_invoice: last_invoice,
														upcoming_invoice: invoice,
														trialing: subscription.status === 'trialing',
													});
												}
											});
									})
									.catch(err => res.status(400).json({msg_business: err.toString()}));
							}
							else{
								return res.status(400).json({msg_business: "The business could not be activated."});
							}
						});
					}
				});
			}
		}
		else{
			/**
			 * We would not be arriving here, newer! Because we use an appropriate auth email.
			 */
			return res.status(500).json({billing: "The email address is not exist."});
		}
	});
});

router.post("/activatemulti", async (req, res) => {
	User.findOne({_id: req.body.id}).then(async (user) => {
		if(user){
			if(req.body.source){
				let is_error = false;
				// if no billing in db, create it.
				if(user.billing_info === undefined){
					user.billing_info = await stripe.customers.create({
						source: req.body.source,
						email: req.body.email.toLowerCase(),
						name: req.body.name,
						description: req.body.description,
					});
					user
						.save()
						.then(() => {
						})
						.catch(err => {
							return res.status(500).json({billing: `Error: ${err}`});
						});
				}
				// if exist, change it with token information
				else{
					const new_card = await stripe.customers.createSource(
						user.billing_info.id, // customer
						{
							source: req.body.source,
						}
					);

					user.billing_info = await stripe.customers.update(
						user.billing_info.id, // customer
						{
							default_source: new_card.id,
						}
					);
					user
						.save()
						.then(() => {
						})
						.catch(err => {
							return res.status(500).json({billing: `Error: ${err}`});
						});
				}
			}

			if(user.billing_info === undefined){
				/**
				 * 1. if inputted token.id is null, use the existing customer saved in db.
				 * 2. if token.id is valid, create new customer using it and save the created customer into db.
				 */
				let err_msg = 'processing...';
				if(req.body.source !== null){
					user.billing_info = await stripe.customers.create({
						source: req.body.source,
						email: req.body.email.toLowerCase(),
						name: req.body.name,
						description: req.body.description,
					});
					user
						.save()
						.then(() => {
							// Ok, created user was saved in database.
						})
						.catch(err => {
							err_msg = `Error: ${err}`;
							return res.status(500).json({billing: err_msg});
						});
				}
				else{
					return res.status(500).json({billing: "No billing information."});
				}
			}

			if(user.billing_info !== undefined){
				// get the subscriptions related to this customer.
				let my_subscriptions = await stripe.subscriptions.list({
					limit: 1,
					customer: user.billing_info.id,
					plan: config.SUBSCRIBER_MONTHLY_PLAN,
					status: "active",
				});

				if(my_subscriptions.data.length === 0){
					my_subscriptions = await stripe.subscriptions.list({
						limit: 1,
						customer: user.billing_info.id,
						plan: config.SUBSCRIBER_MONTHLY_PLAN,
						status: "trialing",
					});
				}

				/**
				 * 3. with customer info (by step 1 or 2), get a subscription, which is one of active subscriptions, from stripe.com. must plus 1 to it's quantity.
				 * (now, can use "user.billing_info.id" as customer info.)
				 */
				business.find({owner_id: req.body.id, activated: true}).then(async mines => {
					// get number of activated communities.
					const num_act_comms = mines.length;
					let subscription = null;
					let is_error = false;
					let last_invoice = null;
					if(my_subscriptions.data.length > 0){
						// if available to add new invoice?
						// qty is number of communities to be paid.
						// assert: qty > 0
						let qty = num_act_comms - my_subscriptions.data[0].items.data[0].quantity + req.body.business_ids.length;
						if(qty > 0){
							subscription = await stripe.subscriptions.update(
								my_subscriptions.data[0].items.data[0].subscription,
								{
									quantity: my_subscriptions.data[0].items.data[0].quantity + qty,
								}
							);
							if(subscription){
								console.log("Updated: ", subscription.id);

								// get a ticket instead of refunding.
								const init_date = new Date(subscription.billing_cycle_anchor * 1000);
								const to_date = new Date();
								let prev_due_date = init_date;
								let next_due_date = getNextMonth(init_date, 1).date;
								let i = 2;
								while(next_due_date.getTime() < to_date.getTime()){
									prev_due_date = next_due_date;
									next_due_date = getNextMonth(init_date, i).date;
									i++;
								}
								if(user.ticket_expiry === null || next_due_date.getTime() > user.ticket_expiry.getTime()){
									user.tickets = 0;
									user.ticket_expiry = next_due_date;
								}

								// qty user.tickets
								let real_qty = qty;
								if(real_qty >= user.tickets){
									real_qty -= user.tickets;
									user.tickets = 0;
								}
								else{
									user.tickets -= qty;
									real_qty = 0;
								}
								user.save().then().catch(err => console.log(err));

								console.log(real_qty);
								// get current billing cycle
								const diff = getDateDiff(prev_due_date, next_due_date);

								// calculate the proration from reminder days.
								const proration = subscription.status === "trialing" ? 0 : getDateDiff(new Date(), next_due_date) / (diff);

								// and amount for reminder of cycle.
								const amount = Math.round(real_qty * proration * subscription.plan.amount);

								// create invoice item for reminder
								const invo_item = await stripe.invoiceItems.create({
									customer: user.billing_info.id,
									amount: amount, // 5$ for 15 days.
									currency: 'usd',
									description: `One-off invoice for reminder. qty: ${real_qty}`,
								});

								// and delete all the items containing "Remaining" or "Unused".
								const invoices_to_delete = await stripe.invoiceItems.list({
									limit: 100, // max number of existing items
									customer: user.billing_info.id,
								});

								// for each starts with "Remaining..." or "Unused..."
								for(const invo_item of invoices_to_delete.data){
									if(invo_item.invoice === null &&
										(invo_item.description.startsWith("Remaining time on") ||
											invo_item.description.startsWith("Unused time on"))){
										// delete it!
										const deleted_invo_item = await stripe.invoiceItems.del(invo_item.id);
										console.log("Deleted invo item: ",
											deleted_invo_item ? deleted_invo_item.id : null);
									}
								}

								// Create one-off invoice from the existing invoice items.
								last_invoice = await stripe.invoices.create({
										customer: user.billing_info.id,
										// coupon: req.body.coupon,
										auto_advance: true,
									},
									async function(err, invo){
										if(err){

										}
										else{
											// Prepare to pay by finalizing the created invoice.
											await stripe.invoices.finalizeInvoice(invo.id);
											console.log("One-off invoice: ", invo.id);
										}
									});
							}
							else{
								is_error = true;
							}
						}
					}
					/**
					 * 4. if no sub was gotten, create it with quantity = 1.
					 */
					else{
						const plan = await stripe.plans.retrieve(
							config.SUBSCRIBER_MONTHLY_PLAN,
						);

						subscription = await stripe.subscriptions.create({
							customer: user.billing_info.id,
							trial_period_days: plan.trial_period_days || config.TRIAL_PERIOD,
							coupon: req.body.coupon,
							items: [{
								plan: config.SUBSCRIBER_MONTHLY_PLAN,
								quantity: req.body.business_ids.length,
							}],
							expand: [
								"latest_invoice.payment_intent",
							],
						});

						if(subscription && subscription.status !== "incomplete"){
							const invos = await stripe.invoices.list(
								{
									limit: 10,
									customer: user.billing_info.id,
									subscription: subscription.id,
									created: {
										gte: subscription.created,
									}
								},
							);
							if(invos.data.length > 0){
								last_invoice = invos.data[0];
								console.log("New: ", subscription.id);
							}
							else{
								is_error = true;
							}
						}
						else{
							is_error = true;
						}
					}

					/**
					 * move a business from inactive list to active one.
					 */
					if(!is_error){
						await business.updateMany({_id: {$in: [...req.body.business_ids]}}, {activated: true});
						/**
						 * 5. return the updated subscription and an upcoming invoice.
						 */
						const uc_invoice = await stripe.invoices.retrieveUpcoming({
								customer: user.billing_info.id,
							},
							(err, invoice) => {
								if(err){
									return res.status(400).json({msg_billing: "Error: " + err});
								}
								else{
									return res.status(200).json({
										msg: "A business was activated successfully.",
										tickets: user.tickets,
										customer: user.billing_info,
										subscription: subscription,
										last_invoice: last_invoice,
										upcoming_invoice: invoice,
										trialing: subscription.status === 'trialing',
									});
								}
							});
					}
				});
			}
		}
		else{
			/**
			 * We would not be arriving here, newer! Because we use an appropriate auth email.
			 */
			return res.status(500).json({billing: "The email address is not exist."});
		}
	});
});

/**
 * deactivate the business
 */
router.post("/deactivate", (req, res) => {
	User.findOne({_id: req.body.id}).then(async (user) => {
		if(user){
			/**
			 * 1. if inputted token.id is null, use the existing customer saved in db.
			 * 2. if token.id is valid, create new customer using it and save the created customer into db.
			 */
			// if error, return with its message.
			if(user.billing_info === undefined){
				business.findOne({_id: req.body.business_id}).then(business => {
					if(business){
						business.updateOne({activated: false})
							.then(async () => {
								return res.status(200).json({
									msg: "No data.",
									subscription: null,
									upcoming_invoice: null,
								});
							})
							.catch(err => res.status(400).json({msg_business: err.toString()}));
					}
					else{
						return res.status(400).json({msg_business: "The business could not be deactivated."});
					}
				});
			}
			else{
				// get the subscriptions related to this customer.
				let my_subscriptions = await stripe.subscriptions.list({
					limit: 1,
					customer: user.billing_info.id,
					plan: config.SUBSCRIBER_MONTHLY_PLAN,
					status: "active",
				});

				if(my_subscriptions.data.length === 0){
					my_subscriptions = await stripe.subscriptions.list({
						limit: 1,
						customer: user.billing_info.id,
						plan: config.SUBSCRIBER_MONTHLY_PLAN,
						status: "trialing",
					});
				}

				/**
				 * 3. with customer info (by step 1 or 2), get a subscription, which is one of active subscriptions, from stripe.com. must plus 1 to it's quantity.
				 * (now, can use "user.billing_info.id" as customer info.)
				 */
				business.find({owner_id: req.body.id, activated: true}).then(async mines => {
					const num_act_comms = mines.length;
					let subscription = null;
					if(my_subscriptions.data.length > 0){
						subscription = await stripe.subscriptions.update(
							my_subscriptions.data[0].items.data[0].subscription,
							{
								quantity: num_act_comms > 0 ? num_act_comms - 1 : 0,
							}
						);
						if(subscription){
							console.log("Deactivate - Updated: ", subscription.id);

							// get a ticket instead of refunding.
							let i = 1;
							const init_date = new Date(subscription.billing_cycle_anchor * 1000);
							let next_due_date = init_date;
							const to_date = new Date();
							while(next_due_date.getTime() < to_date.getTime()){
								next_due_date = getNextMonth(init_date, i).date;
								i++;
							}
							if(user.ticket_expiry === null || next_due_date.getTime() > user.ticket_expiry.getTime()){
								user.tickets = 0;
								user.ticket_expiry = next_due_date;
							}

							if(num_act_comms > 0){
								user.tickets++;
							}
							user.save().then().catch(err => console.log(err));

							// and delete all the items containing "Remaining" or "Unused".
							const invoices_to_delete = await stripe.invoiceItems.list({
								limit: 100, // max number of existing items
								customer: user.billing_info.id,
							});
							// for each starts with "Remaining..." or "Unused..."
							for(const invo_item of invoices_to_delete.data){
								if(invo_item.invoice === null &&
									(invo_item.description.startsWith("Remaining time on") ||
										invo_item.description.startsWith("Unused time on"))){
									// delete it!
									const deleted_invo_item = await stripe.invoiceItems.del(invo_item.id);
									console.log("Deleted invo item: ",
										deleted_invo_item ? deleted_invo_item.id : null);
								}
							}
						}
					}

					/**
					 * move a business from inactive list to active one.
					 */
					business.findOne({_id: req.body.business_id}).then(business => {
						if(business){
							business.updateOne({activated: false})
								.then(async () => {
									/**
									 * 5. return the updated subscription and an upcoming invoice.
									 */
									const uc_invoice = await stripe.invoices.retrieveUpcoming({
											customer: user.billing_info.id,
										},
										(err, invoice) => {
											if(err){
												return res.status(400).json({msg_billing: "Error: " + err});
											}
											else{
												return res.status(200).json({
													msg: "A business was deactivated.",
													tickets: user.tickets,
													subscription: subscription,
													upcoming_invoice: invoice,
												});
											}
										});
								})
								.catch(err => res.status(400).json({msg_business: err.toString()}));
						}
						else{
							return res.status(400).json({msg_business: "The business could not be deactivated."});
						}
					});
				});
			}
		}
		else{
			/**
			 * We would not be arriving here, newer! Because we use an appropriate auth email.
			 */
			return res.status(500).json({msg_billing: "The email address is not exist."});
		}
	});
});

router.post("/deactivatemulti", (req, res) => {
	console.log(req.body.business_ids);
	User.findOne({_id: req.body.id}).then(async (user) => {
		if(user){
			/**
			 * 1. if inputted token.id is null, use the existing customer saved in db.
			 * 2. if token.id is valid, create new customer using it and save the created customer into db.
			 */
			// if error, return with its message.
			if(user.billing_info === undefined){
				await business.updateMany({_id: {$in: [...req.body.business_ids]}}, {activated: false});
				return res.status(200).json({
					msg: "No data.",
					subscription: null,
					upcoming_invoice: null,
				});
			}
			else{
				// get the subscriptions related to this customer.
				let my_subscriptions = await stripe.subscriptions.list({
					limit: 1,
					customer: user.billing_info.id,
					plan: config.SUBSCRIBER_MONTHLY_PLAN,
					status: "active",
				});

				if(my_subscriptions.data.length === 0){
					my_subscriptions = await stripe.subscriptions.list({
						limit: 1,
						customer: user.billing_info.id,
						plan: config.SUBSCRIBER_MONTHLY_PLAN,
						status: "trialing",
					});
				}

				/**
				 * 3. with customer info (by step 1 or 2), get a subscription, which is one of active subscriptions, from stripe.com. must plus 1 to it's quantity.
				 * (now, can use "user.billing_info.id" as customer info.)
				 */
				business.find({owner_id: req.body.id, activated: true}).then(async mines => {
					const num_act_comms = mines.length;
					const qty = num_act_comms - req.body.business_ids.length;
					let subscription = null;
					if(my_subscriptions.data.length > 0){
						subscription = await stripe.subscriptions.update(
							my_subscriptions.data[0].items.data[0].subscription,
							{
								quantity: qty > 0 ? qty : 0,
							}
						);
						if(subscription){
							console.log("Deactivate - Updated: ", subscription.id);

							// get a ticket instead of refunding.
							let i = 1;
							const init_date = new Date(subscription.billing_cycle_anchor * 1000);
							let next_due_date = init_date;
							const to_date = new Date();
							while(next_due_date.getTime() < to_date.getTime()){
								next_due_date = getNextMonth(init_date, i).date;
								i++;
							}
							if(user.ticket_expiry === null || next_due_date.getTime() > user.ticket_expiry.getTime()){
								user.tickets = 0;
								user.ticket_expiry = next_due_date;
							}

							if(req.body.business_ids.length > 0){
								user.tickets += req.body.business_ids.length;
							}
							user.save().then().catch(err => console.log(err));

							// and delete all the items containing "Remaining" or "Unused".
							const invoices_to_delete = await stripe.invoiceItems.list({
								limit: 100, // max number of existing items
								customer: user.billing_info.id,
							});
							// for each starts with "Remaining..." or "Unused..."
							for(const invo_item of invoices_to_delete.data){
								if(invo_item.invoice === null &&
									(invo_item.description.startsWith("Remaining time on") ||
										invo_item.description.startsWith("Unused time on"))){
									// delete it!
									const deleted_invo_item = await stripe.invoiceItems.del(invo_item.id);
									console.log("Deleted invo item: ",
										deleted_invo_item ? deleted_invo_item.id : null);
								}
							}
						}
					}

					/**
					 * move communities from active list to inactive list.
					 */
					await business.updateMany({_id: {$in: [...req.body.business_ids]}}, {activated: false});
					/**
					 * 5. return the updated subscription and an upcoming invoice.
					 */
					const uc_invoice = await stripe.invoices.retrieveUpcoming({
							customer: user.billing_info.id,
						},
						(err, invoice) => {
							if(err){
								return res.status(400).json({msg_billing: "Error: " + err});
							}
							else{
								return res.status(200).json({
									msg: "A business was deactivated.",
									tickets: user.tickets,
									subscription: subscription,
									upcoming_invoice: invoice,
								});
							}
						});
				});
			}
		}
		else{
			/**
			 * We would not be arriving here, newer! Because we use an appropriate auth email.
			 */
			return res.status(500).json({msg_billing: "The email address is not exist."});
		}
	});
});

/**
 * delete the business
 */
router.post("/delete", (req, res) => {
	business.findOne({_id: req.body.business_id}).then(business => {
		if(business){
			business.remove()
				.then(() => {
					return res.status(200).json({msg_business: "A business was deleted."});
				})
				.catch(err => res.status(400).json({msg_business: err.toString()}));
		}
		else{
			return res.status(400).json({msg_business: "The business could not be deleted."});
		}
	});
});

router.post("/deletemulti", async (req, res) => {
	await business.deleteMany({_id: {$in: [...req.body.business_ids]}});
	return res.status(200).json({msg_business: "Communities have been deleted."});
});

module.exports = router;
