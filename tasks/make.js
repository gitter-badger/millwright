const _ = require('lodash');
const path = require('path');
const promisify = require('promisify-node');
const fs = promisify(require('fs-extra'));
const clean = require('./clean');
const requireDir = require('require-dir');
const plugins = _.mapValues(requireDir('../plugins', {camelcase: true}), _.curry);
const cache = require('../utils/cache');
const config = require('../config');
const {getType, stripIgnoredBasePath, changeExt} = require('../utils/util');

module.exports = make;

function make(opts = {}) {

  const watch = process.env.watch;
  const task = process.env.task || 'make';
  const watchFiles = {};

  // 1. Walk src
  // 2. Get path for each file (ignore active asset files)
  // 3. Normalize each filename to an object describing the file
  // 4. Cache the objects in a flat array
  // 5. Read the relevant json (only those with same-named template sibling)
  // 6. While reading in the json objects, iterate over the files properties
  // 7. Repeat steps 3 & 4 for each asset in the files properties
  // 8. If a file doesn't exist, error out
  // 9. After reading, store the json object in a 'content' property in the related normalized object

  if (watch) {
    const assets = opts.paths.map(asset => {
      const props = {
        basePath: path.dirname(asset.dataFilePath),
        wrapper: path.basename(asset.dataFilePath, '.json') === 'wrapper'
      }
      return _.assign({}, asset, props);
    });
    return runGenerateAssets(assets);
  }

  clean();

  const srcDirResolved = path.resolve(config.srcDir);
  const activeAssetTypes = ['css', 'js', 'coffee', 'less', 'styl', 'sass', 'scss'];
  const srcFiles = fs.walkSync(config.srcDir)
    .filter(src => {
      return !activeAssetTypes.includes(_.trimStart(path.extname(src), '.'));
    })
    .map((src, index, files) => {
      const normalized = path.parse(src);
      const {dir, base, ext, name} = normalized;
      const type = _.trimStart(ext, '.');
      const parentDir = dir.slice(dir.lastIndexOf(path.sep) + path.sep.length);
      const srcStripped = stripIgnoredBasePath(src, config.templateIgnoredBasePaths);

      normalized.src = src;

      if (type === 'mustache') {
        if (parentDir === 'partials') {
          normalized.role = 'partial';
        } else if (name === 'wrapper') {
          normalized.role = 'wrapper';
        } else {
          normalized.role = 'template';
          normalized.dest = path.join(config.destBase, changeExt(srcStripped, ext, '.html'));
        }
      }

      return normalized;
    })
    .map((file, index, files) => {
      if (file.role === 'template') {
        const wrapper = getWrapper(file.src, files, srcDirResolved);
        if (wrapper) {
          file.wrapper = wrapper.src;
          file.wrapperData = wrapper.data;
        }
      }

      return file;
    });

  console.log(srcFiles);

  function getWrapper(ref, files, srcRoot) {
    const dir = path.dirname(ref);
    return dir.length >= srcRoot.length && (files.find(f => {
      return _.isMatch(f, {role: 'wrapper', dir});
    }) || getWrapper(dir, files, srcRoot));
  }




  /*
  const templates = plugins.getTemplatePaths(srcFiles);

  _.forEach(templates.templateDataPaths, val => {
    const basePath = path.dirname(val);
    const wrapper = path.basename(val, '.json') === 'wrapper';

    cache.get(val, data => {
      const files = _(data.files).map((group, groupKey) => {
        return _.map(group, assetPath => {
          const result = plugins.normalizePaths({
            path: path.normalize(path.join(basePath, assetPath)),
            dataFilePath: val,
            basePath,
            groupKey,
            wrapper
          });

          return result;
        });
      }).flatten().value();

      return _.assign({}, data, {files});
    });
  });

  const assetPaths = opts.paths || _(templates.templateDataPaths)
    .map(val => cache.get(val)).map('files').flatten().value();

  const copyPassiveAssets = passiveAssets.map(asset => {
    const dest = path.join(config.destBase, stripIgnoredBasePath(asset, config.templateIgnoredBasePaths));
    return fs.copy(asset, dest);
  });

  const generateTemplates = _(templates)
    .pipeAll(plugins.normalizeTemplatePaths)
    .pipe(plugins.static)
    .value();

  const generateAssets = runGenerateAssets(assetPaths);

  function runGenerateAssets(assets) {
    return _(assets)
      .pipe(plugins.normalizePaths, watch)
      .pipe(plugins.read)
      .pipe(plugins.transpile, a => !a.isMinified)
      .pipe(plugins.copySource)
      .pipe(plugins.minify, a => !a.isMinified, task === 'build')
      .pipe(plugins.remapSources(task), a => a.map)
      .pipeAll(plugins.concat, task === 'build')
      .pipe(plugins.outputSourcemaps)
      .pipe(plugins.output)
      .pipeTap(plugins.getWatchFiles(watchFiles), task === 'make' && !watch)
      .pipe(plugins.toDestPath, watch)
      .value();
  }

  return Promise.all(_.flatten([generateAssets, generateTemplates, copyPassiveAssets])).then(() => ({watchFiles}));
 */
}

