const express = require("express");
const router = express.Router();
const ScrapingProduct = require("../models/ScrapingProduct");
const Filter = require("../models/Filter");

const axios = require("axios");
const request = require('request');
const cheerio = require('cheerio');

let goLink = [];
let mLen;

let baseUrl;
let firstStr;
let secondStr;

/**
 * starting newly
 * if (flag_new === true) then starting the scraping from the first
 * if (flag_repeat === true) then starting the scraping from the middle
 * m is the starting position of the scraping
 */
// let m = 0;
// const flag_new = true;
// const flag_repeat = false;

/**
 * repeat scraping const
 */
let m = 35072;
const flag_new = false;
const flag_repeat = true;

/**
 * Repeat order
 *  nth have to take one among 1, 2, 3: it is stage order
 *  nCount_First is starting position on the DB, ex the end of the first stage
 *  nCount_Products is the end of the 2 nd stage
 */
const nth = 3;
let nCount_First = 1, nCount_Products;

/**
 * 2nd Site info
 */
let arrayUrl = [
                    "https://www.noon.com/saudi-en/",
                    "https://swsg.co/en/",
                    "https://redsea.com/en/",
                    "https://www.extra.com/en-sa/",
                    "https://blackbox.com.sa/en/",
                    "https://www.virginmegastore.sa/en/",
                    "https://www.samma3a.com/saudi-en/",
                    "https://www.jarir.com/sa-en/",
                ];

let pStage = 0;
let middleStage = false;
let firstLink;
let secondLink;
let sLink;

router.post("/scraping-product", async (req, res) => {
    await console.log("--------------- success  ----------------");

    baseUrl = arrayUrl[7];
    console.log(baseUrl);

    if(baseUrl === "https://www.noon.com/saudi-en/") {
        firstStr = "div.bannerContainer.bannerModule";
        secondStr = "div.productContainer";

        await goLink.slice(0, goLink.length);
        goLink[0] = baseUrl;
        await initializeDB(flag_new, flag_repeat);
        /**
         * the main scraping part
         */
        await mainScraping();
        /** From now on, common scraping part about the whole site
         * Getting Last Information and Inserting in the real DB
         */
        await gettingScraping(nCount_First, nCount_Products, baseUrl);
        await console.log(" ===============  Scraping Done !!!!! =============");
        await shownData(ScrapingProduct);

    } else if(baseUrl === "https://swsg.co/en/") {
        middleStage = false;
        firstLink = "a";
        secondLink = "ol.grid-product-type > li > div.item-inner > div.product-item-info > div.product-item-image > a";
        sLink = "li.ins-web-smart-recommender-box-item";

        console.log("2nd result starting");
        await goLink.slice(0, goLink.length);
        goLink[0] = baseUrl;
        await initializeSimpleDB(pStage);

        const scrapingItem = await ScrapingProduct.find({});
        for(let k = 0; k < scrapingItem.length; k ++) {
            goLink[k] = scrapingItem[k].scraping_store_address;
            console.log(k + 1, " -> ", goLink[k]);
        }
        console.log("The Initialize !");

        /**
         * Getting first Links
         */
        nCategory = 1;
        await gettingFinalLink(0, firstLink, baseUrl);

        /**
         * Getting second Links
         */
        const items = await ScrapingProduct.find({});
        let kl = 1;
        middleStage = true;
        for (const ele of items) {
            console.log(kl, " -> ", ele.scraping_store_address);
            await gettingFinalLink(0, secondLink, ele.scraping_store_address);
            kl ++;
        }

        /**
         * Getting description result
         *
         */
        const sItems = await ScrapingProduct.find({});
        let nCount = 0;
        await gettingScraping(nCount, sItems.length, baseUrl);

        await shownData(ScrapingProduct);
    } else if(baseUrl === "https://redsea.com/en/") {
        middleStage = false;

        firstLink = "a";
        secondLink = "ol.grid-product-type > li > div.item-inner > div.product-item-info > div.product-item-image > a";
        sLink = "li.ins-web-smart-recommender-box-item";

        console.log("3rd result starting");
        await goLink.slice(0, goLink.length);
        goLink[0] = baseUrl;
        await initializeSimpleDB(pStage);

        const scrapingItem = await ScrapingProduct.find({});
        for(let k = 0; k < scrapingItem.length; k ++) {
            goLink[k] = scrapingItem[k].scraping_store_address;
            console.log(k + 1, " -> ", goLink[k]);
        }
        console.log("The Initialize !");

        /**
         * Getting each product Links
         */
        nCategory = 1;
        await gettingFinalLink(0, firstLink, baseUrl);

        /**
         * Getting description result
         *
         */
        const sItems = await ScrapingProduct.find({});
        let nCount = 0;
        await gettingScraping(nCount, sItems.length, baseUrl);

        // await gettingScraping(0, 22, baseUrl);
    } else if(baseUrl === "https://www.extra.com/en-sa/") {
        firstLink = "a";
        secondLink = "ul > li > a";

        console.log("4th result starting");
        await goLink.slice(0, goLink.length);
        goLink[0] = baseUrl;
        await initializeSimpleDB(pStage);

        const scrapingItem = await ScrapingProduct.find({});
        for(let k = 0; k < scrapingItem.length; k ++) {
            goLink[k] = scrapingItem[k].scraping_store_address;
            console.log(k + 1, " -> ", goLink[k]);
        }
        console.log("The Initialize !");

        /**
         * Getting each product Links
         */
        await gettingFinalLink(0, firstLink, baseUrl);

        /**
         * Getting the last Link
         */
        let sItems = await ScrapingProduct.find({});
        for(const ele of sItems) {
           console.log("\n\n Last Link ", ele.scraping_id, "  --- > ", ele.scraping_store_address);
            await gettingFinalLink(0, secondLink, ele.scraping_store_address);
        }     
        
        /**
         * Getting description result      
         */
        sItems = await ScrapingProduct.find({});
        let nCount = 0;
        await gettingScraping(nCount, sItems.length, baseUrl);
    } else if(baseUrl === "https://blackbox.com.sa/en/") {
        firstLink = "a";
        secondLink = "ul > li > a";

        console.log("5th result starting");
        await goLink.slice(0, goLink.length);
        goLink[0] = baseUrl;
        await initializeSimpleDB(pStage);

        const scrapingItem = await ScrapingProduct.find({});
        for(let k = 0; k < scrapingItem.length; k ++) {
            goLink[k] = scrapingItem[k].scraping_store_address;
            console.log(k + 1, " -> ", goLink[k]);
        }
        console.log("The Initialize !");

        /**
         * Getting each product Links
         */
        middleStage = true;
        await gettingFinalLink(0, firstLink, baseUrl);

        /**
         * Getting description result
         */
        sItems = await ScrapingProduct.find({});
        let nCount = 0;
        await gettingScraping(nCount, sItems.length, baseUrl);
        //await gettingScraping(91, 91, baseUrl);

        /**
         *  6th Site Scraping
         */
    } else if(baseUrl === "https://www.virginmegastore.sa/en/") {
        firstLink = "a";
        secondLink = "ul > li > a";

        console.log("6th result starting");
        await goLink.slice(0, goLink.length);
        goLink[0] = baseUrl;
        await initializeSimpleDB(pStage);

        const scrapingItem = await ScrapingProduct.find({});
        for(let k = 0; k < scrapingItem.length; k ++) {
            goLink[k] = scrapingItem[k].scraping_store_address;
            console.log(k + 1, " -> ", goLink[k]);
        }
        console.log("The Initialize !");

        /**
         * Getting each product Links
         */
        await gettingFinalLink(0, firstLink, baseUrl);

        /**
         * Getting description result
         */
        sItems = await ScrapingProduct.find({});
        let nCount = 0;
        await gettingScraping(nCount, sItems.length, baseUrl);
        //await gettingScraping(86, 95, baseUrl);
    } else if(baseUrl === "https://www.samma3a.com/saudi-en/") {
        firstLink = "a";
        secondLink = "li.owl-item > a";

        console.log("7th result starting");
        await goLink.slice(0, goLink.length);
        goLink[0] = baseUrl;
        //await initializeSimpleDB(pStage);

        const scrapingItem = await ScrapingProduct.find({});
        for(let k = 0; k < scrapingItem.length; k ++) {
            goLink[k] = scrapingItem[k].scraping_store_address;
            console.log(k + 1, " -> ", goLink[k]);
        }
        console.log("The Initialize !");

        /**
         * Getting each product Links
         */
        //await gettingFinalLink(0, firstLink, baseUrl);

        sItems = await ScrapingProduct.find({});
        for(let k = 0; k < sItems.length; k ++) {
            console.log(k, ' -> ', sItems[k].scraping_store_address);
            //await gettingFinalLink(0, secondLink, sItems[k].scraping_store_address);
        }

        /**
         * Getting description result
         */
        sItems = await ScrapingProduct.find({});
        let nCount = 145;
        await gettingScraping(nCount, sItems.length, baseUrl);
        //await gettingScraping(6, 6, baseUrl);

        /**
         *  8th Site Scraping
         */
    } else if(baseUrl === "https://www.jarir.com/sa-en/") {
        firstLink = "a";
        secondLink = "li.owl-item > a";

        console.log("8th result starting");
        await goLink.slice(0, goLink.length);
        goLink[0] = baseUrl;
        //await initializeSimpleDB(pStage);

        const scrapingItem = await ScrapingProduct.find({});
        for(let k = 0; k < scrapingItem.length; k ++) {
            goLink[k] = scrapingItem[k].scraping_store_address;
            console.log(k + 1, " -> ", goLink[k]);
        }
        console.log("The Initialize !");

        /**
         * Getting each product Links
         */
        //await gettingFinalLink(0, firstLink, baseUrl);

        // sItems = await ScrapingProduct.find({});
        // for(let k = 0; k < sItems.length; k ++) {
        //     console.log(k, ' -> ', sItems[k].scraping_store_address);
        //     await gettingFinalLink(0, secondLink, sItems[k].scraping_store_address);
        // }

        /**
         * Getting description result
         */
        sItems = await ScrapingProduct.find({});
        let nCount = 0;
        //await gettingScraping(nCount, sItems.length, baseUrl);
        await gettingScraping(4, 4, baseUrl);
    }

    console.log("Getting the last link !");
    console.log(" ===============  Category Scraping Done !!!!! =============");
    return res.status(200).json("scraping_Product");
});

