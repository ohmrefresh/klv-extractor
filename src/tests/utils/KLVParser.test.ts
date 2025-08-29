import KLVParser, { KLVEntry, KLVParseResult, KLVValidationResult } from '../../utils/KLVParser';


describe('KLVParser', () => {
  describe('parse', () => {
    it('should parse a valid single KLV entry', () => {
      const input = '00206AB48DE';
      const result: KLVParseResult = KLVParser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        key: '002',
        len: 6,
        value: 'AB48DE',
        pos: 0,
        name: 'Tracking Number'
      });
    });

    it('should parse multiple KLV entries', () => {
      const input = '00206AB48DE00200';
      const result: KLVParseResult = KLVParser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.results).toHaveLength(2);
      
      expect(result.results[0]).toEqual({
        key: '002',
        len: 6,
        value: 'AB48DE',
        pos: 0,
        name: 'Tracking Number'
      });
      
      expect(result.results[1]).toEqual({
        key: '002',
        len: 0,
        value: '',
        pos: 11,
        name: 'Tracking Number'
      });
    });

    it('should handle KLV entries with spaces and normalize them', () => {
      const input = '002 06 AB48DE 026 04 4577';
      const result: KLVParseResult = KLVParser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].value).toBe('AB48DE');
      expect(result.results[1].value).toBe('4577');
    });

    it('should return error for incomplete entry', () => {
      const input = '002';
      const result: KLVParseResult = KLVParser.parse(input);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('Incomplete entry at position 0');
      expect(result.results).toHaveLength(0);
    });

    it('should return error for invalid key format', () => {
      const input = 'XYZ0612345';
      const result: KLVParseResult = KLVParser.parse(input);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('Invalid format at position 0');
      expect(result.results).toHaveLength(0);
    });

    it('should return error for invalid length format', () => {
      const input = '002XY12345';
      const result: KLVParseResult = KLVParser.parse(input);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('Invalid format at position 0');
      expect(result.results).toHaveLength(0);
    });

    it('should return error for incomplete value', () => {
      const input = '00210123';
      const result: KLVParseResult = KLVParser.parse(input);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('Incomplete value at position 5');
      expect(result.results).toHaveLength(0);
    });

    it('should handle zero-length values', () => {
      const input = '00200';
      const result: KLVParseResult = KLVParser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        key: '002',
        len: 0,
        value: '',
        pos: 0,
        name: 'Tracking Number'
      });
    });

    it('should identify unknown keys', () => {
      const input = '99905TEST1';
      const result: KLVParseResult = KLVParser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('Generic Key');
    });

    it('should handle empty input', () => {
      const input = '';
      const result: KLVParseResult = KLVParser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.results).toHaveLength(0);
    });

    it('should handle whitespace-only input', () => {
      const input = '   \n\t  ';
      const result: KLVParseResult = KLVParser.parse(input);

      expect(result.errors).toHaveLength(0);
      expect(result.results).toHaveLength(0);
    });
  });

  describe('validate', () => {
    it('should validate correct KLV string', () => {
      const input = '00206AB48DE02604TEST';
      const result: KLVValidationResult = KLVParser.validate(input);
      
      expect(result.isValid).toBe(true);
      expect(result.entriesCount).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(result.totalLength).toBe(20);
    });

    it('should return invalid for malformed KLV string', () => {
      const input = '00206AB48DEXYZ';
      const result: KLVValidationResult = KLVParser.validate(input);
      
      expect(result.isValid).toBe(false);
      expect(result.entriesCount).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty string validation', () => {
      const input = '';
      const result: KLVValidationResult = KLVParser.validate(input);
      
      expect(result.isValid).toBe(true);
      expect(result.entriesCount).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.totalLength).toBe(0);
    });
  });

  describe('export', () => {
    const sampleResults: KLVEntry[] = [
      {
        key: '002',
        len: 6,
        value: 'AB48DE',
        pos: 0,
        name: 'Tracking Number'
      },
      {
        key: '026',
        len: 4,
        value: '4577',
        pos: 11,
        name: 'Merchant Category Code'
      }
    ];

    it('should export to JSON format', () => {
      const result = KLVParser.export(sampleResults, 'json');
      const parsed = JSON.parse(result);
      
      expect(parsed).toHaveLength(2);
      expect(parsed[0].key).toBe('002');
      expect(parsed[0].value).toBe('AB48DE');
      expect(parsed[1].key).toBe('026');
      expect(parsed[1].value).toBe('4577');
    });

    it('should export to CSV format', () => {
      const result = KLVParser.export(sampleResults, 'csv');
      const lines = result.split('\n');
      
      expect(lines[0]).toBe('Key,Name,Length,Value,Position');
      expect(lines[1]).toBe('"002","Tracking Number","6","AB48DE","0"');
      expect(lines[2]).toBe('"026","Merchant Category Code","4","4577","11"');
    });

    it('should export to table format', () => {
      const result = KLVParser.export(sampleResults, 'table');
      const lines = result.split('\n');
      
      expect(lines[0]).toContain('002');
      expect(lines[0]).toContain('Tracking Number');
      expect(lines[0]).toContain('AB48DE');
      expect(lines[1]).toContain('026');
      expect(lines[1]).toContain('Merchant Category Code');
      expect(lines[1]).toContain('4577');
    });

    it('should default to JSON format for unknown format', () => {
      const result = KLVParser.export(sampleResults, 'unknown' as any);
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should handle empty results array', () => {
      const result = KLVParser.export([], 'json');
      expect(JSON.parse(result)).toEqual([]);
    });
  });

  describe('build', () => {
    it('should build KLV string from entries', () => {
      const entries = [
        { key: '002', value: 'TEST123' },
        { key: '26', value: '1234' }
      ];
      
      const result = KLVParser.build(entries);
      expect(result).toBe('00207TEST123026041234');
    });

    it('should pad keys with leading zeros', () => {
      const entries = [
        { key: '2', value: 'TEST' },
        { key: '26', value: 'ABCD' }
      ];
      
      const result = KLVParser.build(entries);
      expect(result).toBe('00204TEST02604ABCD');
    });

    it('should handle non-empty values correctly', () => {
      const entries = [
        { key: '002', value: 'A' }
      ];
      
      const result = KLVParser.build(entries);
      expect(result).toBe('00201A');
    });

    it('should filter out entries with empty values', () => {
      const entries = [
        { key: '002', value: '' }
      ];
      
      const result = KLVParser.build(entries);
      expect(result).toBe('');
    });

    it('should filter out entries without key or value', () => {
      const entries = [
        { key: '002', value: 'VALID' },
        { key: '', value: 'NO_KEY' },
        { key: '026', value: '' },
        { key: '041', value: 'ALSO_VALID' }
      ];
      
      const result = KLVParser.build(entries);
      expect(result).toBe('00205VALID04110ALSO_VALID');
    });

    it('should handle empty entries array', () => {
      const result = KLVParser.build([]);
      expect(result).toBe('');
    });

    it('should handle large values correctly', () => {
      const longValue = 'A'.repeat(99);
      const entries = [
        { key: '002', value: longValue }
      ];
      
      const result = KLVParser.build(entries);
      expect(result).toBe(`00299${longValue}`);
    });
  });

  describe('definitions', () => {
    it('should contain known KLV keys', () => {
      expect(KLVParser.definitions['002']).toBe('Tracking Number');
      expect(KLVParser.definitions['026']).toBe('Merchant Category Code');
      expect(KLVParser.definitions['042']).toBe('Merchant Identifier');
      expect(KLVParser.definitions['999']).toBe('Generic Key');
    });

    it('should have comprehensive key coverage', () => {
      const keyCount = Object.keys(KLVParser.definitions).length;
      expect(keyCount).toBeGreaterThan(100); // Should have over 100 defined keys
    });

    it('should not have duplicate values for different keys', () => {
      const values = Object.values(KLVParser.definitions);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe('currency mapping', () => {
    it('should format USD currency code correctly', () => {
      const result = KLVParser.formatCurrency('840', '049');
      expect(result).not.toBeNull();
      expect(result?.formattedValue).toBe('🇺🇸 USD - US Dollar');
      expect(result?.currencyInfo?.code).toBe('USD');
      expect(result?.currencyInfo?.name).toBe('US Dollar');
      expect(result?.currencyInfo?.flag).toBe('🇺🇸');
    });

    it('should format EUR currency code correctly', () => {
      const result = KLVParser.formatCurrency('978', '049');
      expect(result).not.toBeNull();
      expect(result?.formattedValue).toBe('🇪🇺 EUR - Euro');
      expect(result?.currencyInfo?.code).toBe('EUR');
    });

    it('should handle currency codes with leading zeros', () => {
      const result = KLVParser.formatCurrency('36', '049');
      expect(result).not.toBeNull();
      expect(result?.formattedValue).toBe('🇦🇺 AUD - Australian Dollar');
    });

    it('should return null for non-currency fields', () => {
      const result = KLVParser.formatCurrency('840', '002');
      expect(result).toBeNull();
    });

    it('should handle unknown currency codes', () => {
      const result = KLVParser.formatCurrency('999', '049');
      expect(result).not.toBeNull();
      expect(result?.formattedValue).toBe('999 (Unknown Currency Code)');
      expect(result?.currencyInfo).toBeUndefined();
    });

    it('should integrate currency formatting in parse function', () => {
      const klvWithCurrency = '04903840'; // Original Currency Code = 840 (USD)
      const result = KLVParser.parse(klvWithCurrency);
      
      expect(result.results).toHaveLength(1);
      expect(result.results[0].key).toBe('049');
      expect(result.results[0].value).toBe('840');
      expect(result.results[0].formattedValue).toBe('🇺🇸 USD - US Dollar');
      expect(result.results[0].currencyInfo?.code).toBe('USD');
      expect(result.results[0].name).toBe('Original Currency Code');
    });

    it('should have comprehensive currency mapping', () => {
      const mappingKeys = Object.keys(KLVParser.currencyMapping);
      expect(mappingKeys.length).toBeGreaterThan(50); // Should have over 50 currencies
      
      // Check some key currencies exist
      expect(KLVParser.currencyMapping['840']).toBeDefined(); // USD
      expect(KLVParser.currencyMapping['978']).toBeDefined(); // EUR
      expect(KLVParser.currencyMapping['826']).toBeDefined(); // GBP
      expect(KLVParser.currencyMapping['392']).toBeDefined(); // JPY
    });
  });
});