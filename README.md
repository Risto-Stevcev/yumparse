# **Yumparse**

A simple, lightweight and flexible command line argument parser.

[![Npm Downloads][downloads-image]][npm-url]
[![Npm Version][npm-image]][npm-url]
[![Test Coverage][wercker-image]][github-url]
[![Code Coverage][coverage-image]][climate-url]

[View the documentation][github-pages-url]


## Basic usage

Yumparse is both simple and very flexible. Here is a simple example:

```js
var yum = require('yumparse');
var parser = new yum.Parser({
  // Enter command line options: shortFlag, type, and description are required parameters 
  options: [
    { shortFlag: '-f',
      longFlag: '--foo',
      type: String,
      description: 'The foo string' }
  ]
});
parser.parse();  // Parse the options. The parser type checks to see if a String is passed

var fooString = parser.parsedOptions.foo || parser.parsedOptions.f;  // Get the option if it was passed
if (fooString)  // Do something with the option if it exists
  console.log('Hello ' + fooString.value + '!');
```

Save it as `basic.js`, and then in the shell:

```bash
$ node basic.js 
$ node basic.js -h

Usage
  basic.js [options]

Options
  --foo, -f    The foo string

$ node basic.js -f "Mr. Bubbles"
Hello Mr. Bubbles!
$ node basic.js -f

/usr/lib/node_modules/yumparse/src/yumparse.js:452
              throw new YumparseError(JSON.stringify(option.value) + ' is not 
                    ^
YumparseError: undefined is not a string
```

See more examples below or in the **examples** folder from the project's [GitHub page][github-url].

### Changing the error message

Suppose you wanted to pretty up the error message. You could wrap a try block around `parser.parse()`:

```js
try {
  parser.parse();
}
catch (error) {
  console.error(error.name + ': ' + error.message);
  process.exit(1);
}
```

Which would look like this in the shell:

```bash
$ node basic.js -f 
YumparseError: undefined is not a string
```

Or you could change the message to your tastes:

```js
try {
  parser.parse();
}
catch (error) {
  if (error.message.match(/\w is not a string/))
    console.error(error.name + ': Please enter a string');
  else
    console.error(error.name + ': ' + error.message);
  process.exit(1);
}
```
```bash
$ node basic.js -f 
YumparseError: Please enter a string
```

## Creating a rule

This example introduces the use of **rules**. Some of the power of Yumparse comes from its powerful built-in type checking abilities, but it really shines when **rules** are introduced.

Here is a simple example rule:

```js
var myRule = {
  message: function() { 
    return 'You must pass the flag "-f" with the value "foo"'
  },
  check: function() {
    return this.parsedOptions.f ? this.parsedOptions.f.value === 'foo' : true;
  }
}
```

As you can see in this example, the rule checks to see if the flag `-f` has the value `foo`. If it doesn't then it fails the rule and an error is thrown. You can add the rule like this:

```js
parser.addRule(myRule);
```

Yumparse fortunately already comes with several rule *factory* functions that will return a rule object that you can add to your parser. They are available under `yumparse`.`rules`, and they use helper functions from `yumparse`.`helpers`. See the API, JSDoc and source code for more information.


## An example with a rule

The example walks through the built-in rule factory `yumparse`.`rules`.`requiredOrFlags`:

```js
// yumparse.rules.requiredOrFlags
requiredOrFlags: function() {
  'use strict';
  var args = Array.prototype.slice.call(arguments);
  return {
    message: function() {
      return 'You must pass either ' + helpers.argsToOptions.call(this, args) + 
             ' as a parameter.';
    },
    check: function() { 
      return helpers.oneFlagPassed.call(this, args);
    }
  };
},
```

As you can see, the built-in **rules** from `yumparse`.`rules` are not actually rule objects: they are *factories* that return rule objects. This is so that a user can supply a variable number of `arguments` that will return the rule in the proper format.

The call to `Array.prototype.slice.call(arguments)` converts the function arguments from the `arguments` keyword into an Array. Note also that it calls the helper functions in `message` and `call` with `call(this, args)`, so that the parser instance is available in those functions as `this`. 

To learn more about what's going on under the hood, we need to see the helper functions it calls:

```js
// yumparse.helpers.argsToOptions
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

// yumparse.helpers.oneFlagPassed
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
```

