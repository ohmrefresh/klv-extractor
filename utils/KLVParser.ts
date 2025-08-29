/**
 * KLV Parser Utility
 * Handles parsing and validation of Key-Length-Value data format
 */

export interface KLVEntry {
  key: string;
  len: number;
  value: string;
  pos: number;
  name: string;
  formattedValue?: string;
  currencyInfo?: {
    code: string;
    name: string;
    flag: string;
  };
  mccInfo?: {
    code: string;
    description: string;
  };
}

export interface KLVParseResult {
  results: KLVEntry[];
  errors: string[];
}

export interface KLVValidationResult {
  isValid: boolean;
  entriesCount: number;
  errors: string[];
  totalLength: number;
}

export interface KLVBuildEntry {
  key: string;
  value: string;
}

type ExportFormat = 'json' | 'csv' | 'table';

const KLVParser = {
  // Complete KLV definitions
  definitions: {
    '002': 'Tracking Number',
    '004': 'Original Transaction Amount',
    '010': 'Conversion Rate',
    '026': 'Merchant Category Code',
    '032': 'Acquiring Institution Code',
    '037': 'Retrieval Reference Number',
    '041': 'Terminal ID',
    '042': 'Merchant Identifier',
    '043': 'Merchant Description',
    '044': 'Merchant Name',
    '045': 'Transaction Type Identifier',
    '048': 'Fraud Scoring Data',
    '049': 'Original Currency Code',
    '050': 'From Account',
    '052': 'Pin Block',
    '061': 'POS Data',
    '063': 'TraceID',
    '067': 'Extended Payment Code',
    '068': 'Is Recurring',
    '069': 'Message Reason Code',
    '085': 'Markup Amount',
    '108': 'Recipient Name',
    '109': 'Recipient Address',
    '110': 'Recipient Account Number',
    '111': 'Recipient Account Number Type',
    '250': 'Capture Mode',
    '251': 'Network',
    '252': 'Fee Type',
    '253': 'Last Four Digits PAN',
    '254': 'MDES Digitized PAN',
    '255': 'MDES Digitized Wallet ID',
    '256': 'Adjustment Reason',
    '257': 'Reference ID',
    '258': 'Markup Type',
    '259': 'Acquirer Country',
    '260': 'Mobile Number',
    '261': 'Transaction Fee Amount',
    '262': 'Transaction Subtype',
    '263': 'Card Issuer Data',
    '264': 'Tax',
    '265': 'Tax Amount Base',
    '266': 'Retailer Data',
    '267': 'IAC Tax Amount',
    '268': 'Number of Installments',
    '269': 'Customer ID',
    '270': 'Security Services Data',
    '271': 'On Behalf of Services',
    '272': 'Original Merchant Description',
    '273': 'Installments Financing Type',
    '274': 'Status',
    '275': 'Installments Grace Period',
    '276': 'Installments Type of Credit',
    '277': 'Payments Initiator',
    '278': 'Payment Initiator Subtype',
    '300': 'Additional Amount',
    '301': 'Second Additional Amount',
    '302': 'Cashback POS Currency Code',
    '303': 'Cashback POS Amount',
    '400': 'Sender Name',
    '401': 'Sender Address',
    '402': 'Sender City',
    '403': 'Sender State',
    '404': 'Sender Country',
    '405': 'Sanction Screening Score',
    '406': 'Business Application Identifier',
    '408': 'Special Condition Indicator',
    '409': 'Business Tax ID',
    '410': 'Individual Tax ID',
    '411': 'Source of Funds',
    '412': 'Sender Account Number',
    '413': 'Sender Account Number Type',
    '414': 'MVV',
    '415': 'Sender Reference Number',
    '416': 'Is AFD Transaction',
    '417': 'Acquirer Fee Amount',
    '418': 'Address Verification Result',
    '419': 'Postal Code / ZIP Code',
    '420': 'Street Address',
    '421': 'Sender Date of Birth',
    '422': 'OCT Activity Check Result',
    '423': 'Sender Postal Code',
    '424': 'Recipient City',
    '425': 'Recipient Country',
    '900': '3D Secure OTP',
    '901': 'Digitization Activation',
    '902': 'Digitization Activation Method Type',
    '903': 'Digitization Activation Method Value',
    '904': 'Digitization Activation Expiry',
    '905': 'Digitization Final Tokenization Decision',
    '906': 'Device Name',
    '910': 'Digitized Device ID',
    '911': 'Digitized PAN Expiry',
    '912': 'Digitized FPAN Masked',
    '913': 'Token Unique Reference',
    '915': 'Digitized Token Requestor ID',
    '916': 'Visa Digitized PAN',
    '917': 'Visa Token Type',
    '920': 'POS Transaction Status',
    '921': 'POS Transaction Security',
    '922': 'POS Authorisation Lifecycle',
    '923': 'Digitization Event Type',
    '924': 'Digitization Event Reason Code',
    '925': 'Supports Partial Auth',
    '929': 'Digitization Path',
    '930': 'Wallet Recommendation',
    '931': 'Tokenization PAN Source',
    '932': 'Unique Transaction Reference',
    '933': 'Transaction Purpose',
    '934': '3D Secure OTP RefCode',
    '999': 'Generic Key'
  } as const,

  /**
   * ISO 4217 Currency Codes mapping to currency names and country flags
   * Based on https://www.iban.com/currency-codes
   */
  currencyMapping: {
    // Major currencies
    '840': { name: 'US Dollar', code: 'USD', flag: '🇺🇸' },
    '978': { name: 'Euro', code: 'EUR', flag: '🇪🇺' },
    '826': { name: 'Pound Sterling', code: 'GBP', flag: '🇬🇧' },
    '392': { name: 'Japanese Yen', code: 'JPY', flag: '🇯🇵' },
    '756': { name: 'Swiss Franc', code: 'CHF', flag: '🇨🇭' },
    '124': { name: 'Canadian Dollar', code: 'CAD', flag: '🇨🇦' },
    '036': { name: 'Australian Dollar', code: 'AUD', flag: '🇦🇺' },
    '554': { name: 'New Zealand Dollar', code: 'NZD', flag: '🇳🇿' },
    '156': { name: 'Chinese Yuan', code: 'CNY', flag: '🇨🇳' },
    '356': { name: 'Indian Rupee', code: 'INR', flag: '🇮🇳' },
    
    // European currencies
    '752': { name: 'Swedish Krona', code: 'SEK', flag: '🇸🇪' },
    '578': { name: 'Norwegian Krone', code: 'NOK', flag: '🇳🇴' },
    '208': { name: 'Danish Krone', code: 'DKK', flag: '🇩🇰' },
    '985': { name: 'Polish Zloty', code: 'PLN', flag: '🇵🇱' },
    '203': { name: 'Czech Koruna', code: 'CZK', flag: '🇨🇿' },
    '348': { name: 'Hungarian Forint', code: 'HUF', flag: '🇭🇺' },
    '946': { name: 'Romanian Leu', code: 'RON', flag: '🇷🇴' },
    '975': { name: 'Bulgarian Lev', code: 'BGN', flag: '🇧🇬' },
    '191': { name: 'Croatian Kuna', code: 'HRK', flag: '🇭🇷' },
    '941': { name: 'Serbian Dinar', code: 'RSD', flag: '🇷🇸' },
    
    // Asia Pacific
    '702': { name: 'Singapore Dollar', code: 'SGD', flag: '🇸🇬' },
    '344': { name: 'Hong Kong Dollar', code: 'HKD', flag: '🇭🇰' },
    '410': { name: 'Korean Won', code: 'KRW', flag: '🇰🇷' },
    '764': { name: 'Thai Baht', code: 'THB', flag: '🇹🇭' },
    '458': { name: 'Malaysian Ringgit', code: 'MYR', flag: '🇲🇾' },
    '360': { name: 'Indonesian Rupiah', code: 'IDR', flag: '🇮🇩' },
    '608': { name: 'Philippine Peso', code: 'PHP', flag: '🇵🇭' },
    '704': { name: 'Vietnamese Dong', code: 'VND', flag: '🇻🇳' },
    '096': { name: 'Brunei Dollar', code: 'BND', flag: '🇧🇳' },
    
    // Americas
    '484': { name: 'Mexican Peso', code: 'MXN', flag: '🇲🇽' },
    '986': { name: 'Brazilian Real', code: 'BRL', flag: '🇧🇷' },
    '032': { name: 'Argentine Peso', code: 'ARS', flag: '🇦🇷' },
    '152': { name: 'Chilean Peso', code: 'CLP', flag: '🇨🇱' },
    '604': { name: 'Peruvian Sol', code: 'PEN', flag: '🇵🇪' },
    '170': { name: 'Colombian Peso', code: 'COP', flag: '🇨🇴' },
    '858': { name: 'Uruguayan Peso', code: 'UYU', flag: '🇺🇾' },
    '600': { name: 'Paraguayan Guarani', code: 'PYG', flag: '🇵🇾' },
    '068': { name: 'Bolivian Boliviano', code: 'BOB', flag: '🇧🇴' },
    '218': { name: 'Ecuadorian Sucre', code: 'ECS', flag: '🇪🇨' },
    
    // Middle East & Africa
    '784': { name: 'UAE Dirham', code: 'AED', flag: '🇦🇪' },
    '682': { name: 'Saudi Riyal', code: 'SAR', flag: '🇸🇦' },
    '376': { name: 'Israeli New Shekel', code: 'ILS', flag: '🇮🇱' },
    '818': { name: 'Egyptian Pound', code: 'EGP', flag: '🇪🇬' },
    '710': { name: 'South African Rand', code: 'ZAR', flag: '🇿🇦' },
    '566': { name: 'Nigerian Naira', code: 'NGN', flag: '🇳🇬' },
    '404': { name: 'Kenyan Shilling', code: 'KES', flag: '🇰🇪' },
    '788': { name: 'Tunisian Dinar', code: 'TND', flag: '🇹🇳' },
    '504': { name: 'Moroccan Dirham', code: 'MAD', flag: '🇲🇦' },
    '012': { name: 'Algerian Dinar', code: 'DZD', flag: '🇩🇿' },
    
    // Eastern Europe & CIS
    '643': { name: 'Russian Ruble', code: 'RUB', flag: '🇷🇺' },
    '980': { name: 'Ukrainian Hryvnia', code: 'UAH', flag: '🇺🇦' },
    '398': { name: 'Kazakhstani Tenge', code: 'KZT', flag: '🇰🇿' },
    '051': { name: 'Armenian Dram', code: 'AMD', flag: '🇦🇲' },
    '031': { name: 'Azerbaijani Manat', code: 'AZN', flag: '🇦🇿' },
    '934': { name: 'Turkmenistani Manat', code: 'TMT', flag: '🇹🇲' },
    '860': { name: 'Uzbekistani Som', code: 'UZS', flag: '🇺🇿' },
    '417': { name: 'Kyrgyzstani Som', code: 'KGS', flag: '🇰🇬' },
    '972': { name: 'Tajikistani Somoni', code: 'TJS', flag: '🇹🇯' },
    
    // Additional major currencies
    '949': { name: 'Turkish Lira', code: 'TRY', flag: '🇹🇷' },
    '364': { name: 'Iranian Rial', code: 'IRR', flag: '🇮🇷' },
    '368': { name: 'Iraqi Dinar', code: 'IQD', flag: '🇮🇶' },
    '414': { name: 'Kuwaiti Dinar', code: 'KWD', flag: '🇰🇼' },
    '048': { name: 'Bahraini Dinar', code: 'BHD', flag: '🇧🇭' },
    '634': { name: 'Qatari Rial', code: 'QAR', flag: '🇶🇦' },
    '512': { name: 'Omani Rial', code: 'OMR', flag: '🇴🇲' },
    '422': { name: 'Lebanese Pound', code: 'LBP', flag: '🇱🇧' },
    '400': { name: 'Jordanian Dinar', code: 'JOD', flag: '🇯🇴' }
  } as const,

  /**
   * Mastercard Merchant Category Codes (MCC) mapping
   * Based on official Mastercard MCC guidelines and ISO 18245
   */
  mccMapping: {
    // Agricultural Services
    '0742': 'Veterinary Services',
    '0763': 'Agricultural Cooperative',
    '0780': 'Horticultural and Landscaping Services',
    
    // Contracted Services
    '1520': 'General Contractors - Residential and Commercial',
    '1711': 'Heating, Plumbing, Air Conditioning Contractors',
    '1731': 'Electrical Contractors',
    '1740': 'Masonry, Stonework, Tile Setting, Plastering, and Insulation Contractors',
    '1750': 'Carpentry Contractors',
    '1761': 'Roofing, Siding, and Sheet Metal Work Contractors',
    '1771': 'Concrete Work Contractors',
    '1799': 'Special Trade Contractors - Not Elsewhere Classified',
    
    // Airlines
    '3000': 'United Airlines',
    '3001': 'American Airlines',
    '3002': 'Pan American',
    '3003': 'Alitalia',
    '3004': 'Delta Air Lines',
    '3005': 'British Airways',
    '3006': 'Japan Air Lines',
    '3007': 'Air France',
    '3008': 'Lufthansa',
    '3009': 'Air Canada',
    '3010': 'KLM Royal Dutch Airlines',
    '3011': 'Aeroflot Russian International Airlines',
    '3012': 'Qantas Airways',
    '3013': 'Alaskan Airlines',
    '3014': 'North West Airlines',
    '3015': 'Braniff International Airways',
    '3016': 'Southwest Airlines',
    '3017': 'Continental Airlines',
    '3018': 'Federal Express Corporation',
    '3019': 'US Airways',
    '3020': 'Air New Zealand',
    '3021': 'Singapore Airlines',
    '3022': 'SAS',
    '3023': 'Eastern Airlines',
    '3024': 'America West Airlines',
    '3025': 'Philippines Airlines',
    '3026': 'China Airlines',
    '3027': 'Air India',
    '3028': 'Korean Air Lines',
    '3029': 'Malaysian Airlines',
    '3030': 'Thai Airways International',
    '3031': 'Sabena Belgian World Airlines',
    '3032': 'United Parcel Service',
    '3033': 'Airborne Express',
    '3034': 'DHL Airways',
    '3035': 'Helicopter Airlines',
    '3036': 'Varig Brazilian Airlines',
    '3037': 'Icelandair',
    '3038': 'Air Malta',
    '3039': 'Egyptian Air',
    '3040': 'Ansett Airlines',
    '3041': 'Pakistan International Airlines',
    '3042': 'Virgin Atlantic Airways',
    '3043': 'Virgin America',
    '3044': 'Spirit Airlines',
    '3045': 'Air Berlin',
    '3046': 'Swiss International Air Lines',
    '3047': 'Turkish Airlines',
    '3048': 'Austrian Airlines Group',
    '3049': 'LOT Polish Airlines',
    '3050': 'Hainan Airlines',
    '3051': 'Air China',
    '3052': 'China Eastern Airlines',
    '3053': 'China Southern Airlines',
    '3054': 'Xiamen Airlines',
    '3055': 'ANA All Nippon Airways',
    '3056': 'Asiana Airlines',
    '3057': 'Cebu Pacific Air',
    '3058': 'IndiGo',
    '3059': 'SpiceJet',
    '3060': 'AirAsia',
    '3061': 'Jetstar Airways',
    '3062': 'Scoot',
    '3063': 'Emirates',
    '3064': 'Etihad Airways',
    '3065': 'Qatar Airways',
    '3066': 'Saudi Arabian Airlines',
    '3067': 'Royal Jordanian',
    '3068': 'EgyptAir',
    '3069': 'South African Airways',
    '3070': 'Kenya Airways',
    '3071': 'Ethiopian Airlines',
    '3072': 'Royal Air Maroc',
    '3073': 'Air Algerie',
    '3074': 'Tunisair',
    '3075': 'Libya Airlines',
    '3076': 'Nigeria Airways',
    '3077': 'Ghana Airways',
    '3078': 'Air Ivoire',
    '3079': 'TAAG Angola Airlines',
    '3080': 'Air Zimbabwe',
    '3081': 'Air Mauritius',
    '3082': 'Air Seychelles',
    '3083': 'Air Madagascar',
    '3084': 'Comair',
    '3085': 'Kulula',
    '3086': 'Mango Airlines',
    '3087': 'FlySafair',
    '3088': 'Air Botswana',
    '3089': 'Air Namibia',
    '3090': 'Precision Air',
    '3091': 'RwandAir',
    '3092': 'Uganda Airlines',
    '3093': 'Fly540',
    '3094': 'Jambojet',
    '3095': 'FastJet',
    '3096': 'Cabo Verde Airlines',
    '3097': 'TACV',
    '3098': 'Air Burkina',
    '3099': 'Air Mali',
    '3100': 'Corsair International',
    '3101': 'Air Austral',
    '3102': 'Air Caledonie International',
    '3103': 'Aircalin',
    '3104': 'Air Moana',
    '3105': 'Air Tahiti Nui',
    '3106': 'French Bee',
    '3107': 'Aigle Azur',
    '3108': 'XL Airways France',
    '3109': 'Transavia France',
    '3110': 'easyJet',
    '3111': 'Ryanair',
    '3112': 'Wizz Air',
    '3113': 'Norwegian Air',
    '3114': 'Pegasus Airlines',
    '3115': 'Sun Express',
    '3116': 'Onur Air',
    '3117': 'AtlasGlobal',
    '3118': 'Corendon Airlines',
    '3119': 'Flynas',
    '3120': 'flydubai',
    '3121': 'Air Arabia',
    '3122': 'Jazeera Airways',
    '3123': 'Kuwait Airways',
    '3124': 'Gulf Air',
    '3125': 'Oman Air',
    '3126': 'SalamAir',
    '3127': 'Nas Air',
    '3128': 'flynas',
    '3129': 'Middle East Airlines',
    '3130': 'Iraqi Airways',
    '3131': 'Iran Air',
    '3132': 'Mahan Air',
    '3133': 'Caspian Airlines',
    '3134': 'Kish Air',
    '3135': 'Taban Airlines',
    '3136': 'Qeshm Air',
    '3137': 'Iran Aseman Airlines',
    '3138': 'Zagros Airlines',
    '3139': 'Pouya Air',
    '3140': 'Varesh Airlines',
    '3141': 'Sepehran Airlines',
    '3142': 'Karun Airlines',
    '3143': 'Safiran Airlines',
    '3144': 'Kishair',
    '3145': 'Iran Air Tours',
    '3146': 'Meraj Airlines',
    '3147': 'Atrak Air',
    '3148': 'Aria Air',
    '3149': 'Blue Airlines',
    '3150': 'Fars Air Qeshm',
    '3151': 'Kaspian Airlines',
    '3152': 'Naft Airlines',
    '3153': 'Pars Air',
    '3154': 'Payam Air',
    '3155': 'Saha Airlines',
    '3156': 'Sama Airlines',
    '3157': 'Taftan Airlines',
    '3158': 'Tehran Air',
    '3159': 'Trigana Air',
    '3160': 'Wings Air',
    '3161': 'Indonesia AirAsia',
    '3162': 'Lion Air',
    '3163': 'Sriwijaya Air',
    '3164': 'Garuda Indonesia',
    '3165': 'Citilink',
    '3166': 'Batik Air',
    '3167': 'NAM Air',
    '3168': 'Super Air Jet',
    '3169': 'TransNusa',
    '3170': 'Kalstar Aviation',
    '3171': 'Xpress Air',
    '3172': 'Indonesia Air Transport',
    '3173': 'Cardig Air',
    '3174': 'Sky Aviation',
    '3175': 'Aviastar Mandiri',
    '3176': 'Tri MG Intra Asia Airlines',
    '3177': 'Express Air',
    '3178': 'My Indo Airlines',
    '3179': 'Mandala Airlines',
    '3180': 'Adam Air',
    '3181': 'Bouraq Indonesia Airlines',
    '3182': 'Jatayu Airlines',
    '3183': 'Dirgantara Air Service',
    '3184': 'Republic Express Airlines',
    '3185': 'Travel Express Aviation Service',
    '3186': 'Asian One Air',
    '3187': 'Premiair',
    '3188': 'Metro Batavia',
    '3189': 'Travira Air',
    '3190': 'Denim Air',
    '3191': 'Riau Airlines',
    '3192': 'Manunggal Air Service',
    '3193': 'Indonesia Air Asia X',
    '3194': 'Wings Abadi Airlines',
    '3195': 'Airfast Indonesia',
    '3196': 'Associated Mission Aviation',
    '3197': 'Pelita Air Service',
    '3198': 'Jhonlin Air Transport',
    '3199': 'Alfa Trans Dirgantara',
    '3200': 'Mimika Air',
    '3201': 'Susi Air',
    '3202': 'Eastindo',
    '3203': 'Nusantara Air Charter',
    '3204': 'Smart Aviation',
    '3205': 'Chartis Cargo',
    '3206': 'Indonesian Air Transport',
    '3207': 'Transwisata Prima Aviation',
    '3208': 'Explore Jet',
    '3209': 'Deraya Air Taxi',
    '3210': 'Komala Indonesia',
    '3211': 'Wings Air',
    '3212': 'Citilink Indonesia',
    '3213': 'Express Transportasi Antarbenua',
    '3214': 'Travel Express Aviation Services',
    '3215': 'Garuda Indonesia',
    '3216': 'Lion Airlines',
    '3217': 'Sriwijaya Air',
    '3218': 'Indonesia AirAsia',
    '3219': 'Batik Air',
    '3220': 'NAM Air',
    '3221': 'Super Air Jet',
    '3222': 'TransNusa',
    '3223': 'Kalstar Aviation',
    '3224': 'Xpress Air',
    '3225': 'Indonesia Air Transport',
    '3226': 'Cardig Air',
    '3227': 'Sky Aviation',
    '3228': 'Aviastar Mandiri',
    '3229': 'Tri MG Intra Asia Airlines',
    '3230': 'Express Air',
    '3231': 'My Indo Airlines',
    '3232': 'Mandala Airlines',
    '3233': 'Adam Air',
    '3234': 'Bouraq Indonesia Airlines',
    '3235': 'Jatayu Airlines',
    '3236': 'Dirgantara Air Service',
    '3237': 'Republic Express Airlines',
    '3238': 'Travel Express Aviation Service',
    '3239': 'Asian One Air',
    '3240': 'Premiair',
    '3241': 'Metro Batavia',
    '3242': 'Travira Air',
    '3243': 'Denim Air',
    '3244': 'Riau Airlines',
    '3245': 'Manunggal Air Service',
    '3246': 'Indonesia Air Asia X',
    '3247': 'Wings Abadi Airlines',
    '3248': 'Airfast Indonesia',
    '3249': 'Associated Mission Aviation',
    '3250': 'Pelita Air Service',
    '3251': 'Jhonlin Air Transport',
    '3252': 'Alfa Trans Dirgantara',
    '3253': 'Mimika Air',
    '3254': 'Susi Air',
    '3255': 'Eastindo',
    '3256': 'Nusantara Air Charter',
    '3257': 'Smart Aviation',
    '3258': 'Chartis Cargo',
    '3259': 'Indonesian Air Transport',
    '3260': 'Transwisata Prima Aviation',
    '3261': 'Explore Jet',
    '3262': 'Deraya Air Taxi',
    '3263': 'Komala Indonesia',
    '3264': 'Wings Air',
    '3265': 'Citilink Indonesia',
    '3266': 'Express Transportasi Antarbenua',
    '3267': 'Travel Express Aviation Services',
    '3268': 'Garuda Indonesia',
    '3269': 'Lion Airlines',
    '3270': 'Sriwijaya Air',
    '3271': 'Indonesia AirAsia',
    '3272': 'Batik Air',
    '3273': 'NAM Air',
    '3274': 'Super Air Jet',
    '3275': 'TransNusa',
    '3276': 'Kalstar Aviation',
    '3277': 'Xpress Air',
    '3278': 'Indonesia Air Transport',
    '3279': 'Cardig Air',
    '3280': 'Sky Aviation',
    '3281': 'Aviastar Mandiri',
    '3282': 'Tri MG Intra Asia Airlines',
    '3283': 'Express Air',
    '3284': 'My Indo Airlines',
    '3285': 'Mandala Airlines',
    '3286': 'Adam Air',
    '3287': 'Bouraq Indonesia Airlines',
    '3288': 'Jatayu Airlines',
    '3289': 'Dirgantara Air Service',
    '3290': 'Republic Express Airlines',
    '3291': 'Travel Express Aviation Service',
    '3292': 'Asian One Air',
    '3293': 'Premiair',
    '3294': 'Metro Batavia',
    '3295': 'Travira Air',
    '3296': 'Denim Air',
    '3297': 'Riau Airlines',
    '3298': 'Manunggal Air Service',
    '3299': 'Indonesia Air Asia X',
    
    // Car Rental
    '3351': 'Alamo Rent A Car',
    '3352': 'Avis',
    '3353': 'Budget Rent-A-Car',
    '3354': 'Discount Car Rental',
    '3355': 'Hertz',
    '3356': 'National Car Rental',
    '3357': 'Payless Car Rental',
    '3359': 'Enterprise Rent-A-Car',
    '3360': 'Dollar Rent A Car',
    '3361': 'Europcar',
    '3362': 'Sixt Rent A Car',
    '3363': 'Thrifty Car Rental',
    '3364': 'Zipcar',
    '3365': 'Turo',
    '3366': 'RelayRides',
    '3367': 'Car2Go',
    '3368': 'DriveNow',
    '3369': 'Maven',
    '3370': 'ReachNow',
    '3371': 'Book by Cadillac',
    '3372': 'Fair',
    '3373': 'Getaround',
    '3374': 'HyreCar',
    '3375': 'Spinlister',
    '3376': 'JustShareIt',
    '3377': 'Outdoorsy',
    '3378': 'RVshare',
    '3379': 'Cruise America',
    '3380': 'El Monte RV',
    '3381': 'Road Bear RV',
    '3382': 'Apollo RV',
    '3383': 'Mighty Campers',
    '3384': 'Jucy Rentals',
    '3385': 'Escape Campervans',
    '3386': 'Lost Campers',
    '3387': 'Wicked Campers',
    '3388': 'Britz',
    '3389': 'Maui',
    '3390': 'Cheapa Campa',
    '3391': 'Hippie Camper',
    '3392': 'Spaceships Rentals',
    '3393': 'Travellers Autobarn',
    '3394': 'Backpacker Campervans',
    '3395': 'Lucky Rentals',
    '3396': 'East Coast Car Rentals',
    '3397': 'Redspot Car Rentals',
    '3398': 'Alpha Car Hire',
    '3399': 'Ace Rental Cars',
    
    // Lodging
    '3501': 'Holiday Inns, Holiday Inn Express',
    '3502': 'Best Western',
    '3503': 'Sheraton',
    '3504': 'Hilton',
    '3505': 'Forte Hotels',
    '3506': 'Golden Tulip Hotels',
    '3507': 'Friendship Inns',
    '3508': 'Quality Inns, Hotels, and Suites',
    '3509': 'Marriott',
    '3510': 'Days Inn',
    '3511': 'Arabella Hotels',
    '3512': 'Inter-Continental Hotels',
    '3513': 'Westin Hotels',
    '3514': 'Amerisuites',
    '3515': 'Rodeway Inn',
    '3516': 'La Quinta Motor Inns',
    '3517': 'Americana Hotels',
    '3518': 'Sol Hotels',
    '3519': 'Pullman International Hotels',
    '3520': 'Meridien Hotels',
    '3521': 'Cham pace Hotels',
    '3522': 'Granding Hotels International',
    '3523': 'Penta Hotels',
    '3524': 'Hungar Hotels',
    '3525': 'Husa Hotels',
    '3526': 'Accor Hotels',
    '3527': 'Balladins Hotels',
    '3528': 'Red Roof Inns',
    '3529': 'Imperial London Hotels',
    '3530': 'Embassy Suites',
    '3531': 'Penta Hotels',
    '3532': 'Dorint Hotels',
    '3533': 'Arcade Hotels',
    '3534': 'Loews Hotels',
    '3535': 'Forum Hotels',
    '3536': 'Hospitality International',
    '3537': 'Shangri-La International',
    '3538': 'Thistle Hotels',
    '3539': 'Summit International',
    '3540': 'Hyatt Hotels and Resorts',
    '3541': 'Sofitel Hotels',
    '3542': 'Novotel Hotels',
    '3543': 'Steigenberger Hotels',
    '3544': 'Econo Lodge',
    '3545': 'Choice Hotels',
    '3546': 'Clarion Hotels',
    '3547': 'Comfort Inn',
    '3548': 'Quality International',
    '3549': 'Hotel Ibis',
    '3550': 'Summit Hotels',
    '3551': 'Homewood Suites',
    '3552': 'Embassy Suites Hotels',
    '3553': 'Hampton Inn',
    '3554': 'Courtyard by Marriott',
    '3555': 'Compri Hotels',
    '3556': 'Stouffer Hotels',
    '3557': 'Hilton International',
    '3558': 'Concorde Hotels',
    '3559': 'Hotel Mercure',
    '3560': 'Pannonia Hotels',
    '3561': 'Hungar Hotels',
    '3562': 'IBUSZ Hotels',
    '3563': 'Reso Hotels',
    '3564': 'Hotel Volksturm',
    '3565': 'Hotel Kempinski',
    '3566': 'Hotel Okura',
    '3567': 'Royal Hotels',
    '3568': 'Four Seasons Hotels',
    '3569': 'Oberoi Hotels',
    '3570': 'Hotel Taipei',
    '3571': 'Relais Hotels',
    '3572': 'Hotel Breakers',
    '3573': 'Hotel Admiral',
    '3574': 'Best Eastern Hotels',
    '3575': 'Great Eastern Hotels',
    '3576': 'Tree Tops Hotels',
    '3577': 'Sandman Inns',
    '3578': 'venture Inns',
    '3579': 'Baymont Inns',
    '3580': 'Midway Motor Lodge',
    '3581': 'Red Carpet Inn',
    '3582': 'Imperial 400 Motor Inn',
    '3583': 'Canadian Pacific Hotels',
    '3584': 'Welcomed Group Hotels',
    '3585': 'Hotel Taj',
    '3586': 'Auberge des Gouverneurs',
    '3587': 'Hotel Gouverneur',
    '3588': 'Delta Hotels',
    '3589': 'Paradise stream Resort',
    '3590': 'Hotel la Sapinette',
    '3591': 'Hotel Quebec',
    '3592': 'Hotel Asia',
    '3593': 'Hotel Polo',
    '3594': 'Hotel Indreni',
    '3595': 'Mount Everest Hotel',
    '3596': 'Hotel Narayani',
    '3597': 'Hotel Taragaon',
    '3598': 'Hotel Malla',
    '3599': 'Hotel Himalaya',
    
    // Transportation Services
    '4011': 'Railroads',
    '4111': 'Local/Suburban Commuter Passenger Transportation',
    '4112': 'Passenger Railway',
    '4119': 'Ambulance Services',
    '4121': 'Taxicabs and Limousines',
    '4131': 'Bus Lines',
    '4214': 'Motor Freight Carriers and Trucking - Local and Long Distance',
    '4215': 'Courier Services - Air and Ground',
    '4225': 'Public Warehousing and Storage - Farm Products, Refrigerated Goods and Household Goods',
    '4411': 'Steamship and Cruise Lines',
    '4457': 'Boat Rentals and Leases',
    '4468': 'Marinas, Service and Supplies',
    '4511': 'Airlines and Air Carriers - Not Elsewhere Classified',
    '4582': 'Airports, Flying Fields and Airport Terminals',
    '4722': 'Travel Agencies and Tour Operators',
    '4723': 'TUI Travel - Germany',
    '4724': 'Thomas Cook Travel - Germany',
    '4725': 'American Express Travel Service',
    '4726': 'Carlson Wagonlit Travel',
    '4727': 'Rosenbluth International',
    '4728': 'Welcome Group - India',
    '4729': 'Staff Tours - Hong Kong',
    '4730': 'Trafalgar Tours',
    '4731': 'Gray Line Bus Tours',
    '4732': 'Creative Tours',
    '4733': 'Cosmos/Globus Gateway',
    '4734': 'Tourico Holidays',
    '4735': 'Japan Creative Tours',
    '4736': 'Brendan Tours',
    '4737': 'Collette Tours',
    '4738': 'DER Travel Service',
    '4739': 'Yankee Holidays',
    '4740': 'Grand Circle Travel',
    '4741': 'Maupintour',
    '4742': 'CIE Tours International',
    '4743': 'Korean Air Holidays',
    '4744': 'Siesta Tours',
    '4745': 'Virgin Holidays',
    '4746': 'British Airways Holidays',
    '4747': 'American Airlines Vacations',
    '4748': 'Continental Airlines Vacations',
    '4749': 'Delta Vacations',
    '4750': 'United Airlines Vacations',
    '4751': 'Funway Holidays',
    '4752': 'Liberty Travel',
    '4753': 'Pleasant Holidays',
    '4754': 'Club Med Sales',
    '4755': 'GOGO Tours',
    '4756': 'Globus Gateway',
    '4757': 'Cosmos Tours',
    '4758': 'Insight Vacations',
    '4759': 'Trafalgar Tours',
    '4760': 'Contiki Holidays',
    '4761': 'Top Deck Tours',
    '4762': 'Busabout',
    '4763': 'Stray Travel',
    '4764': 'Kiwi Experience',
    '4765': 'Flying Kiwi',
    '4766': 'Wayward Bus',
    '4767': 'Haggis Adventures',
    '4768': 'MacBackpackers',
    '4769': 'Wild Rover Tours',
    '4770': 'Shamrocker Adventures',
    '4771': 'Paddywagon Tours',
    '4772': 'Irish Day Tours',
    '4773': 'Rabbie\'s Trail Burners',
    '4774': 'Timbuktu Travel',
    '4775': 'Heart of Scotland Tours',
    '4776': 'Jacobite Tours',
    '4777': 'Highland Explorer Tours',
    '4778': 'Citylink',
    '4779': 'National Express',
    '4780': 'Megabus',
    '4781': 'Coach USA',
    '4782': 'Peter Pan Bus Lines',
    '4783': 'Adirondack Trailways',
    '4784': 'Carolina Trailways',
    '4785': 'Indian Trails',
    '4786': 'Jefferson Lines',
    '4787': 'New Jersey Transit',
    '4788': 'Lakefront Lines',
    '4789': 'Vermont Transit',
    '4790': 'Concord Coach Lines',
    '4791': 'C&J Trailways',
    '4792': 'Bonanza Bus Lines',
    '4793': 'Plymouth & Brockton',
    '4794': 'Southeastern Stages',
    '4795': 'Tornado Bus',
    '4796': 'El Paso-Los Angeles Limousine Express',
    '4797': 'Crucero Express',
    '4798': 'Omnibus Mexicanos',
    '4799': 'Transportes del Norte',
    
    // Utility Services
    '4812': 'Telecommunication Equipment and Telephone Sales',
    '4814': 'Telecommunication Services',
    '4815': 'Monthly Summary Telephone Charges',
    '4816': 'Computer Network Services',
    '4821': 'Telegraph Services',
    '4829': 'Wires, Money Orders - Not Elsewhere Classified',
    '4900': 'Utilities - Electric, Gas, Water, and Sanitary',
    
    // Retail Outlets
    '5013': 'Motor Vehicle Supplies and New Parts',
    '5021': 'Office and Commercial Furniture',
    '5039': 'Construction Materials - Not Elsewhere Classified',
    '5044': 'Office, Photographic, Photocopy and Microfilm Equipment',
    '5045': 'Computers, Computer Peripheral Equipment - Not Elsewhere Classified',
    '5046': 'Commercial Equipment - Not Elsewhere Classified',
    '5047': 'Medical, Dental, Ophthalmic and Hospital Equipment and Supplies',
    '5051': 'Metal Service Centers and Offices',
    '5065': 'Electrical Parts and Equipment',
    '5072': 'Hardware, Equipment and Supplies',
    '5074': 'Plumbing and Heating Equipment and Supplies',
    '5085': 'Industrial Supplies - Not Elsewhere Classified',
    '5094': 'Precious Stones and Metals, Watches and Jewelry',
    '5099': 'Durable Goods - Not Elsewhere Classified',
    '5111': 'Stationery, Office Supplies, Printing and Writing Paper',
    '5122': 'Drugs, Drug Proprietaries and Druggist\'s Sundries',
    '5131': 'Piece Goods, Notions and Other Dry Goods',
    '5137': 'Uniforms, Commercial Clothing',
    '5139': 'Commercial Footwear',
    '5169': 'Chemicals and Allied Products - Not Elsewhere Classified',
    '5172': 'Petroleum and Petroleum Products',
    '5192': 'Books, Periodicals and Newspapers',
    '5193': 'Florists\' Supplies, Nursery Stock and Flowers',
    '5198': 'Paints, Varnishes and Supplies',
    '5199': 'Non-durable Goods - Not Elsewhere Classified',
    '5200': 'Home Supply Warehouse Stores',
    '5211': 'Lumber and Building Materials Stores',
    '5231': 'Paint, Glass and Wallpaper Stores',
    '5251': 'Hardware Stores',
    '5261': 'Nurseries, Lawn and Garden Supply Stores',
    '5271': 'Mobile Home Dealers',
    '5300': 'Wholesale Clubs',
    '5309': 'Duty Free Stores',
    '5310': 'Discount Stores',
    '5311': 'Department Stores',
    '5331': 'Variety Stores',
    '5399': 'Miscellaneous General Merchandise',
    '5411': 'Grocery Stores, Supermarkets',
    '5422': 'Freezer and Locker Meat Provisioners',
    '5441': 'Candy, Nut and Confectionery Stores',
    '5451': 'Dairy Products Stores',
    '5462': 'Bakeries',
    '5499': 'Miscellaneous Food Stores - Convenience Stores and Specialty Markets',
    '5511': 'Car and Truck Dealers (New and Used) Sales, Service, Repairs Parts and Leasing',
    '5521': 'Car and Truck Dealers (Used Only) Sales, Service, Repairs Parts and Leasing',
    '5531': 'Auto and Home Supply Stores',
    '5532': 'Automotive Tire Stores',
    '5533': 'Automotive Parts and Accessories Stores',
    '5541': 'Service Stations (with or without ancillary services)',
    '5542': 'Automated Fuel Dispensers',
    '5551': 'Boat Dealers',
    '5561': 'Camper, Recreational and Utility Trailer Dealers',
    '5571': 'Motorcycle Shops and Dealers',
    '5592': 'Motor Homes Dealers',
    '5598': 'Snowmobile Dealers',
    '5599': 'Miscellaneous Automotive, Aircraft and Farm Equipment Dealers - Not Elsewhere Classified',
    '5611': 'Men\'s and Boys\' Clothing and Accessory Stores',
    '5621': 'Women\'s Ready-to-Wear Stores',
    '5631': 'Women\'s Accessory and Specialty Shops',
    '5641': 'Children\'s and Infants\' Wear Stores',
    '5651': 'Family Clothing Stores',
    '5655': 'Sports and Riding Apparel Stores',
    '5661': 'Shoe Stores',
    '5681': 'Furriers and Fur Shops',
    '5691': 'Men\'s and Women\'s Clothing Stores',
    '5697': 'Tailors, Alterations',
    '5698': 'Wig and Toupee Stores',
    '5699': 'Miscellaneous Apparel and Accessory Shops',
    '5712': 'Furniture, Home Furnishings and Equipment Stores and Manufacturers, Except Appliances',
    '5713': 'Floor Covering Stores',
    '5714': 'Drapery, Window Covering and Upholstery Stores',
    '5718': 'Fireplace, Fireplace Screens and Accessories Stores',
    '5719': 'Miscellaneous Home Furnishing Specialty Stores',
    '5722': 'Household Appliance Stores',
    '5732': 'Electronics Stores',
    '5733': 'Music Stores - Musical Instruments, Pianos and Sheet Music',
    '5734': 'Computer Software Stores',
    '5735': 'Record Stores',
    '5811': 'Caterers',
    '5812': 'Eating Places and Restaurants',
    '5813': 'Drinking Places (Alcoholic Beverages) - Bars, Taverns, Nightclubs, Cocktail Lounges and Discotheques',
    '5814': 'Fast Food Restaurants',
    '5912': 'Drug Stores and Pharmacies',
    '5921': 'Package Stores - Beer, Wine and Liquor',
    '5931': 'Used Merchandise and Secondhand Stores',
    '5932': 'Antique Shops',
    '5933': 'Pawn Shops',
    '5935': 'Wrecking and Salvage Yards',
    '5937': 'Antique Reproductions',
    '5940': 'Bicycle Shops',
    '5941': 'Sporting Goods Stores',
    '5942': 'Book Stores',
    '5943': 'Stationery Stores, Office and School Supply Stores',
    '5944': 'Jewelry Stores, Watches, Clocks and Silverware Stores',
    '5945': 'Toy and Hobby Shops',
    '5946': 'Camera and Photographic Supply Stores',
    '5947': 'Gift, Card, Novelty and Souvenir Shops',
    '5948': 'Luggage and Leather Goods Stores',
    '5949': 'Sewing, Needlework, Fabric and Piece Goods Stores',
    '5950': 'Glassware, Crystal Stores',
    '5960': 'Direct Marketing - Insurance Services',
    '5962': 'Direct Marketing - Travel Related Arrangement Services',
    '5963': 'Door-to-Door Sales',
    '5964': 'Direct Marketing - Catalog Merchant',
    '5965': 'Direct Marketing - Combination Catalog and Retail Merchant',
    '5966': 'Direct Marketing - Outbound Telemarketing Merchant',
    '5967': 'Direct Marketing - Inbound Telemarketing Merchant',
    '5968': 'Direct Marketing - Continuity/Subscription Merchants',
    '5969': 'Direct Marketing - Not Elsewhere Classified',
    '5970': 'Artist\'s Supply and Craft Shops',
    '5971': 'Art Dealers and Galleries',
    '5972': 'Stamp and Coin Stores',
    '5973': 'Religious Goods Stores',
    '5975': 'Hearing Aids Sales and Supplies',
    '5976': 'Orthopedic Goods - Prosthetic Devices',
    '5977': 'Cosmetics Stores',
    '5978': 'Typewriter Stores - Rental, Sales and Service',
    '5983': 'Fuel Dealers - Non Automotive - Coal, Fuel Oil, Liquefied Petroleum, Wood',
    '5992': 'Florists',
    '5993': 'Cigar Stores and Stands',
    '5994': 'News Dealers and Newsstands',
    '5995': 'Pet Shops, Pet Food and Supplies',
    '5996': 'Swimming Pools Sales',
    '5997': 'Electric Razor Stores',
    '5998': 'Tent and Awning Shops',
    '5999': 'Miscellaneous Specialty Retail',
    
    // Personal Services
    '7011': 'Hotels, Motels and Resorts',
    '7012': 'Timeshares',
    '7032': 'Sporting and Recreational Camps',
    '7033': 'Trailer Parks and Campgrounds',
    '7210': 'Laundry, Cleaning and Garment Services',
    '7211': 'Laundries',
    '7216': 'Dry Cleaners',
    '7217': 'Carpet and Upholstery Cleaning',
    '7221': 'Photographic Studios',
    '7230': 'Barber and Beauty Shops',
    '7251': 'Shoe Repair/Shoe Shine',
    '7261': 'Funeral Service and Crematories',
    '7273': 'Dating/Escort Services',
    '7276': 'Tax Preparation Services',
    '7277': 'Debt Counseling Services',
    '7278': 'Buying/Shopping Services',
    '7296': 'Clothing Rental',
    '7297': 'Massage Parlors',
    '7298': 'Health and Beauty Spas',
    '7299': 'Miscellaneous Personal Services - Not Elsewhere Classified',
    
    // Business Services
    '7311': 'Advertising Services',
    '7321': 'Consumer Credit Reporting Agencies',
    '7322': 'Debt Collection Agencies',
    '7333': 'Commercial Photography, Art and Graphics',
    '7338': 'Quick Copy, Repro and Blueprint',
    '7339': 'Stenographic and Secretarial Support Services',
    '7342': 'Exterminating Services',
    '7349': 'Cleaning and Maintenance',
    '7361': 'Employment/Temp Agencies',
    '7372': 'Computer Programming',
    '7375': 'Information Retrieval Services',
    '7379': 'Computer Maintenance and Repair Services - Not Elsewhere Classified',
    '7392': 'Consulting, Public Relations and Management Services',
    '7393': 'Detective Agencies',
    '7394': 'Equipment Rental',
    '7395': 'Photo Developing',
    '7399': 'Business Services - Not Elsewhere Classified',
    
    // Professional Services and Membership Organizations
    '8011': 'Doctors',
    '8021': 'Dentists and Orthodontists',
    '8031': 'Osteopaths',
    '8041': 'Chiropractors',
    '8042': 'Optometrists, Ophthalmologist',
    '8043': 'Opticians, Eyeglasses and Contact Lenses',
    '8049': 'Podiatrists, Chiropodists',
    '8050': 'Nursing/Personal Care',
    '8062': 'Hospitals',
    '8071': 'Medical and Dental Labs',
    '8099': 'Medical Services',
    '8111': 'Legal Services and Attorneys',
    '8211': 'Elementary, Secondary Schools',
    '8220': 'Colleges, Universities',
    '8241': 'Correspondence Schools',
    '8244': 'Business and Secretarial Schools',
    '8249': 'Vocational/Trade Schools',
    '8299': 'Educational Services - Not Elsewhere Classified',
    '8351': 'Child Care Services',
    '8398': 'Charitable and Social Service Organizations - Fundraising',
    '8641': 'Civic, Social, Fraternal Associations',
    '8651': 'Political Organizations',
    '8661': 'Religious Organizations',
    '8675': 'Automobile Associations',
    '8699': 'Membership Organizations - Not Elsewhere Classified',
    
    // Government Services
    '9211': 'Court Costs, Including Alimony and Child Support - Courts of Law',
    '9222': 'Fines - Government Administrative Entities',
    '9311': 'Tax Assessments - Government Administrative Entities',
    '9399': 'Government Services - Not Elsewhere Classified',
    '9401': 'Intra-Government Purchases - Government Only',
    '9402': 'Postal Services - Government Only',
    '9405': 'U.S. Federal Government Agencies or Departments'
  } as const,

  /**
   * Format MCC value with merchant category name
   * @param value - The MCC value (4-digit code)
   * @param key - The KLV key to determine if it's an MCC field
   * @returns Formatted MCC information or null if not an MCC field
   */
  formatMCC(value: string, key: string): { formattedValue: string; mccInfo?: { code: string; description: string; } } | null {
    // Check if this is the Merchant Category Code field (key 026)
    if (key !== '026') {
      return null;
    }

    // Pad the value to 4 digits if needed (some MCC codes might be shorter)
    const paddedValue = value.padStart(4, '0');
    const mcc = this.mccMapping[paddedValue as keyof typeof this.mccMapping];
    
    if (mcc) {
      return {
        formattedValue: `${paddedValue} - ${mcc}`,
        mccInfo: {
          code: paddedValue,
          description: mcc
        }
      };
    }
    
    // If MCC not found, still show the original value with indication
    return {
      formattedValue: `${paddedValue} (Unknown MCC)`,
      mccInfo: undefined
    };
  },

  /**
   * Format currency value with currency name and flag
   * @param value - The currency code value (ISO 4217 numeric code)
   * @param key - The KLV key to determine if it's a currency field
   * @returns Formatted currency information or null if not a currency field
   */
  formatCurrency(value: string, key: string): { formattedValue: string; currencyInfo?: { code: string; name: string; flag: string; } } | null {
    // Check if this is the Original Currency Code field (key 049)
    if (key !== '049') {
      return null;
    }

    // Pad the value to 3 digits if needed (some currency codes might be shorter)
    const paddedValue = value.padStart(3, '0');
    const currency = this.currencyMapping[paddedValue as keyof typeof this.currencyMapping];
    
    if (currency) {
      return {
        formattedValue: `${currency.flag} ${currency.code} - ${currency.name}`,
        currencyInfo: {
          code: currency.code,
          name: currency.name,
          flag: currency.flag
        }
      };
    }
    
    // If currency not found, still show the original value with indication
    return {
      formattedValue: `${value} (Unknown Currency Code)`,
      currencyInfo: undefined
    };
  },

  /**
   * Parse KLV string into individual components
   * @param klvString - The KLV data string to parse
   * @returns Object containing results and errors
   */
  parse(klvString: string): KLVParseResult {
    const results: KLVEntry[] = [];
    const errors: string[] = [];
    let pos = 0;
    const clean = klvString.replace(/\s/g, '');

    while (pos < clean.length) {
      if (pos + 5 > clean.length) {
        errors.push(`Incomplete entry at position ${pos}`);
        break;
      }

      const key = clean.substring(pos, pos + 3);
      const lenStr = clean.substring(pos + 3, pos + 5);
      
      if (!/^\d{3}$/.test(key) || !/^\d{2}$/.test(lenStr)) {
        errors.push(`Invalid format at position ${pos}`);
        break;
      }

      const len = parseInt(lenStr, 10);
      const valEnd = pos + 5 + len;

      if (valEnd > clean.length) {
        errors.push(`Incomplete value at position ${pos + 5}`);
        break;
      }

      const value = clean.substring(pos + 5, pos + 5 + len);
      
      // Create base entry
      const entry: KLVEntry = { 
        key, 
        len, 
        value, 
        pos, 
        name: KLVParser.definitions[key as keyof typeof KLVParser.definitions] || 'Unknown' 
      };

      // Add currency formatting if applicable
      const currencyFormat = KLVParser.formatCurrency(value, key);
      if (currencyFormat) {
        entry.formattedValue = currencyFormat.formattedValue;
        entry.currencyInfo = currencyFormat.currencyInfo;
      }

      // Add MCC formatting if applicable
      const mccFormat = KLVParser.formatMCC(value, key);
      if (mccFormat) {
        entry.formattedValue = mccFormat.formattedValue;
        entry.mccInfo = mccFormat.mccInfo;
      }

      results.push(entry);
      pos = valEnd;
    }

    return { results, errors };
  },

  /**
   * Validate KLV string format
   * @param klvString - The KLV data string to validate
   * @returns Validation result
   */
  validate(klvString: string): KLVValidationResult {
    const { results, errors } = KLVParser.parse(klvString);
    return {
      isValid: errors.length === 0,
      entriesCount: results.length,
      errors,
      totalLength: klvString.replace(/\s/g, '').length
    };
  },

  /**
   * Export results to different formats
   * @param results - Parsed KLV results
   * @param format - Export format (json, csv, table)
   * @returns Exported data
   */
  export(results: KLVEntry[], format: ExportFormat = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(results, null, 2);
      case 'csv':
        const headers = 'Key,Name,Length,Value,Position\n';
        const rows = results.map(r => 
          `"${r.key}","${r.name}","${r.len}","${r.value}","${r.pos}"`
        ).join('\n');
        return headers + rows;
      case 'table':
        return results.map(r => 
          `${r.key.padEnd(5)} ${r.name.padEnd(30)} ${r.len.toString().padEnd(3)} ${r.value}`
        ).join('\n');
      default:
        return JSON.stringify(results, null, 2);
    }
  },

  /**
   * Build KLV string from entries
   * @param entries - Array of {key, value} objects
   * @returns Built KLV string
   */
  build(entries: KLVBuildEntry[]): string {
    return entries
      .filter(entry => entry.key && entry.value)
      .map(entry => {
        const key = entry.key.padStart(3, '0');
        const length = entry.value.length.toString().padStart(2, '0');
        return key + length + entry.value;
      })
      .join('');
  }
};

export default KLVParser;