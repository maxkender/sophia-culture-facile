/** Ruul (ruul.io) payment partner — shared constants, safe for client and server. */

/** Countries Ruul cannot pay (ISO 3166-1 alpha-2). Crimea and the Donetsk, Kherson, Luhansk and Zaporizhzhia regions are also unsupported. */
export const RUUL_BLOCKED = ["AF", "BY", "BW", "BI", "CF", "CU", "CD", "ER", "EE", "GW", "IR", "IQ", "CI", "KZ", "LB", "LY", "MM", "KP", "RU", "SO", "SS", "SD", "SY", "VE", "YE", "ZW"];

/** Ruul bulk-payment sample file, copied exactly: sheet name, header row and helper row. */
export const RUUL_SHEET = "Transaction List";
export const RUUL_HEADERS = [
  "FREELANCER'S E-MAIL",
  "FREELANCER'S FIRST NAME (OPTIONAL)",
  "FREELANCER'S LAST NAME (OPTIONAL)",
  "INVOICE DESCRIPTION (OPTIONAL)",
  "INVOICE AMOUNT",
  "PAYOUT CURRENCY",
];
export const RUUL_HELPERS = [
  "Freelancer's e-mail address.",
  "Freelancer's first name.",
  "Freelancer's last name.",
  "Details of the service you've received.",
  "Net amount to be received by your freelancer.",
  "Your freelancer will receive the payment in this currency.",
];
/** Ruul's minimum per payment, in EUR. */
export const RUUL_MIN_EUR = 100;
/** At most 500 data rows per file. */
export const RUUL_MAX_ROWS = 500;

/** Countries closed for slideshow posters (no new applications accepted). */
export const SLIDESHOW_CLOSED: string[] = ["ID"];
