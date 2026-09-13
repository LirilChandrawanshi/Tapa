/**
 * A row of chips that slides on a phone instead of wrapping.
 *
 * Filter rows kept stacking into three, four and five rows on a 390px
 * screen, pushing the results they filter below the fold — the control ended
 * up taller than the thing it controls. Sliding keeps every option reachable
 * in one row.
 *
 * Exported as a class string rather than a wrapper component because these
 * rows already carry their own roles, aria-labels and spacing; this only
 * needs to replace the `flex flex-wrap gap-*` part.
 *
 * The negative margin plus matching padding lets the first and last chip sit
 * flush with the page gutter while still scrolling edge to edge.
 *
 * Not for navigation. A footer link list that wraps is fine; hiding links
 * off-screen behind a scroll would be worse than the extra rows.
 */
const SCROLL =
  // min-w-0 / max-w-full are load-bearing, not belt-and-braces. With
  // [&>*]:shrink-0 the chips stop compressing, so without these the row's
  // content width propagates to its parent and widens the whole page —
  // which is exactly what it did on /search.
  "flex min-w-0 max-w-full overflow-x-auto pb-1 " +
  "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden " +
  "[&>*]:shrink-0 " +
  "sm:flex-wrap sm:overflow-x-visible sm:pb-0";

/**
 * For a row sitting directly on the page gutter. The negative margin plus
 * matching padding lets the chips scroll edge to edge while the first one
 * still lines up with the text above it.
 */
export const SLIDE_ROW = `-mx-4 px-4 ${SCROLL} sm:mx-0 sm:px-0`;

/**
 * For a row inside a bordered card, where a negative margin would punch the
 * chips through the border.
 */
export const SLIDE_ROW_INSET = SCROLL;
