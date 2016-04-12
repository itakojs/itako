Itako
---

<p align="right">
  <a href="https://npmjs.org/package/itako">
    <img src="https://img.shields.io/npm/v/itako.svg?style=flat-square">
  </a>
  <a href="https://travis-ci.org/itakojs/itako">
    <img src="http://img.shields.io/travis/itakojs/itako.svg?style=flat-square">
  </a>
  <a href="https://ci.appveyor.com/project/itakojs/itako">
    <img src="https://img.shields.io/appveyor/ci/itakojs/itako.svg?style=flat-square">
  </a>
  <a href="https://codeclimate.com/github/itakojs/itako/coverage">
    <img src="https://img.shields.io/codeclimate/github/itakojs/itako.svg?style=flat-square">
  </a>
  <a href="https://codeclimate.com/github/itakojs/itako">
    <img src="https://img.shields.io/codeclimate/coverage/github/itakojs/itako.svg?style=flat-square">
  </a>
  <a href="https://gemnasium.com/itakojs/itako">
    <img src="https://img.shields.io/gemnasium/itakojs/itako.svg?style=flat-square">
  </a>
</p>

Installation
---
```bash
npm install itako --save
```

Stacktrace was broken
---
```bash
node
> require('itako')('error')
# TypeError: Cannot convert undefined or null to object
# at f (/Users/itakojs/itako/lib/index.js:1:2469)
```
published code is compressed and the source map is provided.
not supported by the sourcemap in NodeJS. but this resolved in the [node-source-map-support](https://github.com/evanw/node-source-map-support#readme).

```bash
npm install source-map-support --save-dev
```
```js
import 'source-map-support/register';
```
or...
```bash
$ mocha --require source-map-support/register
```

Development
---
Requirement global
* NodeJS v5.10.0
* Npm v3.8.3

```bash
git clone https://github.com/itakojs/itako
cd itako
npm install

npm test
```

License
---
[MIT](http://59naga.mit-license.org/)