You can see that `argsToOptions` first maps the list of flags to their corresponding `options` objects, and then reduces it into a string that display the short and long forms of the flags.

The `oneFlagPassed` helper function gets the flags and checks to see if one and only one flag is passed from the given list of flags.

So if we call something like `yumparse.rules.requiredOrFlags('-i', '-o')`, it will find and check both the `shortFlag` and `longFlag` values for those flags, and if exactly one of these flags is passed it will return `true`. Otherwise it will return `false`, which is exactly what is needed for an **OR** rule that required a flag to be given.

### Tying it all together

Here is the example that ties it all together. It uses the the built-in `yumparse`.`rules`.`requiredOrFlags` rule:

```js
// temperature.js
var yum = require('yumparse');

var parser = new yum.Parser({
  options: [
    { shortFlag: '-v',
      longFlag: '--verbose',
      type: Boolean,
      description: 'Verbose output' },

    { shortFlag: '-f',
      longFlag: '--fahrenheit',
      type: Number,
      description: 'Convert celsius to fahrenheit' },
      
    { shortFlag: '-c',
      longFlag: '--celsius',
      type: Number,
      description: 'Convert fahrenheit to celsius' },

    { shortFlag: '-k',
      longFlag: '--kelvin',
      type: Number,
      description: 'Convert kelvin to fahrenheit' }
  ],
  program: {
    name: 'foobar',
    description: 'a very fooish barish bazish program'
  }
});

parser.addRule(yum.rules.requiredOrFlags('--fahrenheit', '--celsius', '--kelvin'));

try {
  parser.parse();
}
catch (e) {
  console.error(e.name + ': ' + e.message);
}

if (parser.parsedOptions.v || parser.parsedOptions.verbose) {
  console.log('parser.options:\n', parser.options, '\n');
  console.log('parser.parsedOptions:\n', parser.parsedOptions, '\n');
}

var fahrenheit = parser.parsedOptions.f || parser.parsedOptions.fahrenheit;
var celsius = parser.parsedOptions.celsius || parser.parsedOptions.c;
var kelvin = parser.parsedOptions.kelvin || parser.parsedOptions.k;

if (fahrenheit)
  console.log((fahrenheit.value - 32) * 5/9 +  '° celsius');
else if (celsius)
  console.log(celsius.value * 9/5 + 32 + '° fahrenheit');
else if (kelvin)
  console.log((kelvin.value - 273.15) * 9/5 + 32 + '° fahrenheit');
```

And then in the shell:
```bash
$ node temperature.js -h
foobar - a very fooish barish bazish program

Usage
  foobar [options]

Options
     --verbose, -v    Verbose output
  --fahrenheit, -f    Convert celsius to fahrenheit
     --celsius, -c    Convert fahrenheit to celsius
      --kelvin, -k    Convert kelvin to fahrenheit

$ node temperature.js -c 0
32° fahrenheit
$ node temperature.js -f 32
0° celsius
$ node temperature.js -k 273.15
31.73000000000004° fahrenheit
$ node temperature.js
YumparseError: You must pass either [-f | --fahrenheit] or [-c | --celsius] or [-k | --kelvin] as a parameter.
```

## The help/usage menu

The help/usage menu is also customizable. The built-in default template looks like this:

```js
this.template = '' +
  '{{#program.description}}' +
  _B+'{{{program.name}}}'+B_ + ' - {{{program.description}}}\n' +
  '{{/program.description}}' +
  '\n\n' +

  _U+'Usage'+U_+'\n' +
  '  {{{program.name}}} [options]\n\n' +

  _U+'Options'+U_+'\n' +
  '{{#optionsList}}' +
  '  {{{flagBlock}}}    {{{description}}}\n' +
  '{{/optionsList}}' +

  '{{#example}}' +
  '\n\n' +
  _U+'Example'+U_+'\n' +
  '  {{{example}}}\n' +
  '{{/example}}';

...

this.flagBlock = function() {
  return (this.longFlag ?
          (new Array(longestFlag - this.longFlag.length + 1)).join(' ') + 
          this.longFlag + ', ' :
          (new Array(longestFlag + 1)).join(' ') + '  ') + 
      
         this.shortFlag;
};
```

