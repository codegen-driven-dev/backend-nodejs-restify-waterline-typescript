backend-nodejs-restify-waterline-typescript
===========================================

REST API backend written on Node.JS in TypeScript with restify and waterline


## Install prerequisites

  0. node & npm (tested with node v4 and npm v6.5.0 on Ubuntu 15.04 x64)
  1. Run: `npm install -g tsc typings`
  2. `cd` to directory you've cloned this repo into
  3. Run: `typings install`
  4. Run: `npm install`

## Compile+run app

    tsc
    node main.js

Or:

    npm start

## Miscellaneous

Clone [backend-nodejs-restify-waterline-typescript](https://github.com/codegen-driven-dev/backend-nodejs-restify-waterline-typescript) one dir above where this repo was cloned, then synchronise with:

    find -type f -not -name "*.ts" -and -not -path "./.git/*" -and -not -path "./node-modules/*" -and -not -name '*.map' -and -not -name 'package.json' -and -not -name '.gitignore' | cpio -pdamv ../backend-nodejs-restify-waterline-typescript-dist

### Cleanup compiled output

When not adding '*.js' to `.gitignore`, clean out compiled js with this GNU findutils solution:

    find -name '*.js.map' -type f -exec bash -c 'rm "${1}" "${1%????}"' bash {} \;

Or delete all '*.js' outside of `node_modules` with:

    find \( -name node_modules -prune \) -o -name '*.js' -type f -exec rm {} \;find \( -name node_modules -prune \) -o -name '*.js' -type f -exec rm {} \;

More complicated solution handling "foo.ts" & "foo.js" without "foo.js.map" coming at some point.
