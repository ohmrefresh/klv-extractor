import KLVParser, { KLVEntry, KLVParseResult, KLVBuildEntry } from '../../utils/KLVParser';

describe('KLVParser', () => {
  describe('parse method', () => {
    it('should parse a valid simple KLV string', () => {
      const klvString = '00206AB48DE';
      const result = KLVParser.parse(klvString);
      
      expect(result.errors).toHaveLength(0);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        key: '002',
        len: 6,
        value: 'AB48DE',
        pos: 0,
        name: 'Tracking Number',
        formattedValue: undefined
      });
    });

    it('should parse multiple KLV entries', () => {
      const klvString = '00206AB48DE026044577';
      const result = KLVParser.parse(klvString);
      
      expect(result.errors).toHaveLength(0);
      expect(result.results).toHaveLength(2);
      
      expect(result.results[0]).toEqual({
        key: '002',
        len: 6,
        value: 'AB48DE',
        pos: 0,
        name: 'Tracking Number',
        formattedValue: undefined
      });
      
      expect(result.results[1]).toEqual(
        expect.objectContaining({
          key: '026',
          len: 4,
          value: '4577',
          pos: 11,
          name: 'Merchant Category Code'
        })
      );
    });

    it('should handle unknown keys', () => {
      const klvString = '99906ABCDEF';
      const result = KLVParser.parse(klvString);
      
      expect(result.errors).toHaveLength(0);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('Generic Key');
    });

    it('should handle empty input', () => {
      const result = KLVParser.parse('');
      
      expect(result.errors).toHaveLength(0);
      expect(result.results).toHaveLength(0);
    });

    it('should handle whitespace in input', () => {
      const klvString = '002 06 AB48DE';
      const result = KLVParser.parse(klvString);
      
      expect(result.errors).toHaveLength(0);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].value).toBe('AB48DE');
    });

    it('should detect incomplete entry', () => {
      const klvString = '002';
      const result = KLVParser.parse(klvString);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Incomplete entry');
      expect(result.results).toHaveLength(0);
    });

    it('should detect invalid key format', () => {
      const klvString = 'A0206ABCDEF';
      const result = KLVParser.parse(klvString);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Invalid format');
    });

    it('should detect invalid length format', () => {
      const klvString = '002A6ABCDEF';
      const result = KLVParser.parse(klvString);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Invalid format');
    });

    it('should detect incomplete value', () => {
      const klvString = '00210ABC';
      const result = KLVParser.parse(klvString);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Incomplete value');
    });

    it('should handle zero-length value', () => {
      const klvString = '00200';
      const result = KLVParser.parse(klvString);
      
      expect(result.errors).toHaveLength(0);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].value).toBe('');
      expect(result.results[0].len).toBe(0);
    });
  });

  describe('build method', () => {
    it('should build a valid KLV string from entries', () => {
      const entries: KLVBuildEntry[] = [
        { key: '002', value: 'AB48DE' },
        { key: '026', value: '4577' }
      ];
      
      const result = KLVParser.build(entries);
      expect(result).toBe('00206AB48DE026044577');
    });

    it('should handle empty value', () => {
      const entries: KLVBuildEntry[] = [
        { key: '002', value: '' }
      ];
      
      const result = KLVParser.build(entries);
      expect(result).toBe('');
    });

    it('should handle entries with different value lengths', () => {
      const entries: KLVBuildEntry[] = [
        { key: '002', value: 'A' },
        { key: '026', value: 'ABCDEFGHIJ' }
      ];
      
      const result = KLVParser.build(entries);
      expect(result).toBe('00201A02610ABCDEFGHIJ');
    });

    it('should handle empty entries array', () => {
      const result = KLVParser.build([]);
      expect(result).toBe('');
    });
  });

  describe('export method', () => {
    const testEntries: KLVEntry[] = [
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
      const result = KLVParser.export(testEntries, 'json');
      const parsed = JSON.parse(result);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toEqual(testEntries[0]);
    });

    it('should export to CSV format', () => {
      const result = KLVParser.export(testEntries, 'csv');
      const lines = result.split('\n');
      
      expect(lines[0]).toContain('Key,Name,Length,Value,Position');
      expect(lines[1]).toContain('"002","Tracking Number","6","AB48DE","0"');
      expect(lines[2]).toContain('"026","Merchant Category Code","4","4577","11"');
    });

    it('should export to table format', () => {
      const result = KLVParser.export(testEntries, 'table');
      
      expect(result).toContain('002');
      expect(result).toContain('Tracking Number');
      expect(result).toContain('AB48DE');
    });

    it('should handle empty results array', () => {
      const jsonResult = KLVParser.export([], 'json');
      expect(jsonResult).toBe('[]');
      
      const csvResult = KLVParser.export([], 'csv');
      expect(csvResult).toContain('Key,Name,Length,Value,Position');
      
      const tableResult = KLVParser.export([], 'table');
      expect(tableResult).toBe('');
    });
  });

  describe('validate method', () => {
    it('should validate a correct KLV string', () => {
      const klvString = '00206AB48DE026044577';
      const result = KLVParser.validate(klvString);
      
      expect(result.isValid).toBe(true);
      expect(result.entriesCount).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(result.totalLength).toBe(20);
    });

    it('should invalidate incorrect KLV string', () => {
      const klvString = '00206AB';
      const result = KLVParser.validate(klvString);
      
      expect(result.isValid).toBe(false);
      expect(result.entriesCount).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate empty string', () => {
      const result = KLVParser.validate('');
      
      expect(result.isValid).toBe(true);
      expect(result.entriesCount).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.totalLength).toBe(0);
    });
  });

  describe('definitions', () => {
    it('should have key definitions', () => {
      expect(KLVParser.definitions).toBeDefined();
      expect(typeof KLVParser.definitions).toBe('object');
      expect(KLVParser.definitions['002']).toBe('Tracking Number');
      expect(KLVParser.definitions['026']).toBe('Merchant Category Code');
    });

    it('should have numeric keys only', () => {
      Object.keys(KLVParser.definitions).forEach(key => {
        expect(key).toMatch(/^\d{3}$/);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle very long values', () => {
      const longValue = 'A'.repeat(99);
      const entries: KLVBuildEntry[] = [{ key: '002', value: longValue }];
      const built = KLVParser.build(entries);
      const parsed = KLVParser.parse(built);
      
      expect(parsed.errors).toHaveLength(0);
      expect(parsed.results[0].value).toBe(longValue);
      expect(parsed.results[0].len).toBe(99);
    });

    it('should handle special characters in values', () => {
      const specialValue = 'ABC!@#$%^&*()123';
      const entries: KLVBuildEntry[] = [{ key: '002', value: specialValue }];
      const built = KLVParser.build(entries);
      const parsed = KLVParser.parse(built);
      
      expect(parsed.errors).toHaveLength(0);
      expect(parsed.results[0].value).toBe(specialValue);
    });
  });
});