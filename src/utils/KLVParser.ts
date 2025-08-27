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
      results.push({ 
        key, 
        len, 
        value, 
        pos, 
        name: KLVParser.definitions[key as keyof typeof KLVParser.definitions] || 'Unknown' 
      });
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