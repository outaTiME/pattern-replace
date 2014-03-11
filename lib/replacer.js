
/*
 * pattern-replace
 * https://github.com/outaTiME/pattern-replace
 *
 * Copyright (c) 2014 outaTiME
 * Licensed under the MIT license.
 * https://github.com/outaTiME/pattern-replace/blob/master/LICENSE-MIT
 */

// dependencies

var util = require('util');
var events = require('events');
var _ = require('lodash');

// private

var error = function (replacer, e) {
  var message = e;
  if (e instanceof Error) {
    message = e.message;
  }
  replacer.emit('error', e);
};

var normalize = function (replacer, patterns) {
  var opts = replacer.options;
  return _.transform(patterns, function (result, pattern) {
    var match = pattern.match;
    var replacement = pattern.replacement;
    var expression = pattern.expression === true;
    // match check
    if (_.isRegExp(match)) {
      expression = true;
    } else if (_.isString(match)) {
      if (match.length > 0) {
        if (expression === true) {
          var index = match.lastIndexOf('/');
          if (match[0] === '/' && index > 0) {
            try {
              match = new RegExp(match.slice(1, index), match.slice(index + 1));
            } catch (error) {
              error(replacer, error);
              return;
            }
          } else {
            error(replacer, 'Invalid expression found for match: ' + match);
            return;
          }
        } else {
          // old school
          try {
            match = new RegExp(opts.prefix + match, 'g');
          } catch (error) {
            error(replacer, error);
            return;
          }
        }
      } else {
        // empty match
        return;
      }
    } else {
      error(replacer, 'Unsupported type for match (RegExp or String expected).');
      return;
    }
    // replacement check
    if (!_.isFunction(replacement)) {
      if (!_.isString(replacement)) {
        // transform object to string
        replacement = JSON.stringify(replacement);
      } else {
        // easy way
        if (expression === false && opts.preservePrefix === true) {
          replacement = opts.prefix + replacement;
        }
      }
    } else {
      // replace using function return value
    }
    return result.push({
      match: match,
      replacement: replacement,
      expression: expression
    });
  });
};

var prepare = function (replacer) {
  var opts = replacer.options;
  // shallow patterns
  var patterns = _.clone(opts.patterns);
  // backward compatibility
  var variables = opts.variables;
  if (!_.isEmpty(variables)) {
    patterns.push({
      json: variables
    });
  }
  // FIXME: handler for plugin management
  var createPluginHandler = function (context) {
    return function (plugin) {
      var pattern = context.pattern;
      if (plugin.match(pattern, opts) === true) {
        plugin.transform(pattern, opts, function (items) {
          if (items instanceof Error) {
            throw items;
          } else {
            // store transformed pattern in context
            context.pattern = items;
          }
        });
      } else {
        // plugin doesn't apply
      }
    };
  };
  // execute plugins
  var plugins = replacer.plugins;
  // intercept errors
  for (var i = patterns.length - 1; i >= 0; i -= 1) {
    var context = {
      pattern: patterns[i]
    };
    // process context with each plugin
    plugins.forEach(createPluginHandler(context));
    // update current pattern
    Array.prototype.splice.apply(patterns, [i, 1].concat(context.pattern));
  }
  if (opts.preserveOrder !== true) {
    // only sort non regex patterns (prevents replace issues like head, header)
    patterns.sort(function (a, b) {
      var x = a.match;
      var y = b.match;
      if (_.isString(x) && _.isString(y)) {
        return y.length - x.length;
      } else if (_.isString(x)) {
        return -1;
      }
      return 1;
    });
  }
  // normalize definition
  return normalize(replacer, patterns);
};

// replacer

var Replacer = function (opts) {
  // super
  events.EventEmitter.call(this);
  // defaults
  this.options = _.defaults(opts, {
    patterns: [],
    prefix: opts.usePrefix === false ? '': '@@',
    usePrefix: true,
    preservePrefix: false,
    delimiter: '.',
    preserveOrder: false
  });
  // plugins
  this.plugins = require('./plugins');
  // patterns
  // this.patterns = [];
};

util.inherits(Replacer, events.EventEmitter);

/*

Replacer.prototype.addVariables = function (variables) {
  // backward compatibility
  if (!_.isEmpty(variables)) {
    this.addPattern({
      json: variables
    });
  }
};

Replacer.prototype.addPattern = function (pattern) {
  var patterns = this.patterns;
  if (!_.isEmpty(pattern)) {
    patterns.push(pattern);
  }
};

Replacer.prototype.addPatterns = function (patterns) {
  patterns.forEach(function (pattern) {
    this.addPattern(pattern);
  });
};

Replacer.prototype.clear = function () {
  var variables = this.variables;
  var patterns = this.patterns;
  // clear patterns
  variables.length = 0;
  patterns.length = 0;
};

*/

// magic here

Replacer.prototype.replace = function (contents, process) {
  try {
    // prepare patterns
    var patterns = prepare(this);
    // by default file not updated
    var updated = false;
    // iterate over each pattern and make replacement
    patterns.forEach(function (pattern) {
      var match = pattern.match;
      var replacement = pattern.replacement;
      // wrap replacement function to add process arguments
      if (_.isFunction(replacement)) {
        replacement = function () {
          var args = Array.prototype.slice.call(arguments);
          return pattern.replacement.apply(this, args.concat(process || []));
        };
      }
      updated = updated || contents.match(match);
      contents = contents.replace(match, replacement);
    });
    if (!updated) {
      return false;
    }
    return contents;
  } catch (e) {
    error(this, e);
  }
};

// expose

module.exports = Replacer;
