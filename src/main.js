const { FileCoverage } = require('istanbul-lib-coverage/lib/file-coverage.js');
export { FileCoverage }

// rawIstanbulCoverage: The raw Instanbul coverage data for a single file.
export function addLineCoverage(rawIstanbulCoverage) {
  const fileCoverage = new FileCoverage(rawIstanbulCoverage)
  const lineCoverage = fileCoverage.getLineCoverage()
  fileCoverage.data.l = stripNullPrototype(lineCoverage)
  return fileCoverage
}

// enrichedIstanbulCoverage: The Instanbul coverage data including line coverage for all files.
export function simpleCovCoverage(enrichedIstanbulCoverage) {
  return convert(enrichedIstanbulCoverage)
}

function stripNullPrototype(nullPrototypeObject) {
  return JSON.parse(JSON.stringify(nullPrototypeObject))
}

function simplecovLines(istanbulL) {
  const keys = Object.keys(istanbulL).map(Number);
  const lastLine = Math.max(...keys);

  const hitCounts = new Array(lastLine);
  for (let line = 1; line <= lastLine; line++) {
    if (line in istanbulL) {
      hitCounts[line - 1] = istanbulL[line]
    } else {
      hitCounts[line - 1] = null
    }
  }

  return hitCounts;
}

function simplecovBranches(istanbulB, istanbulBranchMap) {
  let runningIndex = 0;
  
  // Check if branchMap is empty
  if (Object.keys(istanbulBranchMap).length === 0) {
    return {}; // If no branches, return empty object
  }

  const merged = Object.entries(istanbulBranchMap).map(([id, branch]) => {
    return {
      ...branch,
      hits: istanbulB[id] || [] // Ensure hits is empty array if no data exists for this branch
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
      const hits = branch.hits[index] || 0; // Ensure no undefined hits
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    addLineCoverage,
    simpleCovCoverage
  }
}
