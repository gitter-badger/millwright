const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');

const configPath = path.join(process.cwd(), 'millwright.json');
const config = _.attemptSilent(fs.readJsonSync, configPath);

const defaults = {
  destBase: 'dest',
  serveRoot: 'dest',
  servePort: 8080,
  servePath: 'http://localhost:8080',
  defaultCommand: 'dev',
  templateIgnoredBasePaths: ['src', 'bower_components', 'node_modules'],
  wrapperPath: 'src/wrapper.mustache',
  wrapperDataPath: 'src/wrapper.json',
  partialsDir: 'src/partials',
  pagesDir: 'src/pages'
}

defaults.serveMsg = 'Millwright serving at ' + defaults.servePath + '...';

module.exports = _.assign(defaults, config);
