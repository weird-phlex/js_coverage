import { istanbulRawCoverage } from '../fixtures/istanbul_raw_coverage.mjs'
import { istanbulWithLineCov } from '../fixtures/istanbul_with_line_cov.mjs'
import { addLineCoverage } from '../../dist/index.js'

describe('addLineCoverage', function() {
  let input
  let expectedOutput

  beforeEach(function() {
    input = istanbulRawCoverage()
    expectedOutput = istanbulWithLineCov()
  })

  it('should be correct', function() {
    let output = {}
    for (const [filePath, coverageData] of Object.entries(input)) {
      output[filePath] = addLineCoverage(coverageData).data
    }
    // console.log(output)
    expect(output).toEqual(expectedOutput)
  })
})
