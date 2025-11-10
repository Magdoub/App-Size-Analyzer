/**
 * Mach-O Header Parser - iOS
 *
 * Parses Mach-O executable headers to extract architecture and debug symbol information
 */

/**
 * Mach-O header structure
 * @typedef {Object} MachOHeader
 * @property {number} magic - Magic number
 * @property {number} cputype - CPU type
 * @property {number} cpusubtype - CPU subtype
 * @property {number} filetype - File type
 * @property {number} ncmds - Number of load commands
 * @property {number} sizeofcmds - Size of load commands
 * @property {number} flags - Flags
 * @property {string} architecture - Architecture name (arm64, armv7, x86_64, etc.)
 * @property {boolean} hasDebugSymbols - Whether debug symbols are present
 * @property {number} fileSize - File size in bytes
 */

// Mach-O magic numbers
const MACHO_MAGIC_64 = 0xfeedfacf;
const MACHO_MAGIC_32 = 0xfeedface;
const MACHO_CIGAM_64 = 0xcffaedfe; // Reverse byte order
const MACHO_CIGAM_32 = 0xcefaedfe;

// CPU types
const CPU_TYPE_ARM = 12;
const CPU_TYPE_ARM64 = 0x0100000c;
const CPU_TYPE_X86_64 = 0x01000007;

// Load command types
const LC_SYMTAB = 0x2;

/**
 * Parse Mach-O header from binary data
 * @param {Uint8Array} data - Binary data to parse
 * @returns {MachOHeader} Parsed Mach-O header
 * @throws {Error} If the data is invalid or too small
 */
export function parseMachOHeader(data) {
  if (data.length < 28) {
    throw new Error('File too small to be a valid Mach-O binary');
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  // Read magic number to determine endianness and architecture
  const magic = view.getUint32(0, false); // Big endian first

  let littleEndian = false;
  let is64bit = false;

  if (magic === MACHO_MAGIC_64) {
    is64bit = true;
    littleEndian = false;
  } else if (magic === MACHO_MAGIC_32) {
    is64bit = false;
    littleEndian = false;
  } else if (magic === MACHO_CIGAM_64) {
    is64bit = true;
    littleEndian = true;
  } else if (magic === MACHO_CIGAM_32) {
    is64bit = false;
    littleEndian = true;
  } else {
    throw new Error(`Invalid Mach-O magic number: 0x${magic.toString(16)}`);
  }

  // Read header fields
  const cputype = view.getUint32(4, littleEndian);
  const cpusubtype = view.getUint32(8, littleEndian);
  const filetype = view.getUint32(12, littleEndian);
  const ncmds = view.getUint32(16, littleEndian);
  const sizeofcmds = view.getUint32(20, littleEndian);
  const flags = view.getUint32(24, littleEndian);

  // Determine architecture
  const architecture = getArchitecture(cputype, cpusubtype, is64bit);

  // Check for debug symbols by scanning load commands
  const hasDebugSymbols = checkForDebugSymbols(data, is64bit, littleEndian, ncmds);

  return {
    magic,
    cputype,
    cpusubtype,
    filetype,
    ncmds,
    sizeofcmds,
    flags,
    architecture,
    hasDebugSymbols,
    fileSize: data.length,
  };
}

/**
 * Determine architecture from CPU type
 * @param {number} cputype - CPU type
 * @param {number} _cpusubtype - CPU subtype (unused)
 * @param {boolean} is64bit - Whether the binary is 64-bit
 * @returns {string} Architecture name
 */
function getArchitecture(cputype, _cpusubtype, is64bit) {
  if (cputype === CPU_TYPE_ARM64) {
    return 'arm64';
  } else if (cputype === CPU_TYPE_ARM) {
    return is64bit ? 'armv8' : 'armv7';
  } else if (cputype === CPU_TYPE_X86_64) {
    return 'x86_64';
  } else {
    return `unknown-${cputype}`;
  }
}

/**
 * Check for debug symbols in load commands
 * @param {Uint8Array} data - Binary data
 * @param {boolean} is64bit - Whether the binary is 64-bit
 * @param {boolean} littleEndian - Whether the binary uses little endian byte order
 * @param {number} ncmds - Number of load commands
 * @returns {boolean} True if debug symbols are present
 */
function checkForDebugSymbols(
  data,
  is64bit,
  littleEndian,
  ncmds
) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  // Header size differs between 32-bit and 64-bit
  const headerSize = is64bit ? 32 : 28;
  let offset = headerSize;

  // Scan load commands
  for (let i = 0; i < ncmds; i++) {
    if (offset + 8 > data.length) break;

    const cmd = view.getUint32(offset, littleEndian);
    const cmdsize = view.getUint32(offset + 4, littleEndian);

    // Check for symbol table (LC_SYMTAB)
    if (cmd === LC_SYMTAB) {
      return true;
    }

    offset += cmdsize;
  }

  return false;
}

/**
 * Estimate debug symbols size from Mach-O
 * @param {MachOHeader} header - Mach-O header
 * @returns {number} Estimated debug symbols size in bytes
 */
export function estimateDebugSymbolsSize(header) {
  if (!header.hasDebugSymbols) {
    return 0;
  }

  // Rough estimate: debug symbols typically add 20-30% to binary size
  return Math.floor(header.fileSize * 0.25);
}
