/**
 * AAB Protobuf Schema Loader
 *
 * Provides schema definitions for parsing Android App Bundle manifest files.
 * Based on aapt2 Resources.proto from Android Open Source Project.
 *
 * @see https://android.googlesource.com/platform/frameworks/base/+/master/tools/aapt2/Resources.proto
 */

import * as protobuf from 'protobufjs';

/**
 * Inline protobuf schema for AAB manifest parsing
 * This is a simplified version focusing on extracting package name and version info
 */
const RESOURCES_PROTO_JSON = {
  nested: {
    aapt: {
      nested: {
        pb: {
          nested: {
            XmlNode: {
              fields: {
                element: { type: 'XmlElement', id: 1 },
                text: { type: 'string', id: 2 },
                source: { type: 'Source', id: 3 },
              },
            },
            XmlElement: {
              fields: {
                namespaceDeclaration: { rule: 'repeated', type: 'XmlNamespace', id: 1 },
                namespaceUri: { type: 'string', id: 2 },
                name: { type: 'string', id: 3 },
                attribute: { rule: 'repeated', type: 'XmlAttribute', id: 4 },
                child: { rule: 'repeated', type: 'XmlNode', id: 5 },
              },
            },
            XmlNamespace: {
              fields: {
                prefix: { type: 'string', id: 1 },
                uri: { type: 'string', id: 2 },
                source: { type: 'Source', id: 3 },
              },
            },
            XmlAttribute: {
              fields: {
                namespaceUri: { type: 'string', id: 1 },
                name: { type: 'string', id: 2 },
                value: { type: 'string', id: 3 },
                source: { type: 'Source', id: 4 },
                resourceId: { type: 'uint32', id: 5 },
                compiledItem: { type: 'Item', id: 6 },
              },
            },
            Source: {
              fields: {
                pathIdx: { type: 'uint32', id: 1 },
                position: { type: 'SourcePosition', id: 2 },
              },
            },
            SourcePosition: {
              fields: {
                lineNumber: { type: 'uint32', id: 1 },
                columnNumber: { type: 'uint32', id: 2 },
              },
            },
            Item: {
              fields: {
                ref: { type: 'Reference', id: 1 },
                str: { type: 'String', id: 2 },
                rawStr: { type: 'RawString', id: 3 },
                styledStr: { type: 'StyledString', id: 4 },
                file: { type: 'FileReference', id: 5 },
                id: { type: 'Id', id: 6 },
                prim: { type: 'Primitive', id: 7 },
              },
            },
            Reference: {
              fields: {
                type: { type: 'Type', id: 1 },
                id: { type: 'uint32', id: 2 },
                name: { type: 'string', id: 3 },
                private: { type: 'bool', id: 4 },
              },
              nested: {
                Type: {
                  values: {
                    REFERENCE: 0,
                    ATTRIBUTE: 1,
                  },
                },
              },
            },
            String: {
              fields: {
                value: { type: 'string', id: 1 },
              },
            },
            RawString: {
              fields: {
                value: { type: 'string', id: 1 },
              },
            },
            StyledString: {
              fields: {
                value: { type: 'string', id: 1 },
                span: { rule: 'repeated', type: 'Span', id: 2 },
              },
            },
            FileReference: {
              fields: {
                path: { type: 'string', id: 1 },
                type: { type: 'Type', id: 2 },
              },
              nested: {
                Type: {
                  values: {
                    UNKNOWN: 0,
                    PNG: 1,
                    BINARY_XML: 2,
                    PROTO_XML: 3,
                  },
                },
              },
            },
            Id: {
              fields: {},
            },
            Primitive: {
              fields: {
                nullValue: { type: 'NullType', id: 1 },
                emptyValue: { type: 'EmptyType', id: 2 },
                floatValue: { type: 'float', id: 3 },
                dimensionValue: { type: 'uint32', id: 13 },
                fractionValue: { type: 'uint32', id: 14 },
                intDecimalValue: { type: 'int32', id: 6 },
                intHexadecimalValue: { type: 'uint32', id: 7 },
                booleanValue: { type: 'bool', id: 8 },
                colorArgb8Value: { type: 'uint32', id: 9 },
                colorRgb8Value: { type: 'uint32', id: 10 },
                colorArgb4Value: { type: 'uint32', id: 11 },
                colorRgb4Value: { type: 'uint32', id: 12 },
              },
            },
            NullType: {
              fields: {},
            },
            EmptyType: {
              fields: {},
            },
            Span: {
              fields: {
                name: { type: 'string', id: 1 },
                startIndex: { type: 'uint32', id: 2 },
                endIndex: { type: 'uint32', id: 3 },
              },
            },
          },
        },
      },
    },
  },
};

// Cached root instance
let cachedRoot = null;

/**
 * Get the protobuf root with AAB schema definitions
 * @returns {protobuf.Root} Protobuf root with schema types
 */
export function getProtoRoot() {
  if (cachedRoot) {
    return cachedRoot;
  }

  cachedRoot = protobuf.Root.fromJSON(RESOURCES_PROTO_JSON);
  return cachedRoot;
}