router.get("/scraping-product-all", async (req, res) => {
    let regLink = new RegExp('.+');

    Filter.find({
        scraping_photo_link: {$regex: regLink},
    }).then( scrapingList =>  {
        if(scrapingList){
            return res.status(200).json({results: [...scrapingList]});
        }
        else{
            return res.status(400).json({msg: "The products can not find"});
        }
    });
});

router.all("/scraping-product-sort", (req, res) => {
    let pStr = req.body.category;
    let pSplit = pStr.split(' ');

    let mLen = pSplit.length;
    let reE = '^(?=.*\\b' + pSplit[0] + '\\b)';

    for (let i = 1; i < mLen; i ++) {
        reE += '(?=.*\\b' + pSplit[i] + '\\b)';
    }
    reE += '.*$';
    let rew = new RegExp(reE);
    let regLink = new RegExp('.+');

    Filter.find({
        scraping_category: {$regex: rew, $options: 'i/w'},
        scraping_photo_link: {$regex: regLink},
    }).collation( { locale: 'en', strength: 2 } ).sort({scraping_price: 1}).then(scrapingSortList => {
        if(scrapingSortList){
            return res.status(200).json({results: [...scrapingSortList]});
        }
        else{
            return res.status(400).json({msg: "The products can not find"});
        }
    });
});

router.all("/delete-product", async (req, res) => {
    const scraping_Product = new ScrapingProduct({
        scraping_id: 0,
        scraping_store_address: '',
    });
    await scraping_Product.collection.deleteMany({});
    console.log("Success Delete !");
});

module.exports = router;

async function mainScraping() {
    if (nth === 1) {
        /**
         * 1th filter
         */
        while (m < goLink.length) {
            await gettingFirstStageLink(firstStr, m);
            m = m + 1;
            await console.log("\n 1st stage -> ",  goLink.length, '/' , m, "th", "   Passed \n");
        }

        nCount_First = goLink.length;
        m = 0;
        /**
         * 2nd filter
         */
        while (m < nCount_First) {
            await gettingFirstStageLink(secondStr, m);
            m = m + 1;
            await console.log("\n 2nd stage -> ", nCount_First, '/', m, "th   Passed \n");
        }

        nCount_Products = goLink.length;

    } else if (nth === 2) {
        /**
         * 2nd filter
         * nCount-First is the data number after 1st filter finished
         */
        nCount_First = 1341;

        while (m < nCount_First) {
            await gettingFirstStageLink(secondStr, m);
            m = m + 1;
            await console.log("\n 2nd stage -> ", nCount_First, '/', m, "th   Passed \n");
        }
        nCount_Products = goLink.length;

    } else if ( nth === 3) {
        nCount_First = m;
        nCount_Products = await ScrapingProduct.countDocuments();
        console.log(nCount_Products, '+++++++++')
    }
}

