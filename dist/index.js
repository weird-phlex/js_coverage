var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/istanbul-lib-coverage/lib/percent.js
var require_percent = __commonJS({
  "node_modules/istanbul-lib-coverage/lib/percent.js"(exports, module2) {
    "use strict";
    module2.exports = function percent(covered, total) {
      let tmp;
      if (total > 0) {
        tmp = 1e3 * 100 * covered / total;
        return Math.floor(tmp / 10) / 100;
      } else {
        return 100;
      }
    };
  }
});

// node_modules/istanbul-lib-coverage/lib/data-properties.js
var require_data_properties = __commonJS({
  "node_modules/istanbul-lib-coverage/lib/data-properties.js"(exports, module2) {
    "use strict";
    module2.exports = function dataProperties(klass, properties) {
      properties.forEach((p) => {
        Object.defineProperty(klass.prototype, p, {
          enumerable: true,
          get() {
            return this.data[p];
          }
        });
      });
    };
  }
});

// node_modules/istanbul-lib-coverage/lib/coverage-summary.js
var require_coverage_summary = __commonJS({
  "node_modules/istanbul-lib-coverage/lib/coverage-summary.js"(exports, module2) {
    "use strict";
    var percent = require_percent();
    var dataProperties = require_data_properties();
    function blankSummary() {
      const empty = () => ({
        total: 0,
        covered: 0,
        skipped: 0,
        pct: "Unknown"
      });
      return {
        lines: empty(),
        statements: empty(),
        functions: empty(),
        branches: empty(),
        branchesTrue: empty()
      };
    }
    function assertValidSummary(obj) {
      const valid = obj && obj.lines && obj.statements && obj.functions && obj.branches;
      if (!valid) {
        throw new Error(
          "Invalid summary coverage object, missing keys, found:" + Object.keys(obj).join(",")
        );
      }
    }
    var CoverageSummary = class _CoverageSummary {
      /**
       * @constructor
       * @param {Object|CoverageSummary} [obj=undefined] an optional data object or
       * another coverage summary to initialize this object with.
       */
      constructor(obj) {
        if (!obj) {
          this.data = blankSummary();
        } else if (obj instanceof _CoverageSummary) {
          this.data = obj.data;
        } else {
          this.data = obj;
        }
        assertValidSummary(this.data);
      }
      /**
       * merges a second summary coverage object into this one
       * @param {CoverageSummary} obj - another coverage summary object
       */
      merge(obj) {
        const keys = [
          "lines",
          "statements",
          "branches",
          "functions",
          "branchesTrue"
        ];
        keys.forEach((key) => {
          if (obj[key]) {
            this[key].total += obj[key].total;
            this[key].covered += obj[key].covered;
            this[key].skipped += obj[key].skipped;
            this[key].pct = percent(this[key].covered, this[key].total);
          }
        });
        return this;
      }
      /**
       * returns a POJO that is JSON serializable. May be used to get the raw
       * summary object.
       */
      toJSON() {
        return this.data;
      }
      /**
       * return true if summary has no lines of code
       */
      isEmpty() {
        return this.lines.total === 0;
      }
    };
    dataProperties(CoverageSummary, [
      "lines",
      "statements",
      "functions",
      "branches",
      "branchesTrue"
    ]);
    module2.exports = {
      CoverageSummary
    };
  }
});

