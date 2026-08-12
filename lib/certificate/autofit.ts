/** Marks a block whose type size has not settled yet. `captureCertificate` waits
 *  for every one of these to clear before photographing the page, so an export
 *  can never catch the pre-fit layout. Renaming it breaks export fidelity
 *  silently.
 *
 *  It lives here rather than beside the component because the capture code is
 *  server-only and `AutoFitText` is a client module. */
export const AUTOFIT_PENDING_ATTRIBUTE = "data-autofit-pending";