async function initializeDB(type_new, type_repeat) {
    if ((type_new === true && type_repeat === false) && (m === 0)) { // starting from the first
        const scraping_Product = await new ScrapingProduct({
            scraping_id: m + 1,
            scraping_store_address: baseUrl,
        });

        await scraping_Product.collection.deleteMany({});

        const scraping_ProductOne = await new ScrapingProduct({
            scraping_id: m + 1,
            scraping_store_address: baseUrl,
        });

        await scraping_ProductOne.save();
        await console.log( " === +++++++++++++++++++++++++++++++ === Total/Start -> ", await ScrapingProduct.countDocuments(), '/', m + 1, 'th');

    } else if ((type_new === false && type_repeat === true) && (m > 0)) {  // using the previous results

        await ScrapingProduct.find({}).then( async arrayLink => {
            let t = arrayLink.length;

            for( let i = 0; i < t; i ++) {
                goLink[i] = arrayLink[i].scraping_store_address;
            }
        });

        await console.log( " === +++++++++++++++++++++++++++++++ ===  Total/Start ", goLink.length, '/', m + 1);

    } else {
        return res.status(200).json("Conflict of the condition");
    }
}

async function gettingFirstStageLink(pStr, mIndex) {
    try {
        const result = await axios.get(goLink[mIndex]);
        let $ = await cheerio.load(result.data);

        await $(pStr).each( function() {
            if ($(this).find('a').attr('href') !== undefined) {
                mLen = goLink.length;

                goLink.push('https://www.noon.com' + $(this).find('a').attr('href'));
                goLink = [...new Set(goLink)];

                if (mLen < goLink.length) {
                    const scraping_Product = new ScrapingProduct({
                        scraping_id: goLink.length,
                        scraping_store_address: goLink[goLink.length - 1]
                    });
                    scraping_Product.save();

                    console.log("  -> ", goLink.length);
                }
            }
        });

    } catch (error) {

        if(error.response === undefined) {
            console.log("Site Error - Un-existing Product Url");
            return 0;
        }

        console.log(goLink.length, " / ", mIndex + 1, "th  -> ", "Timeout 1st + 2nd");
        await sleep(1500);
        await gettingFirstStageLink(pStr, mIndex);
    }
}

/**
 * Getting the last scraping Information
 * @param nFirst
 * @param nSecond
 * @returns {Promise<void>}
 */
