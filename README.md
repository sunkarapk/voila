# voila

Best asset manager one can get in nodejs - at least we hope so :-)

Why does voila exist? We needed a package manager that is optimized for runtime in a way that major processing occurs before deployment,
not during app launch, similar to the asset pipeline in ruby on rails and to support CDNs wth the node.js as origin for assets. This meant primarily using a manifest.json file that
contains mappings between images and md5 extended file names. Under the hood we use the great mincer module (http://nodeca.github.com/mincer/) by nodeca,
who did the heavy lifting.

Voila is the brainchild of Pavan Kumar Sunkara (https://github.com/pksunkara)

## Installation

```
npm install voila
```

## Usage

In your connect/express application

```
voila = require 'voila'
...


confDevelopment = {}
confTest = confProduction =  
    "serve": "http://assets.yoursite.com/assets"


@app.use '/assets', voila(__dirname + '/../', confProduction) # Select the right environment, or use nconf

```
That pretty much sets up the pipeline. There are a couple of assumptions:

/assets contains your assets in subfolders img,css,js
/public/assets will be created/updated in a prepublish step

In your package json add the following:
```
  "scripts": {
    ...
    "assets": "rm -rf public/assets/* && voila -p http://assets.yoursite.com/assets",
   }
```
This script should be activated before you publish to production, like so: npm run-script assets. It creates the preprocessed files in /public/assets