As you can see, the [Mustache][mustache-url] template has access to the parser instance (`this`). You might wonder what `_B`, `B_`, `_U` and `U_` are: They are xterm colors that refer to opening and closing **bold** and **underline**, respectively. 

Feel free the overwrite the template string `parser`.`template` to your liking. You can also append your own Mustache functions (like `this`.`flagBlock`) to the parser by adding the property to your Parser object instance.


## API

### *Module* `yumparse`

##### *Function* `yumparse`.`Parser`(*Object* args)

The parser object. Takes a JSON object `args`:  
*String* `args`.`template` - The [Mustache][mustache-url] template to use for the help/usage menu. (*optional*)  
*Array* `args`.`options` - The options array that the parser should use when parsing arguments. (*required*)  

*Object* **`args`.`options`**:  
*String* `args`.`options`.`shortFlag` - The short flag to use for the option (e.g. `'-i'`). (*required*)  
*Object* `args`.`options`.`type` - The type to typecheck for. (*required*)  
&nbsp;&nbsp;Available options are in *yumparse.flagTypeOptions*: `Boolean`, `Number`, `String`, `Array`, `Object`.  
*String* `args`.`options`.`description` - The description of the option (used in the help/usage menu). (*required*)  
*String* `args`.`options`.`longFlag` - The long flag to use for the option (e.g. `'--input-file'`). (*optional*)  
*Boolean* `args`.`options`.`required` - Set to true to make the option required. (*optional*)  
*Object* `args`.`options`.`defaultValue` - The default value for the option. (*optional*)

##### *Object* `yumparse`.`rules`

An alias that fetches the `rules` module. It contains built-in rule *factory* functions that can be used by the parser.  

##### *Object* `yumparse`.`helpers`

An alias that fetches the `helpers` module. It contains the helper functions that are used for the built-in rules.



### *Class* `Parser`

##### *Array* `Parser`.`optionsList`

The original list of obtions that were passed into the constructor in its original `Array` form.

##### *Object* `Parser`.`options`

The list of options that were passed into the constructor in `Object` form. Allows for quick access to options by accessing them through their (camel-cased) variable form (e.g. `Parser.options.inputFile` or `Parser.options.i` for the option with flags `-i` and `--input-file`).

##### *Object* `Parser`.`parsedOptions`

The successfully parsed options that the user gave from the command line. Contains a subset of the items in `Parser`.`options`.

##### *Function* `Parser`.`parse`()

Parse the command line parameters from `process`.`argv`. If the function succeeds, it will populate `Parser`.`parsedOptions` with the parsed options. If it fails, it will throw an error.

##### *Function* `Parser`.`addRule`(*Object* rule)

The function that is used to add rules to the rules array. It wraps the rule into a function that throws an error if the rule returns `false` or continues it the rule returns `true`.

*Object* **`rule`**:  
*Function* `rule`.`message` -> *String* - A function that creates the user message. `this` refers to the Parser instance.  
*Function* `rule`.`check` -> *Boolean* - A checking function that performs the checks for the rule. It should return `true` when it succeeds and `false` otherwise. `this` refers to the Parser instance.

##### *Array* `Parser`.`rules`

A list of rule functions to be checked during parsing. Rules are added using the `Parser`.`addRule` function.

##### *Array* `Parser`.`flagTypeOptions`

The list of types that are available for *args.options.type*: `Boolean`, `Number`, `String`, `Array`, `Object`. 

##### *Array* `Parser`.`requiredList`

The list of options from `Parser`.`optionsList` that have the `option`.`required` field set to `true`.

##### *String* `Parser`.`template`

The default [Mustache][mustache-url] template used for the help/usage menu. `this` refers to the Parser instance (e.g. `{{program.name}} - {{program.description}}`, `{{#optionsList}}`, etc).

##### *Function* `Parser`.`flagBlock`() -> *String*

A [Mustache][mustache-url] helper function for formatting the list of options in the help/usage menu. References an option in `Parser`.`optionsList`. Returns a formatted String.

##### *Function* `Parser`.`flagToName`(*String* flag) -> *String*

A helper function that converts a flag name (spinal case) to a variable name (camel case) for accessing options from `Parser`.`options` or `Parser`.`parsedOptions` (e.g. `-i` returns `i`, `--input-file` returns `inputFile`).

##### *Function* `Parser`.`nameToFlag`(*String* name) -> *String*