async function gettingScraping(nFirst, nSecond, bUrl) {
    for (let i = nFirst; i <= nSecond; i ++) {
        try {
            if(i === 0) i = 1;

            const result = await axios.get(goLink[i - 1]);
            let $ = await cheerio.load(result.data);

            /**
             * Getting the category list
             */
            let categoryList = '';
            let sCategory, txtCategory;

            if(baseUrl === "https://www.noon.com/saudi-en/") {
                sCategory = "div.breadcrumbContainer > div > div.breadcrumb";
                txtCategory = "span.crumb > a";

                await $(sCategory).each(async function( index ) {
                    // await sleep(1000);
                    $(txtCategory).each( function( index ) {
                        if ($(this).text() !== undefined) {
                            categoryList += $(this).text() + '/';
                            categoryList = categoryList.replace(' & ', '/');
                        }
                    });

                    categoryList = categoryList.replace('Home/', '');
                    let mArray = categoryList.split('/');
                    mArray = [...new Set(mArray)];

                    categoryList = '';
                    for (let j = 0; j < mArray.length - 1; j ++) {
                        categoryList += mArray[j] + '/';
                    }
                });
                console.log(goLink[i - 1], i, " = " , categoryList);

                /**
                 * Getting the details information
                 */
                let sInfo = $("div.primaryDetails");

                let photoLink = await $(sInfo).find("div.mediaContainer > div > img").attr("src");
                let thumbnailPhotoLink = await $(sInfo).find("div.mediaContainer > img").attr("src");
                let productName = await $(sInfo).find("div.coreWrapper > div > a").text().trim();
                let productDescription = await $(sInfo).find("div.coreWrapper > div > h1").text().trim();
                let productPrice = await $(sInfo).find("div.coreWrapper > div > div.priceRow > div.pdpPrice > p > span.value > span.sellingPriceContainer > span.sellingPrice > span > span").text().trim();

                await ScrapingProduct.updateOne({scraping_store_address: goLink[i-1]},
                    [{$set: {scraping_category: categoryList, scraping_name: productName, scraping_photo_link: photoLink,
                        scraping_description: productDescription, scraping_price: productPrice, scraping_thumbnail_Link: thumbnailPhotoLink}}]).then(async () => {
                            console.log(i, "    ------> ", goLink[i-1]);
                });

                await console.log("\n 3rd stage -> ", goLink.length, '/', i, "th   Passed \n");

            } else if (baseUrl === "https://swsg.co/en/"){

                sCategory = "div.breadcrumbs > div.container > ul.items > li.item";
                let productDescription = '';
                let categoryList = '';

                await $(sCategory).each(function( ) {
                    let sTag = $(this).attr('class');
                    let sAdding = $(this).text().trim();

                    if(sTag.includes('product') === true) {
                        productDescription = sAdding;
                    } else if(sTag.includes('category') === true) {
                        categoryList += sAdding + '/';
                    }
                });

                if(categoryList === '') {
                    let pSlice = productDescription.replace(',', '').split(' ');

                    for (let k = 0; k < pSlice.length; k ++) {
                        categoryList += pSlice[k] + '/';
                    }
                }
                console.log("productDescription=", productDescription);
                console.log("categoryList=", categoryList);

                let productName = $("div.product-info-stock-sku > div:nth-child(4) > div").text().trim();

                if(productName === "") {
                    productName = $("div.product-info-main > div.product.attribute.overview > div.value").text().trim();
                    let m = productName.indexOf("Model");
                    productName = productName.slice(8, m).trim();
                }
                let productPrice = $("div.product-info-main > div.product-info-price > div:nth-child(3) > span.special-price > span.price-container > span.price-wrapper > span.price").text().trim().slice(3, );

                if(productPrice === "") {
                    productPrice = $("div.product-info-main > div.product-info-price > div:nth-child(3) > span.price-container > span.price-wrapper > span.price").text().trim().slice(3, );
                }
                console.log(productName, productPrice);

                await ScrapingProduct.updateOne({scraping_store_address: goLink[i-1]},
                    [{$set: {scraping_category: categoryList, scraping_name: productName,
                            scraping_description: productDescription, scraping_price: productPrice}}]).then(async () => {
                    console.log(i, "    ------> ", goLink[i-1]);
                });
            } else if (baseUrl === "https://redsea.com/en/"){
                console.log(i, " -> " , goLink[i - 1]);

                sCategory = "div.breadcrumbs > ul.items > li.item";
                let categoryList = '';
                await $(sCategory).each(function( ) {
                    let sTag = $(this).attr('class');
                    let sAdding = $(this).text().trim();

                    if(sTag.includes('category') === true) {
                        categoryList += sAdding + '/';
                        categoryList = categoryList.replace(' & ', '/');
                    }
                });

                let sPage = "#amasty-shopby-product-list > div:nth-child(3) > div.pages > ul.pages-items > li:nth-last-child(2) > a > span:nth-child(2)";
                console.log("pages -> ", await $(sPage).text().trim());
                let nPage = await $(sPage).text().trim();
                let pLink = goLink[i-1].slice(0, goLink[i-1].length - 23);

                let linkArray = [];
                linkArray.push(goLink[i-1]);
                if(nPage !== "undefined") {
                    for(let t = 2; t <= nPage; t ++) {
                        let sCon = pLink + "?p=" + t.toString() + "&product_list_mode=list";
                        linkArray.push(sCon);
                    }
                } else {
                    nPage = 1;
                }

                let productItem = "div.products-list > ol.product-items > li.product-item > div.product-item-info";
                for(let t = 0; t < nPage; t ++) {
                    const result = await axios.get(linkArray[t]);
                    let $ = await cheerio.load(result.data);
                    let nCount = 0;
                    
                    await $(productItem).each(function( ) {
                        nCount ++;
                        let sTag = $(this).find("div.product-wrap-shadow > a").attr("href");
                        let sPhoto = $(this).find("div.product-wrap-shadow > a > span > span > img").attr("src");
                        let sName = $(this).find("div.product-item-details > strong > a").text().trim();
                        let sDescription = $(this).find("div.product-item-details > div").text().trim();
                        let sPrice = $(this).find("div.price-more > div > span:nth-child(1) > span > span").text().trim();
                        sPrice = sPrice.replace("Special Price", "").replace(",", "").replace("SR", "").replace(" ", "").slice(1, );

                        mLen = goLink.length;
                        goLink.push(sTag);
                        goLink = [...new Set(goLink)];

                        if (mLen < goLink.length) {
                            const scraping_Product = new Filter({
                                scraping_id: i.toString() + "-" + (t + 1).toString() + "-" + nCount.toString(),
                                scraping_store_address: sTag,
                                scraping_photo_link: sPhoto,
                                scraping_category: categoryList,
                                scraping_name: sName,
                                scraping_description: sDescription,
                                scraping_price: sPrice,
                            });
                            
                            scraping_Product.save();  
                            
                            console.log("********    ", i, "   **************   ", t + 1, "    ********************   ", nCount, "   *************");
                            console.log("*************************************************************************************");
                            console.log("        Link = ", sTag);
                            console.log("      sPhoto = ", sPhoto);
                            console.log("categoryList = ", categoryList);
                            console.log("       sName = ", sName);
                            console.log("sDescription = ", sDescription);
                            console.log("      sPrice = ", sPrice);
                        }   
                        
                    });
                }
            } else if (baseUrl === "https://www.extra.com/en-sa/"){
                console.log(i, " ------> " , goLink[i - 1]);
                let categoryList = '';
                let linkArray = [];
                linkArray.push(goLink[i-1]);
                nPage = 1;
                console.log(linkArray);

                let productItem = "div.js-product-tile > div > a";
                for(let t = 0; t < nPage; t ++) {

                    const result = await axios.get(linkArray[t]);
                    let $ = await cheerio.load(result.data);
                    let nCount = 0;

                    await $(productItem).each(function( ) {
                        nCount ++;
                        let sTag = $(this).attr("href");
                        let addressLink = "https://www.extra.com" + sTag;

                        sTag = sTag.replace("/en-sa/", "");
                        let sLen = sTag.indexOf("/p/");
                        sTag = sTag.slice(0, sLen).split("/");
                        categoryList = "";
                        for(let j = 0; j < sTag.length - 1; j ++) {
                            categoryList += sTag[j].replace('-', '/').replace("and-/", '/') + "/";
                        }
                        categoryList = categoryList.replace("home/", '').replace("-/", '/').replace('-', '/').replace("//", "/");

                        let sPhoto = $(this).find("div.item-middle > div.item-middle-left > div > div.image-container > picture > img").attr("src");
                        let sName = $(this).find("div.item-middle > div.item-middle-right > div > div.center-content > div.title").text().trim();
                        let sDescription = $(this).find("div.item-middle > div.item-middle-right > div > div.center-content > div.hide-for-mobile-only > ul > li").text().trim();
                        let sPrice = "";
                        sPrice = $(this).find("div.item-middle > div.item-middle-right > div > div.right-content > div.c_product-price > div.c_product-price-prices > div.c_product-price-current").text().trim();

                        if(sPrice === "") {
                            sPrice = $(this).find("div.item-middle > div.item-middle-right > div > div.right-content > div.c_product-price > div.c_product-price-current").text().trim();
                        }

                        sPrice = sPrice.replace("SR", "").trim();

                        console.log("********    ", i, "   **************   ", t + 1, "    ********************   ", nCount, "   *************");
                        console.log("Address Link = ", addressLink);
                        console.log("  Photo Link = ", sPhoto);
                        console.log("categoryList = ", categoryList);
                        console.log("        Name = ", sName);
                        console.log(" Description = ", sDescription);
                        console.log("       Price = ", sPrice, "\n\n");

                        mLen = goLink.length;
                        goLink.push(sTag);
                        goLink = [...new Set(goLink)];

                        if (mLen < goLink.length) {
                            const scraping_Product = new Filter({
                                scraping_id: i.toString() + "-" + (t + 1).toString() + "-" + nCount.toString(),
                                scraping_store_address: addressLink,
                                scraping_photo_link: sPhoto,
                                scraping_category: categoryList,
                                scraping_name: sName,
                                scraping_description: sDescription,
                                scraping_price: sPrice,
                            });
                            scraping_Product.save();
                        }
                    });
                }
            } else if (baseUrl === "https://blackbox.com.sa/en/"){

                console.log(i, " ------> " , goLink[i - 1]);
                let categoryList = '';
                sCategory = "div.breadcrumbs > div.container > ul.items > li.item";
                await $(sCategory).each(function( ) {
                    let sTag = $(this).attr('class');
                    let sAdding = $(this).text().trim();

                    if(sTag.includes('category') === true) {
                        categoryList += sAdding + '/';
                    }
                });

                categoryList = categoryList.slice(0, categoryList.length - 2);

                let sPage = "#amasty-shopby-product-list > div.toolbar-top > div.toolbar-products > #am-page-count";
                let nPage = await $(sPage).text();

                let linkArray = [];
                linkArray.push(goLink[i-1]);
                if(nPage.length !== 0) {
                    for(let t = 2; t <= nPage; t ++) {
                        let sT = "&p=" + t.toString();
                        let sCon = goLink[i-1] + sT;
                        linkArray.push(sCon);
                    }
                } else {
                    nPage = 1;
                }
                console.log(linkArray);

                let productItem = "ol > li.product-item > div.product-item-info > div.item-inner";
                for(let t = 0; t < nPage; t ++) {
                    const result = await axios.get(linkArray[t]);
                    let $ = await cheerio.load(result.data);
                    let nCount = 0;

                    await $(productItem).each(function( ) {
                        nCount ++;
                        let addressLink = $(this).find("div.box-image-list > a").attr("href");
                        let sPhoto = $(this).find("div.box-image-list > a > span > span > img").attr("src");
                        let sName = $(this).find("div.product-item-details > h3").text().trim();
                        let sDescription = $(this).find("div.product-item-inner > div > ul > li").text().trim();

                        if(sDescription === "") {
                            sDescription = $(this).find("div.product-item-details > div.product-item-inner > div > p").text().trim();
                            sDescription = sDescription.replace("•", ", ");
                        }

                        sDescription = sDescription.replace("Model", ", Model").replace("Size", ", Size").replace("Type", ", Type").replace("Color", ", Color");

                        let sPrice = "";
                        sPrice = $(this).find("div.price-box > span.special-price > span.price-container > span > span.price").text().trim();

                        if(sPrice === "") {
                            sPrice = $(this).find("div.product-item-details > div.price-box > span.price-container > span > span.price").text().trim();
                        }
                        sPrice = sPrice.replace("SAR", "").trim();
                        sPrice = sPrice.replace(",", "").trim();

                        console.log("********    ", i, "   **************   ", t + 1, "    *******************   ", nCount, "   *************");
                        console.log(" Address Link = ", addressLink);
                        console.log("   Photo Link = ", sPhoto);
                        console.log(" categoryList = ", categoryList);
                        console.log("         Name = ", sName);
                        console.log("  Description = ", sDescription);
                        console.log("        Price = ", sPrice, "\n\n");

                        mLen = goLink.length;
                        goLink.push(addressLink);
                        goLink = [...new Set(goLink)];

                        if (mLen < goLink.length) {
                            const scraping_Product = new Filter({
                                scraping_id: i.toString() + "-" + (t + 1).toString() + "-" + nCount.toString(),
                                scraping_store_address: addressLink,
                                scraping_photo_link: sPhoto,
                                scraping_category: categoryList,
                                scraping_name: sName,
                                scraping_description: sDescription,
                                scraping_price: sPrice,
                            });

                            scraping_Product.save();
                        }
                    });
                }

                /**
                 * 6th Site Scraping
                 */
            } else if (baseUrl === "https://www.virginmegastore.sa/en/"){
                console.log(i, " ------> " , goLink[i - 1]);
                let categoryList = '';
                let linkArray = [];
                linkArray.push(goLink[i-1]);

                sCategory = "div.breadcrumb-list > div.breadcrumb-list__item";
                await $(sCategory).each(function( ) {
                    let sAdding = $(this).text().trim().replace(" & ", "/").replace(" + ", "/").replace(" ", "/").replace("Home", "");
                    if(sAdding !== ""){
                        categoryList += sAdding + '/';
                    }
                });
                categoryList = categoryList.slice(0, categoryList.length - 2);

                let sPage = "ul.pagination-wrapper > li:nth-last-child(2)";
                let nPage = await $(sPage).text();
                let nP = 0;

                let nProducts = $("div.product-list__top-bar > div.count").text().trim();
                nProducts = nProducts.slice(0, nProducts.search("Products") - 1).trim().replace(",", "");
                console.log(nProducts);

                if(nPage.length !== 0) {
                    for(let t = 1; t < nProducts/100 ; t ++) {
                        let sT = "?q=:page=1&page=" + t.toString();
                        let nPos = goLink[i - 1].search('/c/K') + 10;
                        let sCon = goLink[i-1].slice(0, nPos) + sT;
                        linkArray.push(sCon);
                        nP ++;
                    }
                } else {
                    nPage = 1;
                }
                console.log(linkArray);

                let productItem = "ul.product-list__item-wrapper > li.product-list__item";
                for(let t = 0; t < nProducts/100; t ++) {

                    const result = await axios.get(linkArray[t]);
                    let $ = await cheerio.load(result.data);
                    let nCount = 0;

                    await $(productItem).each(function( ) {
                        nCount ++;
                        let sTag = $(this).find("a").attr("href");
                        let addressLink = "https://www.virginmegastore.sa" + sTag;

                        let sPhoto = "https://www.virginmegastore.sa" + $(this).find("a > img").attr("src");
                        let sName = $(this).find("div.product-list__details > div.product-list__brand > span").text().trim();
                        let sDescription = $(this).find("div.product-list__details > a.product-list__name").text().trim();
                        let sPrice = "";
                        sPrice = $(this).find("div.product-list__price-container > div:nth-child(1) > span.price__number").text().trim().replace(",", "");

                        console.log("********    ", i, "   ***************   ", t + 1, "    ********************   ", nCount, "   *************");
                        console.log(" Address Link = ", addressLink);
                        console.log("   Photo Link = ", sPhoto);
                        console.log(" categoryList = ", categoryList);
                        console.log("         Name = ", sName);
                        console.log("  Description = ", sDescription);
                        console.log("        Price = ", sPrice, "\n\n");

                        mLen = goLink.length;
                        goLink.push(addressLink);
                        goLink = [...new Set(goLink)];

                        if (mLen < goLink.length) {
                            const scraping_Product = new Filter({
                                scraping_id: i.toString() + "-" + (t + 1).toString() + "-" + nCount.toString(),
                                scraping_store_address: addressLink,
                                scraping_photo_link: sPhoto,
                                scraping_category: categoryList,
                                scraping_name: sName,
                                scraping_description: sDescription,
                                scraping_price: sPrice,
                            });
                            scraping_Product.save();
                        }
                    });
                }
            } else if (baseUrl === "https://www.samma3a.com/saudi-en/"){
                console.log(i, " -----> " , goLink[i - 1]);
                let categoryList = '';
                let linkArray = [];
                linkArray.push(goLink[i-1]);

                sCategory = "div.breadcrumbs > ul.items > li.item";
                let sName = "";
                await $(sCategory).each(function( ) {
                    let sTag = $(this).attr('class');
                    sName = $(this).text().trim();
                    let sAdding = sName.replace(" ", "/");

                    if(sTag.includes("category") === true){
                        categoryList += sAdding + '/';
                    }
                });
                categoryList = categoryList.slice(0, categoryList.length - 1);

                let sPage = "#layer-product-list > div:nth-child(1) > div.pages > ul.pages-items > li:nth-last-child(2) > a";
                let nPage = await $(sPage).text().replace("Page", "").trim();
                console.log("nPage = ", nPage);

                if(nPage.length !== 0) {
                    for(let t = 1; t < nPage ; t ++) {
                        let sT = "?p=" + (t + 1).toString();
                        let sCon = goLink[i-1] + sT;
                        linkArray.push(sCon);
                    }
                } else {
                    nPage = 1;
                }
                console.log(linkArray);

                let productItem = "div.products-grid > ol.product-items > li.product-item > div.product-item-info";
                for(let t = 0; t < nPage; t ++) {

                    const result = await axios.get(linkArray[t]);
                    let $ = await cheerio.load(result.data);
                    let nCount = 0;

                    await $(productItem).each(function( ) {
                        nCount ++;
                        let addressLink = $(this).find("div.product-item-photo > a").attr("href");

                        let sPhoto = $(this).find("div.product-item-photo > a > img").attr("src");
                        // let sName = $(this).find("div.product-list__details > div.product-list__brand > span").text().trim();
                        let sDescription = $(this).find("div.product-item-details > strong.product-item-name > a").text().trim();
                        let sPrice = "";
                        sPrice = $(this).find("div.product-item-details > div.price-final_price > span > span.price-wrapper> span.price").text().trim().replace(",", "").replace("SAR", "").replace("AED", "");

                        if(sPrice === "") {
                            sPrice = $(this).find("div.product-item-details > div.price-final_price > span.special-price > span.price-final_price > span.price-wrapper> span.price").text().trim().replace(",", "").replace("SAR", "").replace("AED", "");
                        }

                        console.log(" ********    ", i, "   ***************   ", t + 1, "    ********************   ", nCount, "   *************");
                        console.log(" Address Link = ", addressLink);
                        console.log("   Photo Link = ", sPhoto);
                        console.log(" categoryList = ", categoryList);
                        console.log("         Name = ", sName);
                        console.log("  Description = ", sDescription);
                        console.log("        Price = ", sPrice, "\n\n");

                        mLen = goLink.length;
                        goLink.push(addressLink);
                        goLink = [...new Set(goLink)];

                        if (mLen < goLink.length) {
                            const scraping_Product = new Filter({
                                scraping_id: i.toString() + "-" + (t + 1).toString() + "-" + nCount.toString(),
                                scraping_store_address: addressLink,
                                scraping_photo_link: sPhoto,
                                scraping_category: categoryList,
                                scraping_name: sName,
                                scraping_description: sDescription,
                                scraping_price: sPrice,
                            });
                            scraping_Product.save();
                        }
                    });
                }

                /**
                 * 8th Site Scraping
                 */
            } else if (baseUrl === "https://www.jarir.com/sa-en/"){
                console.log(i, " -----> " , goLink[i - 1]);
                let categoryList = '';
                let linkArray = [];
                linkArray.push(goLink[i-1]);

                sCategory = "ul.breadcrumbs > li";
                let sName = "";
                await $(sCategory).each(function() {
                    let sTag = $(this).attr('class');
                    sName = $(this).text().trim();
                    let sAdding = sName.replace(" ", "/").replace(" & ", "/");

                    if(sTag.includes("category") === true){
                        categoryList += sAdding + '/';
                    }
                });
                categoryList = categoryList.slice(0, categoryList.length - 1);
                console.log("categoryList = ", categoryList);

                require('chromedriver');
                const webdriver = require('selenium-webdriver');
                let By = webdriver.By;
                let until = webdriver.until;
                const driver = new webdriver.Builder()
                    .forBrowser('chrome')
                    .build();

                await driver.get(goLink[i - 1]);
                let sNumber = await driver.findElement(By.id("amshopby-page-container"));

                sNumber.click();

                console.log("sNumber = ", sNumber.length);

                await driver.quit();

                // let sPage = "#layer-product-list > div:nth-child(1) > div.pages > ul.pages-items > li:nth-last-child(2) > a";
                // let nPage = await $(sPage).text().replace("Page", "").trim();
                // console.log("nPage = ", nPage);
                //
                // if(nPage.length !== 0) {
                //     for(let t = 1; t < nPage ; t ++) {
                //         let sT = "?p=" + (t + 1).toString();
                //         let sCon = goLink[i-1] + sT;
                //         linkArray.push(sCon);
                //     }
                // } else {
                let nPage = 1;
                // }
                // console.log(linkArray);
                //
                let productItem = "div.category-products > ul.products-grid > li.item";
                for(let t = 0; t < nPage; t ++) {

                    const result = await axios.get(linkArray[t]);
                    let $ = await cheerio.load(result.data);
                    let nCount = 0;

                    await $(productItem).each(function( ) {
                        nCount ++;
                        let addressLink = $(this).find("a").attr("href");

                        let sPhoto = $(this).find("a > img").attr("data-src");
                        //let sName = $(this).find("div.product-list__details > div.product-list__brand > span").text().trim();
                        let sDescription = $(this).find("div.product-info > h3.product-name").text().trim();
                        let sPrice = "";
                        sPrice = $(this).find("div.product-info > div.price-box > div.price-box__row > div > div.price").text().trim().replace(",", "").replace("SR", "");

                        // if(sPrice === "") {
                        //     sPrice = $(this).find("div.product-item-details > div.price-final_price > span.special-price > span.price-final_price > span.price-wrapper> span.price").text().trim().replace(",", "").replace("SAR", "").replace("AED", "");
                        // }

                        console.log(" ********    ", i, "   ***************   ", t + 1, "    ********************   ", nCount, "   *************");
                        console.log(" Address Link = ", addressLink);
                        console.log("   Photo Link = ", sPhoto);
                        console.log(" categoryList = ", categoryList);
                        console.log("         Name = ", sName);
                        console.log("  Description = ", sDescription);
                        console.log("        Price = ", sPrice, "\n\n");

                        mLen = goLink.length;
                        goLink.push(addressLink);
                        goLink = [...new Set(goLink)];

                        if (mLen < goLink.length) {
                            const scraping_Product = new Filter({
                                scraping_id: i.toString() + "-" + (t + 1).toString() + "-" + nCount.toString(),
                                scraping_store_address: addressLink,
                                scraping_photo_link: sPhoto,
                                scraping_category: categoryList,
                                scraping_name: sName,
                                scraping_description: sDescription,
                                scraping_price: sPrice,
                            });
                            scraping_Product.save();
                        }
                     });
                }
            }
        } catch (error) {
            if(error.response === undefined) {
                console.log('3rd stage -> ', error.name);
            }
        }
    }
}

