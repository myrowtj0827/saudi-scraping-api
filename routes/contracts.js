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
 * update the contract status
 * @route POST api/contract/set-status
 */
router.post("/set-status", (req, res) => {
    const data = req.body;
    console.log(data);
    const filter = {
        ambassador_id: data.ambassador_id,
        business_id: data.business_id,
    };
    const update = {
        status: data.status,
    };
    Contract.findOneAndUpdate(filter, update, {new: true, upsert: true, useFindAndModify: false})
        .then(() => {
            return res.status(200).json({msg_contract: "The Contract was updated."});
        }).catch(err => console.log(err));
});

/**
 * get a contract with given contract key
 * @route POST api/contract/get
 */
router.post("/get", (req, res) => {
    const data = req.body;
    console.log(data);
    let filter = {};
    if (data.key === "status") {
        filter = {
            ambassador_id: data.ambassador_id,
            business_id: data.business_id,
        };
    } else if (data.key === "business") {
        filter = {
            ambassador_id: data.ambassador_id,
            // status: data.status,
        };
    } else if (data.key === "ambassador") {
        filter = {
            business_id: data.business_id,
            // status: data.status,
        };
    }

    Contract.find(filter)
        .then((contracts) => {
            return res.status(200).json({results: [...contracts]});
        }).catch(err => console.log(err));
});

module.exports = router;
