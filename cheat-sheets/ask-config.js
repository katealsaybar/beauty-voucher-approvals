/* Where the question widget sends its questions.
 *
 * Kept separate from ask-widget.js on purpose: this is the one file that changes
 * per environment. Leave ENDPOINT empty and the widget still loads, and simply
 * tells anyone who asks that the service is not switched on yet.
 *
 * The key below is Supabase's publishable key, which is designed to be public
 * and is already carried in the open by the approval pack's notes widget. It is
 * not a secret. The Anthropic key is, and it never leaves the edge function.
 */
window.TRS_ASK_ENDPOINT = "https://gvijxenafoowajqktqvd.supabase.co/functions/v1/cheat-sheet-ask";
window.TRS_ASK_ANON_KEY = "sb_publishable_e5o0vPayb-6552oARTeu7Q_KoqfT7xO";
