# Dependency Sorter

A weighted dependency sorter, based on a depth-first topological sort.

In other words, it sorts a list of interdependent items based on which ones
depend on which other ones.

An optional weight may be applied to list items to make them float up or down in
the list, relative to the weights of other items, without breaking the
dependency chain.

See the [`weightProperty`](#weightproperty) documentation for more information
on object weights.

**Works With:**
* Node (CommonJS)
* RequireJS (AMD)
* *...or right in your browser*

***Example - Dynamically Load Script Libraries With Dependencies (Browser)***
```html
<script src="dependency-sorter.min.js"></script>
<script>
  var libs = [
    // Listed in alphabetical order
    { id: "backbone", depends: ["jquery", "underscore"], src: "https://cdnjs.cloudflare.com/ajax/libs/backbone.js/1.3.3/backbone-min.js" },
    { id: "jquery", src: "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0/jquery.min.js" },
    { id: "marionette", depends: "backbone", src: "https://cdnjs.cloudflare.com/ajax/libs/backbone.marionette/2.5.6/backbone.marionette.min.js" },
    { id: "underscore", src: "https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js" }
  ];
  new DependencySorter().sort(libs).forEach(function(lib) {
    var script = document.createElement('script');
    script.setAttribute("data-name", lib.id);
    script.src = lib.src;
    script.async = false;
    document.head.appendChild(script);
  });
</script>

<!-- The following script tags will be generated in <head> (in order)
  <script data-name="underscore" src="https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js"></script>
  <script data-name="jquery" src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0/jquery.min.js"></script>
  <script data-name="backbone" src="https://cdnjs.cloudflare.com/ajax/libs/backbone.js/1.3.3/backbone-min.js"></script>
  <script data-name="marionette" src="https://cdnjs.cloudflare.com/ajax/libs/backbone.marionette/2.5.6/backbone.marionette.min.js"></script>
-->
```

***Example - Arrange a Queue of People (Node)***
```js
"use strict";
var DependencySorter = require('dependency-sorter');

var peopleSorter, people, sortedPeople;

peopleSorter = new DependencySorter({ idProperty: "name" });

people = [
    { name: "Jim", comment: "Just put me anywhere." },
    { name: "Donna", comment: "Ooo, me First!", weight: -100 },
    { name: "Billie", comment: "Earlyish is good.", weight: -5 },
    { name: "Chris", comment: "I'd prefer to be last.", weight: Infinity },
    { name: "Jerk", comment: "Put me after the guy who wants to be last!", depends: ["Chris"], weight: 100 },
    { name: "Sherry", comment: "I go where Donna goes.", depends: "Donna", weight: -Infinity },
    { name: "Dillon", comment: "I'd rather be somewhere near the end.", weight: 10 },
    { name: "Tom", comment: "The sooner the better, but ladies first.", depends: ["Donna", "Sherry"], weight: -10 }
];

sortedPeople = peopleSorter.sort(people);

// Log the queue
sortedPeople.forEach(function(person) {
  console.log(person.name + ': ' + person.comment);
});

/*-=[ Output ]=-*
  Donna: Ooo, me First!
  Sherry: I go where Donna goes.
  Tom: The sooner the better, but ladies first.
  Billie: Earlyish is good.
  Jim: Just put me anywhere.
  Dillon: I'd rather be somewhere near the end.
  Chris: I'd prefer to be last.
  Jerk: Put me after the guy who wants to be last!
*/
```

## Options

The `DependencySorter` takes an *optional* `Object` parameter containing
information about your data for the built-in serializer. The following
option properties are supported: `idProperty`, `dependsProperty`,
`weightProperty`, `defaultWeight`

### `defaultWeight`

**Default:** `0`

```js
var sorter = new DependencySorter({ defaultWeight: -1 });
```

The `defaultWeight` property sets the `weight` value for sorted items without a
defined weight.

See the [`weightProperty`](#weightproperty) documentation for more information
on using weights.

### `dependsProperty`

**Default:** `"depends"`

```js
var sorter = new DependencySorter({ dependsProperty: "deps" }),
    list = [
      { id: "first" },
      { id: "second", deps: "first" }
    ];
```

The `dependsProperty` property sets the property name used in your list to
define the set of dependencies.

Your list object's `depends` property can be an `Array`, but does not have to be
in case of a single dependency.

### `idProperty`

**Default:** `"id"`

```js
var sorter = new DependencySorter({ idProperty: "name" }),
    list = [
      { name: "first" },
      { name: "second", depends: "first" }
    ];
```

The `idProperty` property sets the property name used in your list to define the
list element's unique identifier.

The `id` value is compared against dependencies from the `depends` list.

If no `id` can be found, the object itself is used as the identifier. This is
not usually desirable, but has it's place, such as generating dependencies from
unknown object types.

### `weightProperty`

**Default:** `"weight"`

```js
var FLOAT_UP = -1,
    sorter = new DependencySorter({ weightProperty: "float" }),
    list = [
      { name: "first", float: FLOAT_UP },
      { name: "second" },
      { name: "third", depends: "second" }
    ];
```

The `weightProperty` property sets the property name used in your list to define
the list element's weight relative to other items.

A *negative* `weight` value will cause at item to float toward the beginning of
the list, while a *positive* `weight` will cause it to float toward the end.

A larger value in either direction from `0` will cause an item to shift past
items of smaller values it encounters, but will not allow the item to move so
far as to break the dependency chain.

A value of zero (`0`) acts as a neutral `weight`, in which the item avoids
shifting in either direction after the topological sort has completed unless
a weighted item wishes to shift past it.

As dependency restrictions are respected, it is therefore possible for an item
of smaller weight to shift pass an item of larger weight if the item of larger
weight is blocked by a dependency boundary. In other words, weights are only
considered up to the range of their dependency boundaries.

Note that items have a maximum weight of `Infinity` or `-Infinity` in their
respective directions.

## License

MIT License
