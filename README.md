# voila

best asset manager one can get in nodejs (at least we hope so)

## Why does voila exist?

We needed an asset manager which meets the following condition:

* Optimized for runtime such that major processing occurs before deployment, not during app launch.
* Support CDNs wth the node.js server as origin for assets with md5 extended asset names.
* Process all major engines like coffee, stylus, less, ejs etc..
* Provide a helper for asset path which doesn't suck

Under the hood we use [mincer](http://nodeca.github.com/mincer) which did the heavy lifting.

Voila is the brainchild of [Pavan Kumar Sunkara](https://github.com/pksunkara)

## Installation

Go to you app root directory and run

```
npm install --save voila
```

## Usage

In your connect/express application

```js
var express = require('express')
  , voila = require('voila')
  , app = expres();

var conf = {
  development: {},
  production: {
    serve: "http://assets.yoursite.com/assets"
  }
}

app.use('/assets', voila(__dirname + '/../', conf[process.env.NODE_ENV])
```

That pretty much sets up the pipeline. Defaul directory structure is as follows

```
app
├─┬ assets
│ ├── css
│ ├── js
│ └── img
└─┬ public
  └── assets
```

* `app/assets` should be ignored in `.npmignore` (which is generally used for nodejs deployment)
* `app/public/assets` should be ignored in `.gitignore` (which is used for committing to repo)

In your package json add the following:

```js
"scripts": {
  "assets": "rm -rf public/assets/* && voila -p http://assets.yoursite.com/assets"
}
```

This script should be activated before you publish to production, `npm run-script assets`. It creates the preprocessed files in /public/assets

## License
MIT/X11

## Bug Reports
Report [here](http://github.com/scottyio/voila/issues).
