/**
 * @module helpers
 * @author Risto Stevcev
 */
var fs = require('fs');

/**
 * Helper functions
 * @memberof module:helpers
 * @property {Function} helpers.argsToOptions - Returns an options list from an flags list
 * @property {Function} helpers.allFlagsPassed - Check if all flags are passed
 * @property {Function} helpers.allFlagSetsPassed - Check if a single flag in each set is passed
 * @property {Function} helpers.oneFlagPassed - Check if exactly one flag is passed
 * @property {Function} helpers.fileExists - Check if a file or files exist
 */
module.exports = {
  argsToOptions: function(args, delimiter) {
    'use strict';
    if (!delimiter) {
      delimiter = ' or ';
    }

    return args.map(function(arg) {
             return this.options[this.flagToName(arg)];
           }, this)
           .reduce(function(previous, current) {
             return (previous ? previous + delimiter : '') + 
                    (current ? '['+ current.shortFlag +' | '+ current.longFlag +']' : '');
           }, '');
  },

  allFlagsPassed: function(flags) {
    'use strict';
    return flags.every(function(flag) {
      var option = this.options[this.flagToName(flag)];
      if (!option) {
        return false;
      }
      else {
        return this.parsedOptions[option.shortFlagName] ||
               this.parsedOptions[option.longFlagName];
      }
    }, this);
  },

  allFlagSetsPassed: function(flagSets) {
    'use strict';
    return flagSets.every(function(flagSet) {
      return module.exports.oneFlagPassed.call(this, flagSet);
    }, this);
  },

  oneFlagPassed: function(flags) {
    'use strict';
    var numFlagsPassed = 0;

    flags.forEach(function(flag) {
      var option = this.options[this.flagToName(flag)];
      if (option) {
        if (this.parsedOptions[option.shortFlagName] !== undefined ||
            this.parsedOptions[option.longFlagName]  !== undefined) {
          numFlagsPassed += 1;
        }
      }
    }, this);

    return numFlagsPassed === 1;
  },

  fileExists: function(flags) {
    'use strict';
    return flags.every(function(flag) {
      var option = this.options[this.flagToName(flag)];
      return option.type === String ? fs.existsSync(option.value) : false;
    }, this);
  }
};
