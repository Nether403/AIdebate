// Feature: showcase-redesign, Property 6: Image alt-text obeys informational and decorative bounds
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import {
  BRAND_IMAGES,
  isValidBrandImage,
  INFORMATIONAL_ALT_MIN,
  INFORMATIONAL_ALT_MAX,
  type BrandImage,
} from '../manifest'

/**
 * Property 6: Image alt-text obeys informational and decorative bounds.
 *
 * For all brand/content images in the image registry, an informational image
 * (decorative === false) has alt text whose length is between 1 and 250
 * characters inclusive, and a decorative image (decorative === true) has an
 * empty alt text ('').
 *
 * Two complementary parts:
 *   1. Real-data invariant — every shipped BRAND_IMAGES entry satisfies
 *      `isValidBrandImage`: informational alts land in 1..250, decorative alts
 *      are empty. This is what the renderer emits to the DOM.
 *   2. Generator-based — across random `decorative` booleans and alt strings
 *      straddling the boundaries (lengths 0, 1, 250, >250), `isValidBrandImage`
 *      returns true exactly when the spec condition holds, recomputed
 *      independently by an oracle.
 *
 * Validates: Requirements 8.1, 8.2
 */

// Independent oracle: recompute the contract from the spec, not from the SUT.
function expectedValid(image: BrandImage): boolean {
  if (image.decorative) {
    return image.alt === ''
  }
  return (
    image.alt.length >= INFORMATIONAL_ALT_MIN && image.alt.length <= INFORMATIONAL_ALT_MAX
  )
}

// Alt strings that straddle every boundary the bounds care about: empty (0),
// lower bound (1), upper bound (250), and over-long (>250). Plus a free-form
// string to explore the in-range interior and the empty case for decoratives.
const altArb = fc.oneof(
  fc.constant(''),
  fc.string({ minLength: 1, maxLength: 1 }),
  fc.string({ minLength: INFORMATIONAL_ALT_MAX, maxLength: INFORMATIONAL_ALT_MAX }),
  fc.string({ minLength: INFORMATIONAL_ALT_MAX + 1, maxLength: INFORMATIONAL_ALT_MAX + 50 }),
  fc.string({ minLength: 0, maxLength: 300 })
)

const imageArb: fc.Arbitrary<BrandImage> = fc.record({
  src: fc.webPath(),
  alt: altArb,
  decorative: fc.boolean(),
})

test('Property 6: image alt-text obeys informational and decorative bounds', () => {
  // Part 1: real-data invariant — the shipped registry the renderer consumes.
  for (const image of BRAND_IMAGES) {
    if (image.decorative) {
      assert.equal(image.alt, '', `decorative image must have empty alt: ${image.src}`)
    } else {
      assert.ok(
        image.alt.length >= INFORMATIONAL_ALT_MIN &&
          image.alt.length <= INFORMATIONAL_ALT_MAX,
        `informational alt out of bounds for ${image.src}: ${image.alt.length}`
      )
    }
    assert.ok(isValidBrandImage(image), `image rejected by validator: ${image.src}`)
  }

  // Part 2: generator-based — validator agrees with the independent oracle on
  // both valid and invalid images.
  fc.assert(
    fc.property(imageArb, (image) => {
      assert.equal(isValidBrandImage(image), expectedValid(image))
    }),
    { numRuns: 200 }
  )
})