// node_modules/istanbul-lib-coverage/lib/file-coverage.js
var require_file_coverage = __commonJS({
  "node_modules/istanbul-lib-coverage/lib/file-coverage.js"(exports, module2) {
    "use strict";
    var percent = require_percent();
    var dataProperties = require_data_properties();
    var { CoverageSummary } = require_coverage_summary();
    function emptyCoverage(filePath, reportLogic) {
      const cov = {
        path: filePath,
        statementMap: {},
        fnMap: {},
        branchMap: {},
        s: {},
        f: {},
        b: {}
      };
      if (reportLogic) cov.bT = {};
      return cov;
    }
    function assertValidObject(obj) {
      const valid = obj && obj.path && obj.statementMap && obj.fnMap && obj.branchMap && obj.s && obj.f && obj.b;
      if (!valid) {
        throw new Error(
          "Invalid file coverage object, missing keys, found:" + Object.keys(obj).join(",")
        );
      }
    }
    var keyFromLoc = ({ start, end }) => `${start.line}|${start.column}|${end.line}|${end.column}`;
    var isObj = (o) => !!o && typeof o === "object";
    var isLineCol = (o) => isObj(o) && typeof o.line === "number" && typeof o.column === "number";
    var isLoc = (o) => isObj(o) && isLineCol(o.start) && isLineCol(o.end);
    var getLoc = (o) => isLoc(o) ? o : isLoc(o.loc) ? o.loc : null;
    var findNearestContainer = (item, map) => {
      const itemLoc = getLoc(item);
      if (!itemLoc) return null;
      let nearestContainingItem = null;
      let containerDistance = null;
      let containerKey = null;
      for (const [i, mapItem] of Object.entries(map)) {
        const mapLoc = getLoc(mapItem);
        if (!mapLoc) continue;
        const distance = [
          itemLoc.start.line - mapLoc.start.line,
          itemLoc.start.column - mapLoc.start.column,
          mapLoc.end.line - itemLoc.end.line,
          mapLoc.end.column - itemLoc.end.column
        ];
        if (distance[0] < 0 || distance[2] < 0 || distance[0] === 0 && distance[1] < 0 || distance[2] === 0 && distance[3] < 0) {
          continue;
        }
        if (nearestContainingItem === null) {
          containerDistance = distance;
          nearestContainingItem = mapItem;
          containerKey = i;
          continue;
        }
        const closerBefore = distance[0] < containerDistance[0] || distance[0] === 0 && distance[1] < containerDistance[1];
        const closerAfter = distance[2] < containerDistance[2] || distance[2] === 0 && distance[3] < containerDistance[3];
        if (closerBefore || closerAfter) {
          containerDistance = distance;
          nearestContainingItem = mapItem;
          containerKey = i;
        }
      }
      return containerKey;
    };
    var addHits = (aHits, bHits) => {
      if (typeof aHits === "number" && typeof bHits === "number") {
        return aHits + bHits;
      } else if (Array.isArray(aHits) && Array.isArray(bHits)) {
        return aHits.map((a, i) => (a || 0) + (bHits[i] || 0));
      }
      return null;
    };
    var addNearestContainerHits = (item, itemHits, map, mapHits) => {
      const container = findNearestContainer(item, map);
      if (container) {
        return addHits(itemHits, mapHits[container]);
      } else {
        return itemHits;
      }
    };
    var mergeProp = (aHits, aMap, bHits, bMap, itemKey = keyFromLoc) => {
      const aItems = {};
      for (const [key, itemHits] of Object.entries(aHits)) {
        const item = aMap[key];
        aItems[itemKey(item)] = [itemHits, item];
      }
      const bItems = {};
      for (const [key, itemHits] of Object.entries(bHits)) {
        const item = bMap[key];
        bItems[itemKey(item)] = [itemHits, item];
      }
      const mergedItems = {};
      for (const [key, aValue] of Object.entries(aItems)) {
        let aItemHits = aValue[0];
        const aItem = aValue[1];
        const bValue = bItems[key];
        if (!bValue) {
          aItemHits = addNearestContainerHits(aItem, aItemHits, bMap, bHits);
        } else {
          aItemHits = addHits(aItemHits, bValue[0]);
        }
        mergedItems[key] = [aItemHits, aItem];
      }
      for (const [key, bValue] of Object.entries(bItems)) {
        let bItemHits = bValue[0];
        const bItem = bValue[1];
        if (mergedItems[key]) continue;
        bItemHits = addNearestContainerHits(bItem, bItemHits, aMap, aHits);
        mergedItems[key] = [bItemHits, bItem];
      }
      const hits = {};
      const map = {};
      Object.values(mergedItems).forEach(([itemHits, item], i) => {
        hits[i] = itemHits;
        map[i] = item;
      });
      return [hits, map];
    };
    var FileCoverage2 = class _FileCoverage {
      /**
       * @constructor
       * @param {Object|FileCoverage|String} pathOrObj is a string that initializes
       * and empty coverage object with the specified file path or a data object that
       * has all the required properties for a file coverage object.
       */
      constructor(pathOrObj, reportLogic = false) {
        if (!pathOrObj) {
          throw new Error(
            "Coverage must be initialized with a path or an object"
          );
        }
        if (typeof pathOrObj === "string") {
          this.data = emptyCoverage(pathOrObj, reportLogic);
        } else if (pathOrObj instanceof _FileCoverage) {
          this.data = pathOrObj.data;
        } else if (typeof pathOrObj === "object") {
          this.data = pathOrObj;
        } else {
          throw new Error("Invalid argument to coverage constructor");
        }
        assertValidObject(this.data);
      }
      /**
       * returns computed line coverage from statement coverage.
       * This is a map of hits keyed by line number in the source.
       */
      getLineCoverage() {
        const statementMap = this.data.statementMap;
        const statements = this.data.s;
        const lineMap = /* @__PURE__ */ Object.create(null);
        Object.entries(statements).forEach(([st, count]) => {
          if (!statementMap[st]) {
            return;
          }
          const { line } = statementMap[st].start;
          const prevVal = lineMap[line];
          if (prevVal === void 0 || prevVal < count) {
            lineMap[line] = count;
          }
        });
        return lineMap;
      }
      /**
       * returns an array of uncovered line numbers.
       * @returns {Array} an array of line numbers for which no hits have been
       *  collected.
       */
      getUncoveredLines() {
        const lc = this.getLineCoverage();
        const ret = [];
        Object.entries(lc).forEach(([l, hits]) => {
          if (hits === 0) {
            ret.push(l);
          }
        });
        return ret;
      }
      /**
       * returns a map of branch coverage by source line number.
       * @returns {Object} an object keyed by line number. Each object
       * has a `covered`, `total` and `coverage` (percentage) property.
       */
      getBranchCoverageByLine() {
        const branchMap = this.branchMap;
        const branches = this.b;
        const ret = {};
        Object.entries(branchMap).forEach(([k, map]) => {
          const line = map.line || map.loc.start.line;
          const branchData = branches[k];
          ret[line] = ret[line] || [];
          ret[line].push(...branchData);
        });
        Object.entries(ret).forEach(([k, dataArray]) => {
          const covered = dataArray.filter((item) => item > 0);
          const coverage = covered.length / dataArray.length * 100;
          ret[k] = {
            covered: covered.length,
            total: dataArray.length,
            coverage
          };
        });
        return ret;
      }
      /**
       * return a JSON-serializable POJO for this file coverage object
       */
      toJSON() {
        return this.data;
      }
      /**
       * merges a second coverage object into this one, updating hit counts
       * @param {FileCoverage} other - the coverage object to be merged into this one.
       *  Note that the other object should have the same structure as this one (same file).
       */
      merge(other) {
        if (other.all === true) {
          return;
        }
        if (this.all === true) {
          this.data = other.data;
          return;
        }
        let [hits, map] = mergeProp(
          this.s,
          this.statementMap,
          other.s,
          other.statementMap
        );
        this.data.s = hits;
        this.data.statementMap = map;
        const keyFromLocProp = (x) => keyFromLoc(x.loc);
        const keyFromLocationsProp = (x) => keyFromLoc(x.locations[0]);
        [hits, map] = mergeProp(
          this.f,
          this.fnMap,
          other.f,
          other.fnMap,
          keyFromLocProp
        );
        this.data.f = hits;
        this.data.fnMap = map;
        [hits, map] = mergeProp(
          this.b,
          this.branchMap,
          other.b,
          other.branchMap,
          keyFromLocationsProp
        );
        this.data.b = hits;
        this.data.branchMap = map;
        if (this.bT && other.bT) {
          [hits, map] = mergeProp(
            this.bT,
            this.branchMap,
            other.bT,
            other.branchMap,
            keyFromLocationsProp
          );
          this.data.bT = hits;
        }
      }
      computeSimpleTotals(property) {
        let stats = this[property];
        if (typeof stats === "function") {
          stats = stats.call(this);
        }
        const ret = {
          total: Object.keys(stats).length,
          covered: Object.values(stats).filter((v) => !!v).length,
          skipped: 0
        };
        ret.pct = percent(ret.covered, ret.total);
        return ret;
      }
      computeBranchTotals(property) {
        const stats = this[property];
        const ret = { total: 0, covered: 0, skipped: 0 };
        Object.values(stats).forEach((branches) => {
          ret.covered += branches.filter((hits) => hits > 0).length;
          ret.total += branches.length;
        });
        ret.pct = percent(ret.covered, ret.total);
        return ret;
      }
      /**
       * resets hit counts for all statements, functions and branches
       * in this coverage object resulting in zero coverage.
       */
      resetHits() {
        const statements = this.s;
        const functions = this.f;
        const branches = this.b;
        const branchesTrue = this.bT;
        Object.keys(statements).forEach((s) => {
          statements[s] = 0;
        });
        Object.keys(functions).forEach((f) => {
          functions[f] = 0;
        });
        Object.keys(branches).forEach((b) => {
          branches[b].fill(0);
        });
        if (branchesTrue) {
          Object.keys(branchesTrue).forEach((bT) => {
            branchesTrue[bT].fill(0);
          });
        }
      }
      /**
       * returns a CoverageSummary for this file coverage object
       * @returns {CoverageSummary}
       */
      toSummary() {
        const ret = {};
        ret.lines = this.computeSimpleTotals("getLineCoverage");
        ret.functions = this.computeSimpleTotals("f", "fnMap");
        ret.statements = this.computeSimpleTotals("s", "statementMap");
        ret.branches = this.computeBranchTotals("b");
        if (this.bT) {
          ret.branchesTrue = this.computeBranchTotals("bT");
        }
        return new CoverageSummary(ret);
      }
    };
    dataProperties(FileCoverage2, [
      "path",
      "statementMap",
      "fnMap",
      "branchMap",
      "s",
      "f",
      "b",
      "bT",
      "all"
    ]);
    module2.exports = {
      FileCoverage: FileCoverage2,
      // exported for testing
      findNearestContainer,
      addHits,
      addNearestContainerHits
    };
  }
});