/**
 * Inserting the scraping results to the real DB
 * @param pDbName
 * @returns {Promise<void>}
 */
async function shownData(pDbName) {
    let regLink = new RegExp('.+');

    await pDbName.find({
        scraping_photo_link: {$regex: regLink},
        scraping_name: {$regex: regLink},
        scraping_category: {$regex: regLink},
    }).then( scrapingItems =>  {
        if(scrapingItems){

            for (let i = 0; i < scrapingItems.length; i ++)
            {
                const scraping_Product = new Filter({
                    scraping_id: scrapingItems[i].scraping_id,
                    scraping_store_address: scrapingItems[i].scraping_store_address,
                    scraping_photo_link: scrapingItems[i].scraping_photo_link,
                    scraping_category: scrapingItems[i].scraping_category,
                    scraping_name: scrapingItems[i].scraping_name,
                    scraping_description: scrapingItems[i].scraping_description,
                    scraping_price: scrapingItems[i].scraping_price,
                    scraping_thumbnail_Link: scrapingItems[i].scraping_thumbnail_Link,
                });

                scraping_Product.save();
                console.log(i + 1, "  -> ");
            }
        } else {
            return res.status(400).json({msg: "The products don't exist at all !"});
        }
    });

    await console.log("Adding to the real DB !!!");
}

