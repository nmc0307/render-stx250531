"use strict";

/* 
npm install express express-session passport passport-auth0 axios dotenv node-fetch

node index.js OR npm start

git add .
git commit -m "Add newfile.txt"
git push origin main   //main:브랜치명

*/

/*
 * Do not commit your client ID, secret, or domain to your codebase. These
 * are here for the sake of convenience and should never be in your
 * version control system.
 * */
 
require('dotenv').config();
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;
const OPAQUE_STATE_VALUE = process.env.OPAQUE_STATE_VALUE;
const API_KEY = process.env.API_KEY
const ACCESS_TOKEN_12H = process.env.ACCESS_TOKEN_12H


/*
 * This callback URL is where you will be redirected to after you have
 * logged in. This is the URL you provided to StockX.
 * */

const CALLBACK_URL = "https://render-stx250531.onrender.com/callback";

/* This redirect URI is where you will be redirected to after the
 * authorization code exchange for the access token.
 * */

const REDIRECT_URI = "https://render-stx250531.onrender.com/callback";

/*
 * The unique identifier of the API your web app wants to access. This is provided by StockX.
*/
//const AUTH0_AUDIENCE = "urn:gateway.stockx.com";
const AUTH0_AUDIENCE = "gateway.stockx.com";

const GRANT_TYPE = "authorization_code";
const ACCESS_TOKEN_URL = `https://${AUTH0_DOMAIN}/oauth/token`;

const port = process.env.PORT || 4000 

const Auth0Strategy = require("passport-auth0");
const axios = require("axios");
const express = require("express");
const expressSession = require("express-session");
const passport = require("passport");

const session = {
    /*
     * This secret isn’t used by Auth0, but rather by the Express session.
     * It signs the session cookie ID.
     * */
    secret: process.env.SESSION_SECRET,
    cookie: {},
    resave: false,
    saveUninitialized: false,
};

const app = express();

app.use(expressSession(session));

const strategy = new Auth0Strategy(
    {
        domain: AUTH0_DOMAIN,
        clientID: AUTH0_CLIENT_ID,
        clientSecret: AUTH0_CLIENT_SECRET,
        callbackURL: CALLBACK_URL,
    },
    (_, __, ___, profile, done) => done(null, profile)
);

passport.use(strategy);
app.use(passport.initialize());
app.use(passport.session());

const router = express.Router();
const authMiddleware = passport.authenticate("auth0", { scope: "openid email profile", audience: AUTH0_AUDIENCE });

router.get("/login", authMiddleware, (_, res) => res.redirect("/"));

/*
 * This is where the magic happens. When Auth0 redirects you to the
 * callback, it does so with an authorization code. That authorization code
 * can be exchanged for an access token. The access token is what you will
 * use to gain access to StockX's public API.
 * */

router.get("/callback", async (req, res) => {
    try {
        const { data } = await axios.post(ACCESS_TOKEN_URL, {
            grant_type: GRANT_TYPE,
            client_id: AUTH0_CLIENT_ID,
            client_secret: AUTH0_CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            code: req.query.code,
        });

        return res.status(200).json(data);
    } catch (err) {
        return res.send(err.toString()).status(500);
    }
});

router.get("/hello", (_, res) => {
  res.send("hello").status(200);
});

/*
router.get("/", (_, res) =>
    res.send("Sample homepage. To login, navigate your browser to localhost:8000/login.").status(200)
);
*/

router.get("/", (_, res) =>
  res
    .status(200)
    .send(
      `Backend Endpoint Menu.
/hello : endpoint test, say 'hello'
/login : Get ACCESS_TOKEN_12H, then Must Update Env Variable in Render.com Dashboard
/stockx-search?query=xxx&pageNumber=1&pageSize=50 : StockX Catalog Query`
    )
);


/////////////////////////////////////////////////////////////////
//NMC, USAGE : /stockx-search?query=xxx&pageNumber=1&pageSize=50
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

router.get("/stockx-search", async (req, res) => {
  const { query, pageNumber, pageSize } = req.query;
  const params = new URLSearchParams({
    query: query || '',
    pageNumber: pageNumber || '1',
    pageSize: pageSize || '50'
  }).toString();

  try {
    const resp = await fetch(
      `https://api.stockx.com/v2/catalog/search?${params}`,
      {
        method: 'GET',
        headers: {
          'x-api-key': API_KEY,
          //Authorization: 'Bearer <YOUR_JWT_HERE>'
          Authorization: 'Bearer ' + ACCESS_TOKEN_12H
        }
      }
    );
    const data = await resp.text();
    res.send(data);
  } catch (err) {
    res.status(500).send(err.toString());
  }
});
/////////////////////////////////////////////////////////////////

app.use("/", router);


app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`);
});
