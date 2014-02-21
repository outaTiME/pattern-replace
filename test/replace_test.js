
'use strict';

var Replacer = require('../lib/replacer');

exports['replace'] = {

  main: function (test) {

    var replacer;
    var expect;
    var result;

    test.expect(3);

    replacer = new Replacer({
      patterns: [
        {
          match: 'key',
          replacement: 'value'
        }
      ]
    });
    expect = 'value';
    result = replacer.replace('@@key');
    test.equal(expect, result, 'should replace simple key with value');

    replacer = new Replacer({
      patterns: [
        {
          match: 'key',
          replacement: '$$\''
        }
      ]
    });
    expect = '$\'';
    result = replacer.replace('@@key');
    test.equal(expect, result, 'should escape the dollar sign ($)');

    replacer = new Replacer({
      patterns: [
        {
          match: /(\w+)\s(\w+)/,
          replacement: '$2, $1',
        }
      ]
    });
    expect = 'Smith, John';
    result = replacer.replace('John Smith');
    test.equal(expect, result, 'should replace "John Smith" for "Smith, John"');

    test.done();

  },

  json: function (test) {

    var replacer;
    var expect;
    var result;

    test.expect(1);

    replacer = new Replacer({
      patterns: [
        {
          json: {
            'key': 'value'
          }
        }
      ]
    });
    expect = 'value';
    result = replacer.replace('@@key');
    test.equal(expect, result, 'should read from json and replace simple key with value');

    test.done();

  },

  yaml: function (test) {

    var replacer;
    var expect;
    var result;

    test.expect(1);

    replacer = new Replacer({
      patterns: [
        {
          yaml: 'key: value'
        }
      ]
    });
    expect = 'value';
    result = replacer.replace('@@key');
    test.equal(expect, result, 'should read from yaml and replace simple key with value');

    test.done();

  }

};
