/**
 * @module yumparse
 * @author Risto Stevcev
 */
var mustache = require('mustache');


/**
 * Creates a yumparse Parser
 * @class
 * @param {Object} args - Arguments to pass into the parser
 * @param {String} [args.template] - The template that should be used for help/usage
 * @param {Object[]} args.options - The options that should be parsed
 * @param {String} args.options.shortFlag - The short flag for that option
 * @param {String} [args.options.longFlag] - The long flag for that option
 * @param {*} [args.options.type=String] - The type for that option
 * @param {Boolean} [args.options.required=false] - Set it to make it a required option
 * @param {String} args.options.description - The description of the option
 * @param {*} [args.options.defaultValue] - The default value for the option
 */
exports.Parser = function(args) {
  'use strict';
  /** 
   * Underline text (xterm color)
   * @type {String}
   * @private
   */
  var _U = '\u001b[4m';

  /**
   * Normal text (xterm color, ends underlined text)
   * @type {String}
   * @private
   */
  var U_ = '\u001b[24m';

  /**
   * The default template
   * @type {String}
   * @instance
   */
  this.template = '' +
    '{{{program.description}}}\n\n' +

    _U+'Usage'+U_+'\n' +
    '  {{{program.name}}} [options]\n\n' +

    _U+'Options'+U_+'\n' +
    '{{#optionsList}}' +
    '  {{{flagBlock}}}    {{{description}}}\n' +
    '{{/optionsList}}' +

    '{{#program}}' +
    '\n\n' +
    _U+'Example'+U_+'\n' +
    '  {{{example}}}\n' +
    '{{/program}}';

  if (!args || !args.options)
    throw new Error('At least one flag needs to be given to the Parser');

  if (args.program)
    this.program = args.program;
  else
    this.program = { name: process.argv[1] };

  if (args.example)
    this.example = args.example;

  if (args.template)
    this.template = args.template;

  /**
   * The original options list that was passed in
   * @type {Array}
   * @instance
   */
  this.optionsList = args.options;
  
  /** 
   * The longest flag length
   * @type {Number}
   */
  var longestFlag = this.optionsList.reduce(function(previous, current) {
    return current.longFlag && current.longFlag.length > previous ? 
           current.longFlag.length : previous;
  }, 0);

  /** 
   * A mustache js helper function that returns a flag block
   * @returns {String} A flag block string
   * @this module:yumparse.Parser~parseOptions
   */
  this.flagBlock = function() {
    return (this.longFlag ?
            Array(longestFlag - this.longFlag.length + 1).join(' ') + this.longFlag + ', ' :
            Array(longestFlag + 1).join(' ') + '  ') +
           this.shortFlag;
  };

  /** 
   * Available flag options 
   * @readonly
   * @enum {Object}
   */
  this.flagTypeOptions = [Boolean, Number, String, Array, Object];

  /** 
   * Convert a flag (spinal case) to a variable name (camel case)
   * @param {String} flag - The flag to convert
   * @returns {String} The variable name
   */
  this.flagToName = function(flag) {
    if (flag.match(/^--[-a-z]*$/)) {
      flag = flag.replace(/^--/, '');
      var idx = flag.search(/-[a-z]/);
      for (idx; idx > -1; idx = flag.search(/-[a-z]/))
        flag = flag.slice(0, idx) + 
               flag[idx + 1].toUpperCase() + 
               flag.slice(idx + 2, flag.length);
      return flag;
    }
    else if (flag.match(/^-[a-z]$/))
      return flag[1];
  };

  /**
   * Convert a variable name (camel case) to a flag (spinal case)
   * @param {String} name - The name to convert
   * @returns {String} The flag
   */
  this.nameToFlag = function(name) {
    if (name.length === 1 && name.match(/[a-z]/))
      return '-' + name;
    else if (name.length > 1 && name.match(/[A-Za-z]/)) {
      var idx = name.search(/[A-Z]/);
      for (idx; idx > -1; idx = name.search(/[A-Z]/))
        name = name.slice(0, idx) + 
               '-' + name[idx].toLowerCase() + 
               name.slice(idx + 1, name.length);
      return '--' + name;
    }
  };

  /**
   * Parse options
   * @param {Object} options - The options to to parse
   * @return {Object} The parsed options
   */
  var parseOptions = function(options) {
    var flags = {};
    options.forEach(function(option) {
      if (!option.shortFlag || !option.type || !option.description)
        throw new Error('Parser object requires a flag that has at least ' + 
                        'shortFlag, type, and description attributes set.');

      if (!this.flagTypeOptions.some(function(type) {
                                       return type === option.type;
                                     }))
        throw new Error('The type given is not one of the valid types: ' +
                        this.flagTypeOptions.map(function(type) { 
                          return type.name; 
                        }).join(', '));

      if (!option.shortFlag.match(/^-[a-z]/))
        throw new Error('Short flag "' + shortFlag + 
                        '" must match the format: -[a-z]');
      option.shortFlagName = this.flagToName(option.shortFlag);
      flags[option.shortFlagName] = option;

      if (option.longFlag) {
        if (!option.longFlag.match(/^--[-a-z]/))
          throw new Error('Long flag "' + option.longFlag +
                          '" must match the format --[-a-z]*');
        option.longFlagName = this.flagToName(option.longFlag); 
        flags[option.longFlagName] = option;
      }
    }, this);
    return flags;
  };

  /**
   * Returns an object with (String flag, JSON option) pairs 
   * @type {Object}
   */
  this.options = parseOptions.call(this, args.options);

  /**
   * Returns an object with parsed (String flag, JSON option) pairs
   * @type {Object}
   */
  this.parsedOptions = {};

  /** 
   * Contains the list of rules to be checked after parsing
   * @type {Array}
   */
  this.rules = [];

  /**
   * Adds a rule to check as part of the parsing
   * @param {Object} rule - The rule object
   * @param {Function} [rule.message] - A function that returns an error message if the rule fails
   * @param {Function} rule.check - The rule-check function to run. Returns true on success and false on failure.
   */
  this.addRule = function(rule) {
    this.rules.push(function() {
      if (!rule.check.call(this)) 
        throw new Error(rule.message ? rule.message.call(this) : 'Invalid options');
    });
  };

  /** 
   * Help string
   * @returns {String} The help string
   */
  this.helpString = function() {
    return mustache.render(this.template, this);
  };

  /** Display help and exit the program */
  this.displayHelp = function() {
    console.log(this.helpString());
    process.exit();
  };

  /**
   * @description Parses the process.argv arguments and runs the checks for the rules
   * @returns Sets this.parsedOptions to the parsed options after all rules pass 
   */
  this.parse = function() {
    /** 
     * Adds a parsed option (see: {@link module:yumparse.Parser#parse})
     * @inner
     * @private
     * @memberof module:yumparse.Parser
     * @this module:yumparse.Parser 
     */
    var addParsedOption = function(flag, flagValue) {
      this.parsedOptions[flag] = this.options[flag];
      if (this.options[flag].type === Boolean && flagValue)
        throw new Error('The flag "' + '"');
      else
        this.parsedOptions[flag].value = flagValue;
    };

    /**
     * Collects the flags and thier values from process.argv and adds them to parsedOptions (see {@link module:yumparse.Parser#parse})
     * @name collectFlags
     * @function
     * @inner
     * @private
     * @memberof module:yumparse.Parser
     * @this module:yumparse.Parser 
     */
    (function collectFlags() {
      var flag, flagValue;
      var args = process.argv.slice(2);
      args.forEach(function(arg, idx) {
        var isFlag = arg.match(/^-[a-z]$/) || arg.match(/^--[-a-z]*$/);
        if (isFlag) {
          var flagName = this.flagToName(arg);
          if (!this.options[flagName])
            throw new Error(arg + ' is not a valid option');

          if (flag)
            addParsedOption.call(this, flag, flagValue);

          flag = flagName;
          flagValue = undefined;
        }
        else {
          if (flagValue && !(flagValue instanceof Array))
            flagValue = [flagValue];
          if (flagValue && flagValue instanceof Array)
            flagValue.push(arg);
          else
            flagValue = arg;
        }
        if (flag && idx === args.length - 1)
          addParsedOption.call(this, flag, flagValue);
      }, this);
    }).call(this);

    /**
     * Typecheck the parsed options 
     * @name typeCheck 
     * @function
     * @inner
     * @private
     * @memberof module:yumparse.Parser
     * @this module:yumparse.Parser 
     */
    (function typeCheck() {
      Object.keys(this.parsedOptions).forEach(function(flag) {
        var option = this.parsedOptions[flag];
        
        switch (option.type) {
          case Boolean:
            option.value = true;
            break;
          case Number:
            if (!isNaN(option.value))
              option.value = parseInt(option.value);
            else
              throw new Error(option.value + ' is not a number');
            break;
          case Array:
            if (!option.value)
              throw new Error('A value was not given for flag "' + option.shortFlag + '"');
            break;
          case String:
            if (typeof option.value !== 'string')
              throw new Error(JSON.stringify(option.value) + ' is not a string');
            break;
          case Object:
            if (!option.value)
              throw new Error('A value was not given for flag "' + option.shortFlag + '"');

            if (typeof option.value !== 'string')
              throw new Error('JSON needs to be passed as a string');

            try {
              option.value = JSON.parse(option.value);
            }
            catch (e) {
              throw new Error('Not a JSON object');
            }
            break;
        }
      }, this);
    }).call(this);

    /**
     * Check rules 
     * @name checkRules 
     * @function
     * @inner
     * @private
     * @memberof module:yumparse.Parser
     * @this module:yumparse.Parser 
     */
    (function checkRules() {
      this.rules.forEach(function(rule) {
        rule.call(this);
      }, this);
    }).call(this);

    if (this.parsedOptions.h || this.parsedOptions.help)
      displayHelp.call(this);
  };
};