A helper function that converts a variable name (camel case) to a flag name (spinal case) (e.g. `i` returns `-i`, `inputFile` returns `--input-file`).

##### *Function* `Parser`.`displayHelp`()

Displays the help/usage menu.

##### *Function* `Parser`.`helpString`() -> *String*

Returns the rendered [Mustache][mustache-url] template for the help/usage menu as a String.



### *Object* `yumparse`.`rules`

Contains built-in rule *factory* functions that return a rule object, which can then be passed to `parser`.`addRule`.

##### *Function* **`yumparse`.`rules`.`requiredOrFlags`**(*String* flags...) -> *Object*

A rule *factory* that takes a variable number of Strings in `shortFlag` or `longFlag` format.  
Returns a rule that checks *if one and **exactly** one flag from the list of flags passed was parsed*.

##### *Function* **`yumparse`.`rules`.`orFlags`**(*String* flags...) -> *Object*

A rule *factory* that takes a variable number of Strings in `shortFlag` or `longFlag` format.  
Returns a rule that checks *if zero or **only** one flag from the list of flags passed was parsed*. It will **not** fail if no flags are passed.

##### *Function* **`yumparse`.`rules`.`andFlagSets`**(*Array* flagSets...) -> *Object*

A rule *factory* that takes a variable number of Arrays containing a variable number of Strings in `shortFlag` or `longFlag` format.  
Returns a rule that checks *if one and **exactly** one flag from each array passed was parsed **and** a flag from every array passed was parsed*. It can be thought of as a combination of the rules `yumparse`.`rules`.`andFlags` and `yumparse`.`rules`.`requiredOrFlags`.

##### *Function* **`yumparse`.`rules`.`andFlags`**(*String* flags...) -> *Object*

A rule *factory* that takes a variable number of Strings in `shortFlag` or `longFlag` format.  
Returns a rule that checks *if **every** flag from the list of flags passed was parsed*.

##### *Function* **`yumparse`.`rules`.`fileExists`**(*String* flags...) -> *Object*

A rule *factory* that takes a variable number of Strings in `shortFlag` or `longFlag` format.  
Returns a rule that checks *if the **value** from each of the list of flags passed is a path to a file that **exists***. 



### *Object* `yumparse`.`helpers`

##### *Function* **`yumparse`.`helpers`.`argsToOptions`**(*String[]* args, *String* delimiter) -> *String*

A helper function that takes a array of flags and a delimiter, and returns a String display of the `shortFlag` and `longFlag` of each of the passed options, delimited by the passed `delimiter` string.

##### *Function* **`yumparse`.`helpers`.`allFlagsPassed`**(*String[]* flags) -> *Boolean*

A helper function that takes an array of flags, and returns `true` if all of those flags were parsed (i.e. they exist in `parser`.`parsedOptions`), and `false` otherwise.

##### *Function* **`yumparse`.`helpers`.`allFlagSetsPassed`**(*String[][]* flagSets) -> *Boolean*

A helper function that takes an array of an array of flags (a flagSet is an array of flag Strings), and returns `true` if exactly one flag from each flagSet was parsed.

##### *Function* **`yumparse`.`helpers`.`oneFlagPassed`**(*String[]* flags) -> *Boolean*

A helper function that takes an array of flags, and returns `true` if one and *exactly* one flag was passed, and `false` otherwise.

##### *Function* **`yumparse`.`helpers`.`fileExists`**(*String[]* flags) -> *Boolean*

A helper function that takes an array of flags, and returns `true` if the *value* from each of the flags is a path to a file that *exists*.


* * *
Copyright © 2014, Risto Stevcev



[coverage-image]: https://img.shields.io/codeclimate/coverage/github/Risto-Stevcev/yumparse.svg?style=flat
[wercker-image]: https://img.shields.io/wercker/ci/549198836b3ba8733d8da6cd.svg?style=flat
[downloads-image]: https://img.shields.io/npm/dm/yumparse.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/yumparse.svg?style=flat

[climate-url]: https://codeclimate.com/github/Risto-Stevcev/yumparse
[npm-url]: https://npmjs.org/package/yumparse
[mustache-url]: https://www.npmjs.com/package/mustache
[github-url]: https://github.com/Risto-Stevcev/yumparse
[github-pages-url]: http://risto-stevcev.github.io/yumparse
