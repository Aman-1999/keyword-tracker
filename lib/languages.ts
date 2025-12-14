/**
 * Comprehensive list of language codes supported by DataForSEO API
 * Based on ISO 639-1 standard
 */

export interface Language {
    code: string;
    label: string;
    nativeName?: string;
}

export const LANGUAGES: Language[] = [
    { code: 'en', label: 'English', nativeName: 'English' },
    { code: 'es', label: 'Spanish', nativeName: 'Español' },
    { code: 'fr', label: 'French', nativeName: 'Français' },
    { code: 'de', label: 'German', nativeName: 'Deutsch' },
    { code: 'it', label: 'Italian', nativeName: 'Italiano' },
    { code: 'pt', label: 'Portuguese', nativeName: 'Português' },
    { code: 'ru', label: 'Russian', nativeName: 'Русский' },
    { code: 'ja', label: 'Japanese', nativeName: '日本語' },
    { code: 'ko', label: 'Korean', nativeName: '한국어' },
    { code: 'zh', label: 'Chinese', nativeName: '中文' },
    { code: 'ar', label: 'Arabic', nativeName: 'العربية' },
    { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'bn', label: 'Bengali', nativeName: 'বাংলা' },
    { code: 'pa', label: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
    { code: 'te', label: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'mr', label: 'Marathi', nativeName: 'मराठी' },
    { code: 'ta', label: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'tr', label: 'Turkish', nativeName: 'Türkçe' },
    { code: 'vi', label: 'Vietnamese', nativeName: 'Tiếng Việt' },
    { code: 'pl', label: 'Polish', nativeName: 'Polski' },
    { code: 'uk', label: 'Ukrainian', nativeName: 'Українська' },
    { code: 'nl', label: 'Dutch', nativeName: 'Nederlands' },
    { code: 'ro', label: 'Romanian', nativeName: 'Română' },
    { code: 'el', label: 'Greek', nativeName: 'Ελληνικά' },
    { code: 'cs', label: 'Czech', nativeName: 'Čeština' },
    { code: 'sv', label: 'Swedish', nativeName: 'Svenska' },
    { code: 'hu', label: 'Hungarian', nativeName: 'Magyar' },
    { code: 'fi', label: 'Finnish', nativeName: 'Suomi' },
    { code: 'no', label: 'Norwegian', nativeName: 'Norsk' },
    { code: 'da', label: 'Danish', nativeName: 'Dansk' },
    { code: 'sk', label: 'Slovak', nativeName: 'Slovenčina' },
    { code: 'bg', label: 'Bulgarian', nativeName: 'Български' },
    { code: 'hr', label: 'Croatian', nativeName: 'Hrvatski' },
    { code: 'sr', label: 'Serbian', nativeName: 'Српски' },
    { code: 'lt', label: 'Lithuanian', nativeName: 'Lietuvių' },
    { code: 'lv', label: 'Latvian', nativeName: 'Latviešu' },
    { code: 'et', label: 'Estonian', nativeName: 'Eesti' },
    { code: 'sl', label: 'Slovenian', nativeName: 'Slovenščina' },
    { code: 'th', label: 'Thai', nativeName: 'ไทย' },
    { code: 'id', label: 'Indonesian', nativeName: 'Bahasa Indonesia' },
    { code: 'ms', label: 'Malay', nativeName: 'Bahasa Melayu' },
    { code: 'he', label: 'Hebrew', nativeName: 'עברית' },
    { code: 'fa', label: 'Persian', nativeName: 'فارسی' },
    { code: 'ur', label: 'Urdu', nativeName: 'اردو' },
    { code: 'sw', label: 'Swahili', nativeName: 'Kiswahili' },
    { code: 'af', label: 'Afrikaans', nativeName: 'Afrikaans' },
    { code: 'sq', label: 'Albanian', nativeName: 'Shqip' },
    { code: 'am', label: 'Amharic', nativeName: 'አማርኛ' },
    { code: 'hy', label: 'Armenian', nativeName: 'Հայերեն' },
    { code: 'az', label: 'Azerbaijani', nativeName: 'Azərbaycan' },
    { code: 'eu', label: 'Basque', nativeName: 'Euskara' },
    { code: 'be', label: 'Belarusian', nativeName: 'Беларуская' },
    { code: 'bs', label: 'Bosnian', nativeName: 'Bosanski' },
    { code: 'ca', label: 'Catalan', nativeName: 'Català' },
    { code: 'ceb', label: 'Cebuano', nativeName: 'Cebuano' },
    { code: 'ny', label: 'Chichewa', nativeName: 'Chichewa' },
    { code: 'co', label: 'Corsican', nativeName: 'Corsu' },
    { code: 'eo', label: 'Esperanto', nativeName: 'Esperanto' },
    { code: 'tl', label: 'Filipino', nativeName: 'Filipino' },
    { code: 'fy', label: 'Frisian', nativeName: 'Frysk' },
    { code: 'gl', label: 'Galician', nativeName: 'Galego' },
    { code: 'ka', label: 'Georgian', nativeName: 'ქართული' },
    { code: 'gu', label: 'Gujarati', nativeName: 'ગુજરાતી' },
    { code: 'ht', label: 'Haitian Creole', nativeName: 'Kreyòl Ayisyen' },
    { code: 'ha', label: 'Hausa', nativeName: 'Hausa' },
    { code: 'haw', label: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi' },
    { code: 'hmn', label: 'Hmong', nativeName: 'Hmong' },
    { code: 'is', label: 'Icelandic', nativeName: 'Íslenska' },
    { code: 'ig', label: 'Igbo', nativeName: 'Igbo' },
    { code: 'ga', label: 'Irish', nativeName: 'Gaeilge' },
    { code: 'jw', label: 'Javanese', nativeName: 'Basa Jawa' },
    { code: 'kn', label: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'kk', label: 'Kazakh', nativeName: 'Қазақ' },
    { code: 'km', label: 'Khmer', nativeName: 'ខ្មែរ' },
    { code: 'ku', label: 'Kurdish', nativeName: 'Kurdî' },
    { code: 'ky', label: 'Kyrgyz', nativeName: 'Кыргызча' },
    { code: 'lo', label: 'Lao', nativeName: 'ລາວ' },
    { code: 'la', label: 'Latin', nativeName: 'Latina' },
    { code: 'lb', label: 'Luxembourgish', nativeName: 'Lëtzebuergesch' },
    { code: 'mk', label: 'Macedonian', nativeName: 'Македонски' },
    { code: 'mg', label: 'Malagasy', nativeName: 'Malagasy' },
    { code: 'ml', label: 'Malayalam', nativeName: 'മലയാളം' },
    { code: 'mt', label: 'Maltese', nativeName: 'Malti' },
    { code: 'mi', label: 'Maori', nativeName: 'Māori' },
    { code: 'mn', label: 'Mongolian', nativeName: 'Монгол' },
    { code: 'my', label: 'Myanmar (Burmese)', nativeName: 'မြန်မာ' },
    { code: 'ne', label: 'Nepali', nativeName: 'नेपाली' },
    { code: 'ps', label: 'Pashto', nativeName: 'پښتو' },
    { code: 'sm', label: 'Samoan', nativeName: 'Gagana Samoa' },
    { code: 'gd', label: 'Scots Gaelic', nativeName: 'Gàidhlig' },
    { code: 'st', label: 'Sesotho', nativeName: 'Sesotho' },
    { code: 'sn', label: 'Shona', nativeName: 'Shona' },
    { code: 'sd', label: 'Sindhi', nativeName: 'سنڌي' },
    { code: 'si', label: 'Sinhala', nativeName: 'සිංහල' },
    { code: 'so', label: 'Somali', nativeName: 'Soomaali' },
    { code: 'su', label: 'Sundanese', nativeName: 'Basa Sunda' },
    { code: 'tg', label: 'Tajik', nativeName: 'Тоҷикӣ' },
    { code: 'tt', label: 'Tatar', nativeName: 'Татар' },
    { code: 'tk', label: 'Turkmen', nativeName: 'Türkmen' },
    { code: 'ug', label: 'Uyghur', nativeName: 'ئۇيغۇر' },
    { code: 'uz', label: 'Uzbek', nativeName: 'Oʻzbek' },
    { code: 'cy', label: 'Welsh', nativeName: 'Cymraeg' },
    { code: 'xh', label: 'Xhosa', nativeName: 'isiXhosa' },
    { code: 'yi', label: 'Yiddish', nativeName: 'ייִדיש' },
    { code: 'yo', label: 'Yoruba', nativeName: 'Yorùbá' },
    { code: 'zu', label: 'Zulu', nativeName: 'isiZulu' },
];

/**
 * Get language label by code
 */
export function getLanguageLabel(code: string): string {
    const language = LANGUAGES.find(lang => lang.code === code);
    return language ? language.label : code.toUpperCase();
}

/**
 * Get language by code
 */
export function getLanguage(code: string): Language | undefined {
    return LANGUAGES.find(lang => lang.code === code);
}

/**
 * Check if language code is valid
 */
export function isValidLanguageCode(code: string): boolean {
    return LANGUAGES.some(lang => lang.code === code);
}
// Basic mapping of country codes (ISO 3166-1 alpha-2) to language codes (ISO 639-1)
// This is a comprehensive list but can be expanded/refined as needed
/**
 * ISO 3166-1 alpha-2 → ISO 639-1 default language mapping
 * Default language chosen based on:
 * - Government / business usage
 * - Search engine behavior
 * - DataForSEO practical defaults
 */

/**
 * ISO 3166-1 alpha-2 → ISO 639-1 default language mapping
 * Default language chosen based on:
 * - Government / business usage
 * - Search engine behavior
 * - DataForSEO practical defaults
 */

export const COUNTRY_TO_LANGUAGE: Record<string, string> = {
    // A
    AF: 'ps',
    AL: 'sq',
    DZ: 'ar',
    AS: 'en',
    AD: 'ca',
    AO: 'pt',
    AI: 'en',
    AG: 'en',
    AR: 'es',
    AM: 'hy',
    AW: 'nl',
    AU: 'en',
    AT: 'de',
    AZ: 'az',

    // B
    BS: 'en',
    BH: 'ar',
    BD: 'bn',
    BB: 'en',
    BY: 'be',
    BE: 'nl',
    BZ: 'en',
    BJ: 'fr',
    BM: 'en',
    BT: 'dz',
    BO: 'es',
    BA: 'bs',
    BW: 'en',
    BR: 'pt',
    BN: 'ms',
    BG: 'bg',
    BF: 'fr',
    BI: 'fr',

    // C
    KH: 'km',
    CM: 'fr',
    CA: 'en',
    CV: 'pt',
    KY: 'en',
    CF: 'fr',
    TD: 'fr',
    CL: 'es',
    CN: 'zh',
    CO: 'es',
    KM: 'ar',
    CG: 'fr',
    CD: 'fr',
    CR: 'es',
    CI: 'fr',
    HR: 'hr',
    CU: 'es',
    CY: 'el',
    CZ: 'cs',

    // D
    DK: 'da',
    DJ: 'fr',
    DM: 'en',
    DO: 'es',

    // E
    EC: 'es',
    EG: 'ar',
    SV: 'es',
    GQ: 'es',
    ER: 'ti',
    EE: 'et',
    SZ: 'en',
    ET: 'am',

    // F
    FJ: 'en',
    FI: 'fi',
    FR: 'fr',

    // G
    GA: 'fr',
    GM: 'en',
    GE: 'ka',
    DE: 'de',
    GH: 'en',
    GR: 'el',
    GD: 'en',
    GT: 'es',
    GN: 'fr',
    GW: 'pt',
    GY: 'en',

    // H
    HT: 'fr',
    HN: 'es',
    HK: 'zh',
    HU: 'hu',

    // I
    IS: 'is',
    IN: 'en',
    ID: 'id',
    IR: 'fa',
    IQ: 'ar',
    IE: 'en',
    IL: 'he',
    IT: 'it',

    // J
    JM: 'en',
    JP: 'ja',
    JO: 'ar',

    // K
    KZ: 'kk',
    KE: 'en',
    KI: 'en',
    KP: 'ko',
    KR: 'ko',
    KW: 'ar',
    KG: 'ky',

    // L
    LA: 'lo',
    LV: 'lv',
    LB: 'ar',
    LS: 'en',
    LR: 'en',
    LY: 'ar',
    LI: 'de',
    LT: 'lt',
    LU: 'lb',

    // M
    MO: 'zh',
    MG: 'fr',
    MW: 'en',
    MY: 'ms',
    MV: 'dv',
    ML: 'fr',
    MT: 'mt',
    MH: 'en',
    MR: 'ar',
    MU: 'en',
    MX: 'es',
    FM: 'en',
    MD: 'ro',
    MC: 'fr',
    MN: 'mn',
    ME: 'sr',
    MA: 'ar',
    MZ: 'pt',
    MM: 'my',

    // N
    NA: 'en',
    NR: 'en',
    NP: 'ne',
    NL: 'nl',
    NZ: 'en',
    NI: 'es',
    NE: 'fr',
    NG: 'en',
    NO: 'no',

    // O
    OM: 'ar',

    // P
    PK: 'ur',
    PW: 'en',
    PA: 'es',
    PG: 'en',
    PY: 'es',
    PE: 'es',
    PH: 'en',
    PL: 'pl',
    PT: 'pt',
    PR: 'es',

    // Q
    QA: 'ar',

    // R
    RO: 'ro',
    RU: 'ru',
    RW: 'rw',

    // S
    SA: 'ar',
    SN: 'fr',
    RS: 'sr',
    SC: 'en',
    SL: 'en',
    SG: 'en',
    SK: 'sk',
    SI: 'sl',
    SB: 'en',
    SO: 'so',
    ZA: 'en',
    ES: 'es',
    LK: 'si',
    SD: 'ar',
    SR: 'nl',
    SE: 'sv',
    CH: 'de',
    SY: 'ar',

    // T
    TW: 'zh',
    TJ: 'tg',
    TZ: 'en',
    TH: 'th',
    TL: 'pt',
    TG: 'fr',
    TO: 'en',
    TT: 'en',
    TN: 'ar',
    TR: 'tr',
    TM: 'tk',

    // U
    UG: 'en',
    UA: 'uk',
    AE: 'en',
    GB: 'en',
    US: 'en',
    UY: 'es',
    UZ: 'uz',

    // V
    VU: 'en',
    VE: 'es',
    VN: 'vi',

    // Y
    YE: 'ar',

    // Z
    ZM: 'en',
    ZW: 'en',
};



/**
 * Get language code for a given country code
 */
export function getLanguageForCountry(countryCode: string): string | undefined {
    if (!countryCode) return undefined;
    return COUNTRY_TO_LANGUAGE[countryCode.toUpperCase()];
}
