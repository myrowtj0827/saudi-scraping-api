const express = require("express");
const cors = require('cors');
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const {MONGO_URL, FRONT_URL} = require("./config");
const passport = require("passport");
const auth = require("./routes/auth");
const filters = require("./routes/filters");
const scrapingProduct = require("./routes/scrapingProduct");
const config = require("./config");

app.use(
	cors({
		origin: config.FRONT_URL,
	})
);

// Body-parser middleware
app.use(
	bodyParser.json({
		limit: '50mb',
	}));

// Connect to MongoDB
mongoose
	.connect(MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true})
	.then(() => console.log("MongoDB successfully connected"))
	.catch(err => console.log(err));

// Passport middleware
app.use(passport.initialize(null));

// Passport config
require("./utils/passport")(passport);


app.use("/api/pub", auth);
app.use("/api/filters", filters);
app.use("/api/scrapingProduct", scrapingProduct);

const port = process.env.PORT || 8050;
app.listen(port, () => console.log(`Server up and running on port ${port}!`));
