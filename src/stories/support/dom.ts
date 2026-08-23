/**
 * Raw-DOM helpers for story `play` functions.
 *
 * Stories query through `within(canvasElement)` and accessible roles wherever
 * they can — see docs/design-system.md. Raw DOM is for the contracts the query
 * layer cannot express: resolved geometry, computed style, hit testing, portal
 * placement. Those need an element rather than a nullable one, and every story
 * that needed one was writing its own three-line "query or throw" — nineteen
 * of them, which is nineteen slightly different failure messages.
 */

/** The element matching `selector`, or a failure that says what was missing. */
export function element(root: ParentNode, selector: string): Element {
  const found = root.querySelector(selector)
  if (found === null) throw new Error(`no element matching ${selector}`)

  return found
}
