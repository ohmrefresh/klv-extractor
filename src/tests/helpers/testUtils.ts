import { KLVEntry } from '../../utils/KLVParser';

// Mock KLV data for testing
export const mockKLVEntries: KLVEntry[] = [
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
  },
  {
    key: '042',
    len: 15,
    value: 'MERCHANT_ID_123',
    pos: 20,
    name: 'Merchant Identifier'
  },
  {
    key: '999',
    len: 4,
    value: 'TEST',
    pos: 40,
    name: 'Generic Key'
  }
];

export const mockValidKLVString = '00206AB48DE026044577042015MERCHANT_ID_12399904TEST';
export const mockInvalidKLVString = 'INVALID_KLV_DATA';
export const mockEmptyKLVString = '';

// Mock file content for testing file uploads
export const mockFileContent = {
  validKLV: '00206AB48DE026044577\n042015MERCHANT_ID_123',
  invalidKLV: 'INVALID_DATA\nMORE_INVALID',
  empty: ''
};

// Mock batch processing data
export const mockBatchData = [
  '00206AB48DE026044577',
  '042015MERCHANT_ID_123',
  'INVALID_ENTRY',
  '99904TEST'
];

// Test utilities for component testing
export const createMockFile = (content: string, name: string, type: string = 'text/plain'): File => {
  const file = new File([content], name, { type });
  
  // Mock the text() method for testing
  (file as any).text = jest.fn().mockResolvedValue(content);
  
  return file;
};

// Mock clipboard API
export const mockClipboardAPI = () => {
  const mockWriteText = jest.fn().mockResolvedValue(undefined);
  
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: mockWriteText
    },
    configurable: true
  });
  
  return mockWriteText;
};

// Mock URL APIs for file downloads
export const mockURLAPIs = () => {
  const mockCreateObjectURL = jest.fn().mockReturnValue('mock-blob-url');
  const mockRevokeObjectURL = jest.fn();
  
  Object.defineProperty(URL, 'createObjectURL', {
    value: mockCreateObjectURL,
    configurable: true
  });
  
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: mockRevokeObjectURL,
    configurable: true
  });
  
  return { mockCreateObjectURL, mockRevokeObjectURL };
};

// Mock DOM methods for file downloads
export const mockDOMFileDownload = () => {
  const mockClick = jest.fn();
  const mockAppendChild = jest.fn();
  const mockRemoveChild = jest.fn();
  
  const mockElement = {
    click: mockClick,
    href: '',
    download: '',
    style: {}
  };
  
  const originalCreateElement = document.createElement;
  document.createElement = jest.fn().mockReturnValue(mockElement);
  
  const originalAppendChild = document.body.appendChild;
  document.body.appendChild = mockAppendChild;
  
  const originalRemoveChild = document.body.removeChild;
  document.body.removeChild = mockRemoveChild;
  
  // Return cleanup function
  return {
    cleanup: () => {
      document.createElement = originalCreateElement;
      document.body.appendChild = originalAppendChild;
      document.body.removeChild = originalRemoveChild;
    },
    mocks: {
      mockClick,
      mockAppendChild,
      mockRemoveChild,
      mockElement
    }
  };
};

// Helper to wait for promises to resolve
export const waitForPromises = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock console methods
export const mockConsole = () => {
  const originalError = console.error;
  const originalLog = console.log;
  const originalWarn = console.warn;
  
  console.error = jest.fn();
  console.log = jest.fn();
  console.warn = jest.fn();
  
  return {
    cleanup: () => {
      console.error = originalError;
      console.log = originalLog;
      console.warn = originalWarn;
    },
    mocks: {
      error: console.error,
      log: console.log,
      warn: console.warn
    }
  };
};

// Assertion helpers
export const expectValidKLVEntry = (entry: KLVEntry, expectedKey: string, expectedValue: string) => {
  expect(entry.key).toBe(expectedKey);
  expect(entry.value).toBe(expectedValue);
  expect(entry.len).toBe(expectedValue.length);
  expect(typeof entry.pos).toBe('number');
  expect(typeof entry.name).toBe('string');
};

export const expectValidParseResult = (result: { results: KLVEntry[], errors: string[] }, expectedCount: number) => {
  expect(result.errors).toHaveLength(0);
  expect(result.results).toHaveLength(expectedCount);
  result.results.forEach(entry => {
    expect(entry).toHaveProperty('key');
    expect(entry).toHaveProperty('len');
    expect(entry).toHaveProperty('value');
    expect(entry).toHaveProperty('pos');
    expect(entry).toHaveProperty('name');
  });
};