/** Pay amounts are shown to a creator only when the owner made their personal terms visible (creators.terms_visible). */
let visible = false;
export const setTermsVisible = (v: boolean) => { visible = v; };
// Payments are off: no amount is ever shown in the creator space, whatever terms_visible says.
export const termsVisible = () => visible && false;
export const meTermsVisible = (me: unknown) => Boolean((me as { terms_visible?: boolean } | null)?.terms_visible);
