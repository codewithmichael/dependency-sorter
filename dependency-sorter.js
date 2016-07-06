/*!
 * Dependency Sorter v0.1.0
 * Weighted dependency sorter, based on a depth-first topological sort
 * Copyright (c) 2016, Michael Spencer
 * MIT License
 */
"use strict";

(function(root, globalName, moduleName, factory) {
  // Environment management
  var previousGlobal;
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(moduleName, [], factory)
  } else if (typeof module === 'object' && module.exports) {
    // Node / CommonJS
    module.exports = factory()
  } else {
    // Browser / Global
    previousGlobal = root[globalName]
    root[globalName] = factory()
    root[globalName].noConflict = function() {
      var result = root[globalName]
      root[globalName] = previousGlobal
      return result;
    }
  }
})(this, "DependencySorter", "dependency-sorter", function() {

  // Exports
  factory.util = {
    Serializer: Serializer,
    sortByDepends: sortByDepends,
    sortByWeight: sortByWeight
  }
  return factory

  //===

  function factory(serializerOptions) {
    var serializer = new Serializer(serializerOptions)

    // Exports
    return {
      sort: sort,
      util: {
        serialize: function(node) { return serializer.serialize(node) },
        deserialize: function(node) { return serializer.deserialize(node) },
        Serializer: Serializer,
        sortByDepends: sortByDepends,
        sortByWeight: sortByWeight
      }
    }

    //===

    /**
     * Topological + Weight sort.
     * Serializes and deserializes nodes internally.
     * NOT SORTED IN PLACE!
     */
    function sort(nodes) {
      serializeNodes()
      sortNodesByDependency()
      sortNodesByWeight()
      deserializeNodes()

      return nodes

      //===

      function serializeNodes() { nodes = nodes.map(serializer.serialize) }
      function deserializeNodes() { nodes = nodes.map(serializer.deserialize) }
      function sortNodesByDependency() { nodes = sortByDepends(nodes) }
      function sortNodesByWeight() { sortByWeight(nodes) }
    }
  }

  //-[ Utility ]----------------------------------------------------------------

  /**
   * Simple object serializer that wraps nodes and guarantees the existence and
   * type of expected properties.
   */
  function Serializer(options) {
    var defaultWeight = (options && typeof options.defaultWeight === 'number') ? options.defaultWeight : 0,
        idProperty = options && options.idProperty || 'id',
        weightProperty = options && options.weightProperty || 'weight',
        dependsProperty = options && options.dependsProperty || 'depends'

    return {
      serialize: serialize,
      deserialize: deserialize
    }

    //===

    function serialize(node) {
      var id = node[idProperty],
          weight = node[weightProperty],
          depends = node[dependsProperty]
      return {
        id: typeof id !== 'undefined' && id != null ? id : node,
        weight: (typeof weight === 'number') ? weight : defaultWeight,
        depends: depends ? Array.isArray(depends) ? depends : [ depends ] : [],
        mark: undefined,
        node: node
      }
    }

    function deserialize(node) {
      return node.node
    }
  }

  /**
   * Depth-first topological sort.
   * Assumes serialized nodes.
   * NOT SORTED IN PLACE!
   */
  function sortByDepends(nodes) {
    var TEMPORARY_MARK = 1,
        PERMANENT_MARK = 2,
        result = []

    nodes.forEach(function(node) {
      if (!node.mark) {
        visit(node)
      }
    })

    return result

    //===

    function visit(node) {
      switch (node.mark) {
        case TEMPORARY_MARK:
          throw new Error('Circular dependency encountered: ' + node.id)
        case PERMANENT_MARK:
          // no-op
          break
        default:
          node.mark = TEMPORARY_MARK
          nodes.forEach(function(_) {
            if (~_.depends.indexOf(node.id)) {
              visit(_)
            }
          })
          node.mark = PERMANENT_MARK
          result.unshift(node)
      }
    }
  }

  /**
   * Sort by weight, stopping at dependency boundaries.
   * Assumes serialized nodes.
   * Uses bi-directional insertion sorts.
   * SORTED IN PLACE!
   */
  function sortByWeight(tsortedNodes) {
    var result = tsortedNodes

    // Apply negative weights
    // Forward for each after first
    runInRange(result, 1, result.length, function(node, i, arr) {
      if (node.weight < 0) {
        var nodePos
        // Swap down until a dependency
        nodePos = swapInRange(arr, i, 0, function(node, next) {
          return !~node.depends.indexOf(next.id)
        })
        // Swap up until end of equal weight
        nodePos = swapInRange(arr, nodePos, i, function(node, next) {
          return node.weight > next.weight
        })
      }
    })

    // Apply positive weights
    // Backward for each after last
    runInRange(result, result.length - 2, 0, function(node, i, arr) {
      if (node.weight > 0) {
        var nodePos
        // Swap up until a dependency
        nodePos = swapInRange(arr, i, arr.length - 1, function(node, next) {
          return !~next.depends.indexOf(node.id)
        })
        // Swap down until end of equal weight
        nodePos = swapInRange(arr, nodePos, i, function(node, next) {
          return node.weight < next.weight
        })
      }
    })

    return result
  }

  /**
   * Runs a function on each array item for the given range, "from" inclusive,
   * "to" exclusive. Works both forward and backward. If the provided function
   * returns any defined value, the loop is broken and the value is returned.
   * If all function calls return undefined (or don't return) then the
   * "defaultResult" value is returned.
   *
   * The called function is passed all parameters given to runInRange(),
   * prefixed with the current object and the current index:
   * func(object, index, array, from, to, func, defaultResult)
   */
  function runInRange(arr, from, to, fn, defaultResult) {
    if (from === to) { return }
    var step = from < to ? 1 : -1
    for (var i = from; i !== to; i += step) {
      var result = fn(arr[i], i, arr, from, to, fn, defaultResult)
      if (typeof result !== 'undefined') {
        return result
      }
    }
    return defaultResult
  }

  /**
   * Swaps the array element, starting at the "from" index, with each
   * consecutive array element up to the "to" index inclusive, as long as the
   * "compare" function returns true. When complete, the final stop index of the
   * swapped element is returned.
   *
   * The "compare" function is passed the current element and the next element
   * in sequence.
   */
  function swapInRange(arr, from, to, compare) {
    if (from === to) { return }
    var step = from < to ? 1 : -1
    return runInRange(arr, from, to, function(a, i, arr) {
      var n = i + step,
          b = arr[n]
      if (!compare(a, b)) {
        return i
      }
      arr[n] = a
      arr[i] = b
      if (n === to) {
        return n
      }
    }, from)
  }
});
