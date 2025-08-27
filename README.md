# KLV Extractor

A React-based KLV (Key-Length-Value) data extraction and processing suite for Paymentology transaction data. This application provides a complete toolkit for parsing, building, and batch processing KLV formatted data.

## Features

- **Real-time KLV parsing** with immediate validation and error feedback
- **Interactive KLV builder** for constructing KLV strings from individual fields
- **Batch processing** for multiple KLV entries simultaneously
- **Search and filter** capabilities across parsed results
- **Export functionality** to JSON, CSV, and table formats
- **Processing history** with load and copy functionality
- **Sample data** included for testing and demonstration
- **Complete field definitions** for 100+ Paymentology KLV fields (keys 002-999)

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd klv-extractor
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will open in your browser at [http://localhost:3000](http://localhost:3000).

## Available Scripts

### Development
- `npm start` - Runs the app in development mode on http://localhost:3000
- `npm run build` - Builds the app for production to the `build` folder

### Testing
- `npm test` - Launches the test runner in interactive watch mode
- `npm run test:coverage` - Runs all tests with coverage report
- `npm run test:ci` - Runs tests in CI mode with coverage (no watch)

### Other
- `npm run eject` - One-way operation to eject from Create React App

## How to Use

### 1. KLV Parser Tab
- Enter KLV data manually or upload files containing KLV strings
- View parsed results with field names, values, and positions
- Search and filter through parsed entries
- Export results in multiple formats

### 2. KLV Builder Tab
- Interactively build KLV strings using a form interface
- Select from predefined Paymentology fields
- Real-time validation and preview of constructed KLV data
- Copy or export built KLV strings

### 3. Batch Processor Tab
- Process multiple KLV entries at once
- Upload files with multiple KLV strings
- View batch processing statistics and results
- Export batch results for further analysis

### 4. Statistics Tab
- View parsing statistics and data insights
- Analyze field usage patterns
- Review processing history and performance metrics

## KLV Data Format

The application processes Key-Length-Value data with the structure:
- **3-digit key** (002-999): Identifies the data field
- **2-digit length** (hexadecimal): Specifies value length in bytes
- **Variable-length value**: The actual data content

**Example:** `00206AB48DE`
- Key: `002`
- Length: `06` (6 bytes)
- Value: `AB48DE`

## Technology Stack

- **React 18** with TypeScript for type safety
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Create React App** build system
- **Jest** and **React Testing Library** for testing

## Architecture

### Core Components
- **KLVParser** (`src/utils/KLVParser.ts`) - Core parsing engine with complete field definitions
- **App** (`src/App.jsx`) - Main application state management and routing
- **FileUpload** - File handling for KLV data input
- **ExportPanel** - Multi-format export functionality
- **KLVBuilder** - Interactive KLV construction interface
- **BatchProcessor** - Bulk processing capabilities

### Data Flow
1. **Input**: KLV strings via manual input, file upload, or builder
2. **Processing**: KLVParser validates and parses data into structured format
3. **Display**: Results shown with search/filter capabilities
4. **Export**: Data exported to JSON, CSV, or table formats
5. **History**: Successful parses saved for future reference

## Testing

The application includes comprehensive test coverage:

- **Unit tests** for KLV Parser utility
- **Component tests** for React components
- **Integration tests** for full application workflows
- **Test utilities** for mocking and shared helpers

Run tests with coverage:
```bash
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

This application is designed for defensive security purposes only:
- Client-side processing with no server dependencies
- Data parsing and analysis functionality
- No malicious code generation or modification capabilities

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Create an issue in the GitHub repository
- Review the documentation in `CLAUDE.md` for development guidance