// src/main.js
var { FileCoverage } = require_file_coverage();
function addLineCoverage(rawIstanbulCoverage) {
  const fileCoverage = new FileCoverage(rawIstanbulCoverage);
  const lineCoverage = fileCoverage.getLineCoverage();
  fileCoverage.data.l = stripNullPrototype(lineCoverage);
  return fileCoverage;
}
function simpleCovCoverage(enrichedIstanbulCoverage) {
  return convert(enrichedIstanbulCoverage);
}
function stripNullPrototype(nullPrototypeObject) {
  return JSON.parse(JSON.stringify(nullPrototypeObject));
}
function simplecovLines(istanbulL) {
  const keys = Object.keys(istanbulL).map(Number);
  const lastLine = Math.max(...keys);
  const hitCounts = new Array(lastLine);
  for (let line = 1; line <= lastLine; line++) {
    if (line in istanbulL) {
      hitCounts[line - 1] = istanbulL[line];
    } else {
      hitCounts[line - 1] = null;
    }
  }
  return hitCounts;
}
function simplecovBranches(istanbulB, istanbulBranchMap) {
  let runningIndex = 0;
  if (Object.keys(istanbulBranchMap).length === 0) {
    return {};
  }
  const merged = Object.entries(istanbulBranchMap).map(([id, branch]) => {
    return {
      ...branch,
      hits: istanbulB[id] || []
      // Ensure hits is empty array if no data exists for this branch
    };
  });
  const result = merged.reduce((acc, branch) => {
    const outer = [
      branch.type,
      runningIndex,
      branch.loc.start.line,
      branch.loc.start.column,
      branch.loc.end.line,
      branch.loc.end.column
    ];
    runningIndex += 1;
    const inner = branch.locations.map((loc, index) => {
      const hits = branch.hits[index] || 0;
      runningIndex += 1;
      return [
        [
          `${branch.type}-${index}`,
          runningIndex - 1,
          loc.start.line,
          loc.start.column,
          loc.end.line,
          loc.end.column
        ],
        hits
      ];
    });
    acc[outer] = Object.fromEntries(inner);
    return acc;
  }, {});
  return result;
}
function convert(input) {
  const coverage = Object.fromEntries(
    Object.values(input).map((item) => [
      item.path,
      {
        lines: simplecovLines(item.l),
        branches: simplecovBranches(item.b, item.branchMap)
      }
    ])
  );
  return {
    jasmine: {
      coverage
    }
  };
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    addLineCoverage,
    simpleCovCoverage
  };
}
export {
  addLineCoverage,
  simpleCovCoverage
};
