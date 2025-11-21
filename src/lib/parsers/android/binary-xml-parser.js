/**
 * Binary XML Parser - Android
 *
 * Parses binary XML files (AndroidManifest.xml) from APK archives
 * Implements AXML format parsing for browser environments
 */

// AXML chunk types
const CHUNK_AXML_FILE = 0x00080003;
const CHUNK_STRING_POOL = 0x001c0001;
const CHUNK_RESOURCE_IDS = 0x00080180;
const CHUNK_START_NAMESPACE = 0x00100100;
const CHUNK_END_NAMESPACE = 0x00100101;
const CHUNK_START_TAG = 0x00100102;
const CHUNK_END_TAG = 0x00100103;
const CHUNK_TEXT = 0x00100104;

// Android resource IDs for common attributes
const ATTR_PACKAGE = 'package';
const ATTR_VERSION_CODE = 0x0101021b;
const ATTR_VERSION_NAME = 0x0101021c;
const ATTR_MIN_SDK = 0x0101020c;
const ATTR_TARGET_SDK = 0x01010270;
const ATTR_LABEL = 0x01010001;
const ATTR_NAME = 0x01010003;

/**
 * Android Manifest metadata
 * @typedef {Object} AndroidManifestMetadata
 * @property {string} packageName - Package name
 * @property {string} versionName - Version name
 * @property {number} versionCode - Version code
 * @property {number} minSdkVersion - Minimum SDK version
 * @property {number} targetSdkVersion - Target SDK version
 * @property {string} [applicationLabel] - Application label
 * @property {string[]} permissions - Permissions
 * @property {string[]} activities - Activities
 * @property {string[]} services - Services
 * @property {string[]} usesFeatures - Used features
 */

/**
 * Parse binary XML manifest
 * @param {Uint8Array} data - Binary XML data
 * @returns {Promise<Record<string, unknown>>} Parsed manifest data
 */