/** 
 * An object containing built-in rule factory functions 
 * @property {Object} rules.orFlags - Returns an (OR) rule that compares 2+ options that must be passed separately 
 * @property {Object} rules.andFlags - Returns an (AND) rule that compares 2+ options that must be passed together
 */
exports.rules = {
  orFlags: function() {
    'use strict';
    var args = Array.prototype.slice.call(arguments);
    return {
      message: function() {
        return 'You can only pass ' +
               args.map(function(arg) {
                 return this.parsedOptions[this.flagToName(arg)];
               }, this)
                 .reduce(function(previous, current) {
                   return (previous ? previous + ' or ' : '') + 
                          '['+ current.shortFlag +' | '+ 
                               current.longFlag +']';
               }, '') +
               ' as a parameter.';
      },

      check: function() { 
        return !args.every(function(arg) {
          return this.parsedOptions[this.flagToName(arg)] || 
                 this.parsedOptions[this.flagToName(arg)];
        }, this);
      }
    };
  },
  
  andFlags: function() {
    'use strict';
    var args = Array.prototype.slice.call(arguments);
    return {
      message: function() {
        return 'You must pass parameters ' +
               args.map(function(arg) {
                 return this.parsedOptions[this.flagToName(arg)];
               }, this)
                 .reduce(function(previous, current) {
                   return (previous ? previous + ' and ' : '') + 
                          '['+ current.shortFlag +' | '+ 
                               current.longFlag +']';
               }, '') +
               ' together.';
      },

      check: function() { 
        return args.every(function(arg) {
          return this.parsedOptions[arg.shortFlagName] ||
                 this.parsedOptions[arg.longFlagName];
        }, this);
      }
    };
  }
};


/* 
 * TODO: exports.rules.checkFile - Checks if the type is a file
 * options - Can be infinite, and it should check each option value of each to see if:
 * The file exists
 * The file matches the required extension
 */
