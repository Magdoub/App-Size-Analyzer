/**
 * One-Time Script: Convert Sample Binary Files to JSON
 *
 * This script:
 * 1. Discovers all sample files in sample-files/ directory
 * 2. Parses each using existing parsers (parseAPK, parseIPA, parseAAB)
 * 3. Serializes ParseResult to JSON (with custom handling for Uint8Array, Map, Set)
 * 4. Writes JSON files to prebuilt-analyses/ directory
 *
 * Usage: node scripts/convert-samples-to-json.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import parsers
import { parseAPK } from '../src/lib/parsers/android/apk-parser.js';
import { parseIPA } from '../src/lib/parsers/ios/ipa-parser.js';
import { parseAAB } from '../src/lib/parsers/android/aab-parser.js';

const SAMPLE_DIR = path.join(__dirname, '../sample-files');
const OUTPUT_DIR = path.join(__dirname, '../prebuilt-analyses');

/**
 * Custom JSON replacer to handle special types
 * @param {string} key
 * @param {*} value
 * @returns {*}
 */
function jsonReplacer(key, value) {
  // Handle Uint8Array → base64 string
  if (value instanceof Uint8Array) {
    return {
      __type: 'Uint8Array',
      data: Buffer.from(value).toString('base64')
    };
  }

  // Handle Map → object with entries
  if (value instanceof Map) {
    return {
      __type: 'Map',
      entries: Array.from(value.entries())
    };
  }

  // Handle Set → array
  if (value instanceof Set) {
    return {
      __type: 'Set',
      values: Array.from(value)
    };
  }

  return value;
}

/**
 * Create a File object from buffer (Node.js compatible)
 * @param {Buffer} buffer
 * @param {string} fileName
 * @returns {File}
 */
function createFileFromBuffer(buffer, fileName) {
  // In Node.js, File might not be available, so we create a file-like object
  return new File([buffer], fileName, {
    type: 'application/octet-stream',
    lastModified: Date.now()
  });
}

/**
 * Convert filename to slug for JSON output
 * @param {string} fileName
 * @returns {string}
 */
function slugify(fileName) {
  return fileName
    .toLowerCase()
    .replace(/\.(ipa|apk|aab|xapk)$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Analyze a single sample file
 * @param {string} filePath
 * @returns {Promise<{fileName: string, jsonPath: string, size: number}>}
 */
async function analyzeSampleFile(filePath) {
  const fileName = path.basename(filePath);
  const extension = path.extname(fileName).toLowerCase();

  console.log(`\n📦 Analyzing ${fileName}...`);

  // Read binary file
  const buffer = fs.readFileSync(filePath);
  const file = createFileFromBuffer(buffer, fileName);

  console.log(`  Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

  // Parse using appropriate parser
  let parseResult;
  const startTime = Date.now();

  try {
    if (extension === '.ipa') {
      console.log(`  Parsing iOS IPA...`);
      parseResult = await parseIPA(file);
    } else if (extension === '.apk') {
      console.log(`  Parsing Android APK...`);
      parseResult = await parseAPK(file);
    } else if (extension === '.aab') {
      console.log(`  Parsing Android AAB...`);
      parseResult = await parseAAB(file);
    } else {
      throw new Error(`Unsupported file format: ${extension}`);
    }

    const parseTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  ✅ Parsed in ${parseTime}s`);
  } catch (error) {
    console.error(`  ❌ Parse failed:`, error.message);
    throw error;
  }

  // Serialize to JSON
  console.log(`  Serializing to JSON...`);
  const jsonString = JSON.stringify(parseResult, jsonReplacer, 2);
  const jsonSize = Buffer.byteLength(jsonString);

  // Write to output directory
  const slug = slugify(fileName);
  const jsonFileName = `${slug}.json`;
  const jsonPath = path.join(OUTPUT_DIR, jsonFileName);

  fs.writeFileSync(jsonPath, jsonString);

  console.log(`  ✅ Wrote ${jsonFileName} (${(jsonSize / 1024).toFixed(1)} KB)`);
  console.log(`  Compression ratio: ${((jsonSize / buffer.length) * 100).toFixed(1)}%`);

  return {
    fileName,
    jsonPath,
    size: jsonSize
  };
}

/**
 * Main conversion function
 */
async function main() {
  console.log('🚀 Starting sample file conversion...\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✅ Created output directory: ${OUTPUT_DIR}\n`);
  }

  // Discover sample files
  const files = fs.readdirSync(SAMPLE_DIR)
    .filter(file => /\.(ipa|apk|aab)$/i.test(file))
    .map(file => path.join(SAMPLE_DIR, file));

  console.log(`📁 Found ${files.length} sample files:\n`);
  files.forEach(file => console.log(`   - ${path.basename(file)}`));

  // Analyze each file
  const results = [];
  const errors = [];

  for (const filePath of files) {
    try {
      const result = await analyzeSampleFile(filePath);
      results.push(result);
    } catch (error) {
      errors.push({
        file: path.basename(filePath),
        error: error.message
      });
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 CONVERSION SUMMARY\n');
  console.log(`✅ Successfully converted: ${results.length}/${files.length} files`);

  if (results.length > 0) {
    const totalJsonSize = results.reduce((sum, r) => sum + r.size, 0);
    console.log(`📦 Total JSON size: ${(totalJsonSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`\nGenerated files:`);
    results.forEach(r => {
      console.log(`   ✓ ${path.basename(r.jsonPath)}`);
    });
  }

  if (errors.length > 0) {
    console.log(`\n❌ Failed conversions: ${errors.length}`);
    errors.forEach(e => {
      console.log(`   ✗ ${e.file}: ${e.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Conversion complete!');
  console.log(`\nNext steps:`);
  console.log(`  1. Test locally: npm run dev`);
  console.log(`  2. Click sample files and verify instant loading`);
  console.log(`  3. If working, commit: git add prebuilt-analyses/`);
}

// Run
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
