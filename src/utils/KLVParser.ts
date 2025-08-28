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