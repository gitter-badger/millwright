const path = require('path');
const _ = require('lodash');
const promisify = require('promisify-node');
const fs = promisify(require('fs-extra'));

module.exports = function read(file) {
  return fs.readFile(file.src).then(result => {
    return _.assign(file, {content: result.toString()});
  });
};
