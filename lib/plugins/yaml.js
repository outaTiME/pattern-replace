
/*
 * pattern-replace
 * https://github.com/outaTiME/pattern-replace
 *
 * Copyright (c) 2014 outaTiME
 * Licensed under the MIT license.
 * https://github.com/outaTiME/pattern-replace/blob/master/LICENSE-MIT
 */

// dependencies

var yaml = require('js-yaml');

// expose

module.exports = {
  name: 'yaml',
  match: function (pattern, opts) {
    var yaml = pattern.yaml;
    var match = typeof yaml !== 'undefined';
    return match;
  },
  transform: function (pattern, opts, done) {
    try {
      done({
        json: yaml.safeLoad(pattern.yaml)
      });
    } catch (e) {
      done(e);
    }
  }
};