/**
 * Get the XmlNode type for parsing AndroidManifest
 * @returns {protobuf.Type} XmlNode type
 */
export function getXmlNodeType() {
  const root = getProtoRoot();
  return root.lookupType('aapt.pb.XmlNode');
}

/**
 * Parse AAB manifest protobuf data
 * @param {Uint8Array} data - Raw protobuf bytes from AndroidManifest.xml
 * @returns {Object} Parsed manifest object
 * @throws {Error} If parsing fails
 */
export function parseManifestProto(data) {
  try {
    const XmlNode = getXmlNodeType();
    const decoded = XmlNode.decode(data);
    return XmlNode.toObject(decoded, {
      longs: Number,
      enums: String,
      defaults: true,
    });
  } catch (error) {
    // If protobuf parsing fails, try to extract metadata from raw bytes
    console.warn('Protobuf parsing failed, trying fallback extraction:', error);
    return extractMetadataFromRawBytes(data);
  }
}

/**
 * Fallback: Extract metadata directly from raw protobuf bytes
 * This is less reliable but works when schema doesn't match
 * @param {Uint8Array} data - Raw protobuf bytes
 * @returns {Object} Extracted data
 */
function extractMetadataFromRawBytes(data) {
  const text = new TextDecoder('utf-8', { fatal: false }).decode(data);

  // Look for package name - protobuf format has "package" then length byte then value
  // Pattern: package + any bytes + package name (com.xxx or org.xxx etc)
  const packageMatch = text.match(/package[\s\S]{0,20}?((?:com|org|net|io|app|dev)\.[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)/);

  // Look for version name - format: versionName + bytes + version string
  const versionNameMatch = text.match(/versionName[\s\S]{0,20}?(\d+\.\d+(?:\.\d+)*(?:[.-][a-zA-Z0-9]+)?)/);

  // Build a minimal element structure
  const result = {
    element: {
      name: 'manifest',
      attribute: [],
      child: [],
    },
  };

  if (packageMatch && packageMatch[1]) {
    result.element.attribute.push({
      name: 'package',
      value: packageMatch[1],
    });
  }

  if (versionNameMatch && versionNameMatch[1]) {
    result.element.attribute.push({
      name: 'versionName',
      value: versionNameMatch[1],
    });
  }

  return result;
}

/**
 * Extract metadata from parsed manifest
 * @param {Object} manifestNode - Parsed XmlNode from AndroidManifest
 * @returns {Object} Extracted metadata (packageName, versionCode, versionName, etc.)
 */
export function extractManifestMetadata(manifestNode) {
  const result = {
    packageName: '',
    versionCode: 0,
    versionName: '',
    minSdkVersion: null,
    targetSdkVersion: null,
    permissions: [],
  };

  if (!manifestNode || !manifestNode.element) {
    return result;
  }

  const element = manifestNode.element;

  // Extract manifest attributes
  if (element.attribute) {
    for (const attr of element.attribute) {
      // Package name
      if (attr.name === 'package') {
        result.packageName = attr.value || '';
      }

      // Version code (resource ID: 0x0101021b)
      if (attr.name === 'versionCode' || attr.resourceId === 16843275) {
        if (attr.compiledItem?.prim?.intDecimalValue !== undefined) {
          result.versionCode = attr.compiledItem.prim.intDecimalValue;
        } else if (attr.value) {
          result.versionCode = parseInt(attr.value, 10) || 0;
        }
      }

      // Version name (resource ID: 0x0101021c)
      if (attr.name === 'versionName' || attr.resourceId === 16843276) {
        if (attr.compiledItem?.str?.value) {
          result.versionName = attr.compiledItem.str.value;
        } else if (attr.value) {
          result.versionName = attr.value;
        }
      }
    }
  }

  // Extract uses-sdk and permissions from children
  if (element.child) {
    for (const child of element.child) {
      if (!child.element) continue;

      // uses-sdk element
      if (child.element.name === 'uses-sdk' && child.element.attribute) {
        for (const attr of child.element.attribute) {
          // minSdkVersion (resource ID: 0x0101020c)
          if (attr.name === 'minSdkVersion' || attr.resourceId === 16843276) {
            if (attr.compiledItem?.prim?.intDecimalValue !== undefined) {
              result.minSdkVersion = String(attr.compiledItem.prim.intDecimalValue);
            } else if (attr.value) {
              result.minSdkVersion = attr.value;
            }
          }

          // targetSdkVersion (resource ID: 0x01010270)
          if (attr.name === 'targetSdkVersion' || attr.resourceId === 16843376) {
            if (attr.compiledItem?.prim?.intDecimalValue !== undefined) {
              result.targetSdkVersion = String(attr.compiledItem.prim.intDecimalValue);
            } else if (attr.value) {
              result.targetSdkVersion = attr.value;
            }
          }
        }
      }

      // uses-permission elements
      if (child.element.name === 'uses-permission' && child.element.attribute) {
        for (const attr of child.element.attribute) {
          if (attr.name === 'name' && attr.value) {
            result.permissions.push(attr.value);
          }
        }
      }
    }
  }

  return result;
}

// Export for testing
export { RESOURCES_PROTO_JSON };
