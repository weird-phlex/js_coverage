import { istanbulWithLineCov } from '../fixtures/istanbul_with_line_cov.mjs'
import { simplecovResultset } from '../fixtures/simplecov_resultset.mjs'
import { simpleCovCoverage } from '../../dist/index.js'

describe('simpleCovCoverage', function() {
  let input
  let expectedOutput

  beforeEach(function() {
    input = istanbulWithLineCov()
    expectedOutput = simplecovResultset()
  })

  it('should be correct', function() {
    let output = simpleCovCoverage(input)
    // console.log(output)
    expect(output).toEqual(expectedOutput)
  })
})
