/** ISO 3166-1 alpha-2 codes; names come from Intl so nothing is hand-typed. */
const CODES =
  "AF AX AL DZ AS AD AO AI AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BA BW BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR XK KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG MK NO OM PK PW PS PA PG PY PE PH PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TC TV UG UA AE GB US UY UZ VU VA VE VN VG VI YE ZM ZW".split(
    " ",
  );

let cache: string[] | null = null;

/** Sorted English country names. */
export function countryNames(): string[] {
  if (cache) return cache;
  let names: string[];
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    names = CODES.map((c) => dn.of(c) ?? c);
  } catch {
    names = CODES;
  }
  cache = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  return cache;
}
