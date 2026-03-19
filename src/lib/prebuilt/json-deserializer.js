/**
 * JSON Deserializer for Pre-Generated Analysis Files
 *
 * Converts JSON representations back to their original JavaScript types:
 * - Uint8Array (from base64 strings)
 * - Map (from entries arrays)
 * - Set (from values arrays)
 */

/**
 * Custom JSON reviver to restore special types
 * @param {string} key
 * @param {*} value
 * @returns {*}
 */
function jsonReviver(_key, value) {
  // Restore Uint8Array from base64 string
  if (value && typeof value === 'object' && value.__type === 'Uint8Array') {
    const binaryString = atob(value.data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  // Restore Map from entries
  if (value && typeof value === 'object' && value.__type === 'Map') {
    return new Map(value.entries);
  }

  // Restore Set from values
  if (value && typeof value === 'object' && value.__type === 'Set') {
    return new Set(value.values);
  }

  return value;
}

/**
 * Deserialize a JSON string to ParseResult object
 * @param {string} jsonString - JSON string from prebuilt analysis file
 * @returns {object} ParseResult object with restored types
 */
export function deserializeAnalysis(jsonString) {
  return JSON.parse(jsonString, jsonReviver);
}

/**
 * Load and deserialize a prebuilt analysis JSON file
 * @param {string} url - URL to JSON file
 * @returns {Promise<object>} ParseResult object
 */
export async function loadPrebuiltAnalysis(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load prebuilt analysis: ${response.status}`);
  }

  const jsonString = await response.text();
  return deserializeAnalysis(jsonString);
}