/**
 * Initailize of the database
 * @param pStage
 * @returns {Promise<*>}
 */
async function initializeSimpleDB(pStage) {
    if (pStage === 0) { // starting from the first
        const scraping_Product = await new ScrapingProduct({
            scraping_id: 1,
            scraping_store_address: baseUrl,
        });

        await scraping_Product.collection.deleteMany({});

        goLink = [];
        goLink[0] = baseUrl;

        const scraping_ProductOne = await new ScrapingProduct({
            scraping_id: 1,
            scraping_store_address: baseUrl,
        });
        m = 0;

        await scraping_ProductOne.save();

        await console.log( " === +++++++ === Total/Start -> ", await ScrapingProduct.countDocuments(), '/', m + 1, 'th');

    } else {
        return res.status(200).json("Conflict of the condition");
    }
}

/**
 * Getting CategoryName and Link
 * @param firstStr
 * @param baseUrl
 * @returns {Promise<number>}
 */
async function gettingFinalLink(iM, matchStr, bUrl) {
    if(baseUrl === "https://swsg.co/en/") {
        try {
            const result = await axios.get(bUrl);
            let $ = await cheerio.load(result.data);
    
            const aTags = $(matchStr);
            let photoLink = '';
    
            for(let kk = 0; kk < aTags.length; kk++) {
    
                let aStr = await aTags[kk]['attribs']['href'];
                if(middleStage === true) {
                    try {
                        //photoLink = await aTags[kk].find("span.product-image-wrapper > img").attr('data-src');
                        //console.log("*****************", await sLinks[kk]['attribs']['data-src']);
                        photoLink = await $(aTags[kk]).find('span.product-image-wrapper > img').attr('data-src');
                    } catch (e) {
                        console.log(e);
                    }
                }
    
                try {
                    if ((aStr !== undefined) && (aStr.includes(baseUrl) === true) && (aStr.slice(aStr.length - 13, ).includes("#review") === false)) {
                        mLen = goLink.length;
                        goLink.push(aStr);
                        goLink = [...new Set(goLink)];
    
                        if(mLen < goLink.length) {
                            if(middleStage === true) {
                                const scraping_Product = new ScrapingProduct({
                                    scraping_id: goLink.length,
                                    scraping_store_address: goLink[goLink.length - 1],
                                    scraping_photo_link: photoLink,
                                });
                                await scraping_Product.save();
                            } else {
                                const scraping_Product = new ScrapingProduct({
                                    scraping_id: goLink.length,
                                    scraping_store_address: goLink[goLink.length - 1],
                                });
                                await scraping_Product.save();
                            }
    
                            console.log(goLink.length, ' -> ', aStr, '\n');
                            console.log('LINK =====', photoLink);
                        }
                    }
    
                } catch (e) {}
            }
    
            if((aTags.length === 0) && (middleStage === true)){
                photoLink = await $(this).find('div.fotorama__stage__shaft > div.fotorama__stage__frame > img').attr('data-src');
                if(photoLink !== undefined) {
                    goLink.push(bUrl);
                    console.log("LINK = ", photoLink);
                    const scraping_Product = new ScrapingProduct({
                        scraping_id: goLink.length,
                        scraping_store_address: goLink[goLink.length - 1],
                        scraping_photo_link: photoLink,
                    });
    
                    await scraping_Product.save();
                    console.log(goLink.length, ' -> ', bUrl, '\n');
                }
            }
        } catch (error) {
            await sleep(1500);
            return 0;
        }
    } else if (baseUrl === "https://redsea.com/en/") {
        try {
            const result = await axios.get(bUrl);
            let $ = await cheerio.load(result.data);
    
            const aTags = $(matchStr);
    
            for(let kk = 0; kk < aTags.length; kk++) {
    
                let aStr = await aTags[kk]['attribs']['href'];
                aStr += "?product_list_mode=list";
    
                try {
                    if ((aStr !== undefined) && (aStr.includes(baseUrl) === true) && (aStr.includes(".html") === true)) {
                        mLen = goLink.length;
                        goLink.push(aStr);
                        goLink = [...new Set(goLink)];
    
                        if(mLen < goLink.length) {

                            const scraping_Product = new ScrapingProduct({
                                scraping_id: goLink.length,
                                scraping_store_address: goLink[goLink.length - 1],
                            });
                            await scraping_Product.save();                            
    
                            console.log(goLink.length, ' -> ', aStr, '\n');
                        }
                    }
    
                } catch (e) {}
            }
        } catch (error) {
            await sleep(1500);
            return 0;
        }
    } else if (baseUrl === "https://www.extra.com/en-sa/") {
        try {
            const result = await axios.get(bUrl);
            let $ = await cheerio.load(result.data);

            const aTags = $(matchStr);           

            for(let kk = 0; kk < aTags.length; kk++) {
    
                let aStr = await aTags[kk]['attribs']['href'];    
    
                try {
                    // if ((aStr !== undefined) && (aStr.includes(baseUrl) === true) && (aStr.includes(".html") === true)) {
                    if ((aStr !== undefined) && (aStr.includes("/en-sa/") === true)) {
                        mLen = goLink.length;
                        goLink.push("https://www.extra.com" + aStr);
                        goLink = [...new Set(goLink)];
    
                        if(mLen < goLink.length) {

                            const scraping_Product = new ScrapingProduct({
                                scraping_id: goLink.length,
                                scraping_store_address: goLink[goLink.length - 1],
                            });
                            await scraping_Product.save();                            
    
                            console.log(goLink.length, ' -> ', aStr, '\n');
                        }
                    }
    
                } catch (e) {}
            }
        } catch (error) {
            await sleep(1500);
            return 0;
        }
    } else if (baseUrl === "https://blackbox.com.sa/en/") {
        try {
            const result = await axios.get(bUrl);
            let $ = await cheerio.load(result.data);

            const aTags = $(matchStr);

            for(let kk = 0; kk < aTags.length; kk++) {

                let aStr = await aTags[kk]['attribs']['href'];

                try {
                    // if ((aStr !== undefined) && (aStr.includes(baseUrl) === true) && (aStr.includes(".html") === true)) {
                    if ((aStr !== undefined) && (aStr.includes(".html#review") === false)) {
                        mLen = goLink.length;
                        if((middleStage === true) && (aStr.includes(".html") === true)) {
                            aStr = aStr + "?product_list_mode=list";
                        }

                        goLink.push(aStr);

                        goLink = [...new Set(goLink)];

                        if(mLen < goLink.length) {

                            const scraping_Product = new ScrapingProduct({
                                scraping_id: goLink.length,
                                scraping_store_address: goLink[goLink.length - 1],
                            });
                            await scraping_Product.save();

                            console.log(goLink.length, ' -> ', aStr, '\n');
                        }
                    }

                } catch (e) {}
            }
        } catch (error) {
            await sleep(1500);
            return 0;
        }

        /**
         * 6th Site Scraping
         */
    } else if (baseUrl === "https://www.virginmegastore.sa/en/") {
        try {
            const result = await axios.get(bUrl);
            let $ = await cheerio.load(result.data);

            const aTags = $(matchStr);

            for(let kk = 0; kk < aTags.length; kk++) {
                let aStr = await aTags[kk]['attribs']['href'];
                try {
                    if ((aStr !== undefined) && (aStr.includes("http") === false) && (aStr.includes("/") === true)) {
                        mLen = goLink.length;

                        aStr = "https://www.virginmegastore.sa" + aStr;

                        goLink.push(aStr);
                        goLink = [...new Set(goLink)];

                        if(mLen < goLink.length) {

                            const scraping_Product = new ScrapingProduct({
                                scraping_id: goLink.length,
                                scraping_store_address: goLink[goLink.length - 1],
                            });
                            await scraping_Product.save();

                            console.log(goLink.length, ' -> ', aStr, '\n');
                        }
                    }

                } catch (e) {}
            }
        } catch (error) {
            await sleep(1500);
            return 0;
        }
        /**
         * 7th Site Scraping
         */
    } else if (baseUrl === "https://www.samma3a.com/saudi-en/") {
        try {
            const result = await axios.get(bUrl);
            let $ = await cheerio.load(result.data);

            const aTags = $(matchStr);
            console.log(aTags.length);

            for(let kk = 0; kk < aTags.length; kk++) {
                let aStr = await aTags[kk]['attribs']['href'];
                try {
                    if ((aStr !== undefined) && (aStr.includes(".html") === true) && (aStr.includes("samma3a") === true)) {
                        mLen = goLink.length;

                        goLink.push(aStr);
                        goLink = [...new Set(goLink)];

                        if(mLen < goLink.length) {

                            const scraping_Product = new ScrapingProduct({
                                scraping_id: goLink.length,
                                scraping_store_address: goLink[goLink.length - 1],
                            });
                            await scraping_Product.save();

                            console.log(goLink.length, ' -> ', aStr, '\n');
                        }
                    }

                } catch (e) {}
            }
        } catch (error) {
            await sleep(1500);
            return 0;
        }

        /**
         * 8th Site Scraping
         */
    } else if (baseUrl === "https://www.jarir.com/sa-en/") {
        try {
            const result = await axios.get(bUrl);
            let $ = await cheerio.load(result.data);

            const aTags = $(matchStr);
            console.log(aTags.length);

            for(let kk = 0; kk < aTags.length; kk++) {
                let aStr = await aTags[kk]['attribs']['href'];
                try {
                    if ((aStr !== undefined) && (aStr.includes(".html") === true) && (aStr.includes("jarir.com") === true)) {
                        mLen = goLink.length;

                        goLink.push(aStr);
                        goLink = [...new Set(goLink)];

                        if(mLen < goLink.length) {

                            const scraping_Product = new ScrapingProduct({
                                scraping_id: goLink.length,
                                scraping_store_address: goLink[goLink.length - 1],
                            });
                            await scraping_Product.save();

                            console.log(goLink.length, ' -> ', aStr, '\n');
                        }
                    }

                } catch (e) {}
            }
        } catch (error) {
            await sleep(1500);
            return 0;
        }
    }
}

function sleep(milliseconds) {
    let timeStart = new Date().getTime();
    while (true) {
        let elapsedTime = new Date().getTime() - timeStart;
        if (elapsedTime > milliseconds) {
            break;
        }
    }
}

const sleep_Time = milliseconds => {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
};
