'use strict';

var path = require('path');
var _ = require('lodash');
var config = require('../config');

var _require = require('../utils/util'),
    getCompiledType = _require.getCompiledType,
    getType = _require.getType,
    stripIgnoredBasePath = _require.stripIgnoredBasePath;

module.exports = normalizeDep;

function normalizeDep(ref) {
  ref.srcStripped = stripIgnoredBasePath(ref.src, config.templateIgnoredBasePaths);
  ref.dirStripped = path.dirname(ref.srcStripped);
  ref.baseDest = ref.base;
  ref.extDest = ref.ext;
  var type = getType(ref.ext);
  ref.typeDest = type;
  var compiledType = getCompiledType(type);
  if (compiledType) {
    ref.typeDest = compiledType;
    ref.extDest = '.' + ref.typeDest;
    ref.baseDest = ref.name + ref.extDest;
  }
  ref.isMinified = ref.isMinified || path.extname(ref.name) === '.min';
  if (ref.isMinified) {
    ref.name = path.basename(ref.name, '.min');
  }

  var consumerName = path.basename(ref.consumer, '.json');
  var consumerDir = path.dirname(path.relative(path.join(process.cwd(), config.srcDir), ref.consumer));
  var forWrapper = consumerName === 'wrapper';

  ref.dest = path.join(config.destBase, ref.dirStripped, ref.baseDest);

  // Fix dest for assets that are above the src directory, such as node modules
  if (!ref.dest.startsWith(consumerDir, config.destBase.length + 1)) {
    ref.dest = path.join(config.destBase, consumerDir, ref.dirStripped, ref.baseDest);
  }

  ref.dirDest = path.dirname(ref.dest);

  ref.sourcemapPath = path.join(ref.dirStripped, ref.baseDest + '.map');

  if (process.env.task === 'build') {
    ref.extDest = '.min.' + ref.typeDest;

    if (!ref.isMinified) {
      ref.baseDest = ref.name + ref.extDest;
      ref.dest = path.join(ref.dirDest, ref.base);
    }

    ref.dirDest = consumerDir;

    var pagePrefix = forWrapper ? '' : consumerName + '-';
    var webPathPrefix = (forWrapper ? '/' : '') + ref.dirDest;

    ref.dirDest = path.join(config.destBase, ref.dirDest);
    ref.filenameDest = pagePrefix + ref.groupKey + ref.extDest;
    ref.dest = path.join(ref.dirDest, ref.filenameDest);
    ref.webPath = path.join(webPathPrefix, ref.filenameDest);
    ref.sourcemapPath = ref.webPath + '.map';
  }

  return ref;
}