const express = require("express");
const router = express.Router();
const Filter = require("../models/Filter");

router.all("/register-product", async (req, res) => {
    console.log(req.body);

    const newProduct = new Filter({
        product_id: req.body.product_id,
        product_photo: req.body.product_photo,
        product_category: req.body.product_category,
        product_name: req.body.product_name,
        product_price: req.body.product_price,
        product_description: req.body.product_description,
        product_photo_url: req.body.product_photo_url,
        product_store_address: req.body.product_store_address,
    });

    await newProduct.save();
    return res.status(200).json(newProduct);
});

router.all("/get-product-all", async (req, res) => {
    Filter.find({}).then( productList =>  {
        if(productList){
            // console.log("products List -> ", productList);

            return res.status(200).json({results: [...productList]});
        }
        else{
            return res.status(400).json({msg: "The products can not find"});
        }
    });
});

router.all("/get-product-sort", (req, res) => {
    Filter.find({
        product_category: req.body.category,
    }).collation( { locale: 'en', strength: 2 } ).sort({product_price: 1}).then(productSortList => {

        if(productSortList){
            return res.status(200).json({results: [...productSortList]});
        }
        else{
            return res.status(400).json({msg: "The products can not find"});
        }
    });
});

module.exports = router;
