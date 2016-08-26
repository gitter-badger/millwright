const _ = require('./lib/util/lodash-extended');
const argv = require('yargs').argv;
const fs = require('fs-extra');
const path = require('path');
const http = require('http');
const open = require('open');
const ecstatic = require('ecstatic');
const contentful = require('contentful');

const configPath = path.join(process.cwd(), 'millwright.json');
const config = _.attemptSilent(fs.readJsonSync, configPath);

const cleanDirs = ['dest'];
const scriptsDir = path.join(__dirname, 'lib');
const contentfulKeys = _.get(config, 'contentful');
const serveRoot = 'dest';
const servePort = 8080;
const servePath = 'http://localhost:8080'
const serveMsg = 'Millwright serving at ' + servePath + '...';
const defaultCommand = 'dev';

const mill = {
  templateDeps: requireBuildScript('template-deps'),
  parseContent: requireBuildScript('parse-content'),
  pages: requireBuildScript('pages'),
  clean,
  make,
  build,
  dev,
  serve
};

const cmd = argv._[0];

module.exports = runMill;

function runMill(cmd) {
  if (!cmd) {
    mill[defaultCommand]();
  } else if (_.isString(cmd) && mill[cmd]) {
    mill[cmd]();
  } else if (_.isString(cmd)) {
    console.log('mill: "' + cmd + '" is not a recognized command.');
  }
}

function clean() {
  cleanDirs.forEach(dir => fs.removeSync(dir));
}

function dev() {
  make().then(() => mill.serve());
}

function build() {
  make(true);
}

function make(optimize) {
  mill.clean();
  if (contentfulKeys) {
    return contentful.createClient(contentfulKeys).getEntries().then(entries => {
      return mill.pages(_.assign(mill.templateDeps(optimize), mill.parseContent(entries.items)));
    });
  }
  return Promise.resolve(mill.pages(mill.templateDeps(optimize)));
}

function serve() {
  http.createServer(ecstatic(serveRoot)).listen(servePort);
  console.log(serveMsg);
  open(servePath);
}

function requireBuildScript(scriptName) {
  return require(path.resolve(scriptsDir, scriptName + '.js'));
}