export async function parseBinaryXML(data) {
  try {
    if (data.length < 8) {
      throw new Error('File too small to be valid binary XML');
    }

    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let offset = 0;

    // Read file header
    const magic = view.getUint32(offset, true);
    offset += 4;

    if (magic !== CHUNK_AXML_FILE) {
      throw new Error('Invalid binary XML magic bytes');
    }

    const fileSize = view.getUint32(offset, true);
    offset += 4;

    // Parse chunks
    const strings = [];
    const resourceIds = [];
    const result = {
      package: '',
      versionCode: 0,
      versionName: '',
      minSdkVersion: 0,
      targetSdkVersion: 0,
      applicationLabel: '',
      permissions: [],
    };

    let currentElement = '';

    while (offset < data.length && offset < fileSize) {
      if (offset + 8 > data.length) break;

      const chunkType = view.getUint32(offset, true);
      const chunkSize = view.getUint32(offset + 4, true);

      if (chunkSize < 8 || offset + chunkSize > data.length) break;

      switch (chunkType) {
        case CHUNK_STRING_POOL:
          parseStringPool(view, offset, strings);
          break;

        case CHUNK_RESOURCE_IDS:
          parseResourceIds(view, offset, chunkSize, resourceIds);
          break;

        case CHUNK_START_TAG:
          parseStartTag(view, offset, strings, resourceIds, result, (name) => {
            currentElement = name;
          });
          break;

        case CHUNK_END_TAG:
          currentElement = '';
          break;
      }

      offset += chunkSize;
    }

    return result;
  } catch (error) {
    throw new Error(
      `Failed to parse binary XML: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Parse string pool chunk
 */
function parseStringPool(view, offset, strings) {
  const stringCount = view.getUint32(offset + 8, true);
  const styleCount = view.getUint32(offset + 12, true);
  const flags = view.getUint32(offset + 16, true);
  const stringsStart = view.getUint32(offset + 20, true);

  const isUtf8 = (flags & 0x100) !== 0;
  const stringOffsets = [];

  // Read string offsets
  for (let i = 0; i < stringCount; i++) {
    stringOffsets.push(view.getUint32(offset + 28 + i * 4, true));
  }

  // Read strings
  const stringsDataStart = offset + stringsStart;

  for (let i = 0; i < stringCount; i++) {
    const stringOffset = stringsDataStart + stringOffsets[i];

    if (stringOffset >= view.byteLength) {
      strings.push('');
      continue;
    }

    try {
      if (isUtf8) {
        strings.push(readUtf8String(view, stringOffset));
      } else {
        strings.push(readUtf16String(view, stringOffset));
      }
    } catch {
      strings.push('');
    }
  }
}

/**
 * Read UTF-8 string from binary data
 */
function readUtf8String(view, offset) {
  // Skip the two length bytes (character count and byte count)
  let pos = offset;

  // First byte is character count (can be 1 or 2 bytes)
  let charCount = view.getUint8(pos++);
  if ((charCount & 0x80) !== 0) {
    charCount = ((charCount & 0x7f) << 8) | view.getUint8(pos++);
  }

  // Second is byte count (can be 1 or 2 bytes)
  let byteCount = view.getUint8(pos++);
  if ((byteCount & 0x80) !== 0) {
    byteCount = ((byteCount & 0x7f) << 8) | view.getUint8(pos++);
  }

  // Read the string bytes
  const bytes = [];
  for (let i = 0; i < byteCount && pos + i < view.byteLength; i++) {
    const byte = view.getUint8(pos + i);
    if (byte === 0) break;
    bytes.push(byte);
  }

  return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
}

/**
 * Read UTF-16 string from binary data
 */
function readUtf16String(view, offset) {
  // Read length (number of UTF-16 code units)
  let length = view.getUint16(offset, true);
  let pos = offset + 2;

  // High bit set means length is encoded in 4 bytes
  if ((length & 0x8000) !== 0) {
    length = ((length & 0x7fff) << 16) | view.getUint16(pos, true);
    pos += 2;
  }

  const chars = [];
  for (let i = 0; i < length && pos + i * 2 + 1 < view.byteLength; i++) {
    const char = view.getUint16(pos + i * 2, true);
    if (char === 0) break;
    chars.push(char);
  }

  return String.fromCharCode(...chars);
}

/**
 * Parse resource IDs chunk
 */
function parseResourceIds(view, offset, chunkSize, resourceIds) {
  const count = (chunkSize - 8) / 4;
  for (let i = 0; i < count; i++) {
    resourceIds.push(view.getUint32(offset + 8 + i * 4, true));
  }
}

/**
 * Parse start tag chunk and extract attributes
 */
function parseStartTag(view, offset, strings, resourceIds, result, setElement) {
  // Start tag chunk layout:
  // 0-3: chunk type, 4-7: chunk size, 8-11: line number, 12-15: comment
  // 16-19: namespace URI, 20-23: name, 24-25: attr start, 26-27: attr size
  // 28-29: attr count, 30-31: id index, 32-33: class index, 34-35: style index
  const nameIdx = view.getInt32(offset + 20, true);
  const attrStart = view.getUint16(offset + 24, true);
  const attrSize = view.getUint16(offset + 26, true);
  const attrCount = view.getUint16(offset + 28, true);

  const elementName = nameIdx >= 0 && nameIdx < strings.length ? strings[nameIdx] : '';
  setElement(elementName);

  // Parse attributes - start after the header
  const attrOffset = offset + 36;

  for (let i = 0; i < attrCount; i++) {
    const attrBase = attrOffset + i * 20;

    if (attrBase + 20 > view.byteLength) break;

    const attrNameIdx = view.getInt32(attrBase + 4, true);
    const attrValueIdx = view.getInt32(attrBase + 8, true);
    const attrType = view.getUint8(attrBase + 15);
    const attrData = view.getInt32(attrBase + 16, true);

    const attrName = attrNameIdx >= 0 && attrNameIdx < strings.length ? strings[attrNameIdx] : '';
    const resourceId = attrNameIdx >= 0 && attrNameIdx < resourceIds.length ? resourceIds[attrNameIdx] : 0;

    // Get string value if available
    let stringValue = '';
    if (attrValueIdx >= 0 && attrValueIdx < strings.length) {
      stringValue = strings[attrValueIdx];
    }

    // Handle manifest element attributes
    if (elementName === 'manifest') {
      if (attrName === 'package' || attrName === ATTR_PACKAGE) {
        result.package = stringValue;
      } else if (resourceId === ATTR_VERSION_CODE || attrName === 'versionCode') {
        result.versionCode = attrData;
      } else if (resourceId === ATTR_VERSION_NAME || attrName === 'versionName') {
        result.versionName = stringValue || String(attrData);
      }
    }

    // Handle uses-sdk element
    if (elementName === 'uses-sdk') {
      if (resourceId === ATTR_MIN_SDK || attrName === 'minSdkVersion') {
        result.minSdkVersion = attrData;
      } else if (resourceId === ATTR_TARGET_SDK || attrName === 'targetSdkVersion') {
        result.targetSdkVersion = attrData;
      }
    }

    // Handle application element
    if (elementName === 'application') {
      if (resourceId === ATTR_LABEL || attrName === 'label') {
        // Label can be a string or a resource reference
        if (stringValue && !stringValue.startsWith('@')) {
          result.applicationLabel = stringValue;
        }
      }
    }

    // Handle uses-permission element
    if (elementName === 'uses-permission') {
      if (resourceId === ATTR_NAME || attrName === 'name') {
        if (stringValue) {
          result.permissions.push(stringValue);
        }
      }
    }
  }
}

/**
 * Extract manifest metadata from parsed XML
 * @param {Record<string, unknown>} manifestData - Parsed manifest data
 * @returns {AndroidManifestMetadata} Manifest metadata
 */
export function extractManifestMetadata(manifestData) {
  const metadata = {
    packageName: String(manifestData['package'] || 'unknown'),
    versionName: String(manifestData['versionName'] || '0.0.0'),
    versionCode: Number(manifestData['versionCode'] || 0),
    minSdkVersion: Number(manifestData['minSdkVersion'] || 0),
    targetSdkVersion: Number(manifestData['targetSdkVersion'] || 0),
    permissions: Array.isArray(manifestData['permissions'])
      ? manifestData['permissions'].map(String)
      : [],
    activities: [],
    services: [],
    usesFeatures: [],
  };

  // Only add applicationLabel if it exists
  if (manifestData['applicationLabel']) {
    metadata.applicationLabel = String(manifestData['applicationLabel']);
  }

  return metadata;
}
