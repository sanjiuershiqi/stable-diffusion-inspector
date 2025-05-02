import pako from 'pako';

// --- DataReader Class (for Stealth Exif) ---
// (No changes needed for this class itself)
class DataReader {
    data: number[];
    index: number;

    constructor(data: number[]) { // Added type annotation
        this.data = data;
        this.index = 0;
    }

    readBit(): number { // Added return type
        // Add bounds check for safety
        if (this.index >= this.data.length) {
            throw new Error("DataReader: Attempted to read past the end of data.");
        }
        return this.data[this.index++];
    }

    readNBits(n: number): number[] { // Added type annotation and return type
        let bits: number[] = [];
        for (let i = 0; i < n; i++) {
            // Error handling within loop for robustness
            try {
                bits.push(this.readBit());
            } catch (e) {
                console.error(`DataReader: Error reading bit ${i+1} of ${n}:`, e);
                // Decide how to handle partial read: throw, return partial, etc.
                // For simplicity, rethrow or return what was read so far
                 throw new Error(`DataReader: Failed to read ${n} bits.`);
                 // return bits; // Or return partial bits
            }
        }
        return bits;
    }

    readByte(): number { // Added return type
        let byte = 0;
        // Ensure 8 bits are read safely
        const bits = this.readNBits(8);
        for (let i = 0; i < 8; i++) {
            byte |= bits[i] << (7 - i);
        }
        return byte;
    }

    readNBytes(n: number): number[] { // Added type annotation and return type
        let bytes: number[] = [];
        for (let i = 0; i < n; i++) {
             try {
                bytes.push(this.readByte());
             } catch (e) {
                 console.error(`DataReader: Error reading byte ${i+1} of ${n}:`, e);
                 throw new Error(`DataReader: Failed to read ${n} bytes.`);
                 // return bytes; // Or return partial bytes
             }
        }
        return bytes;
    }

    // Reads a 32-bit big-endian integer
    readInt32(): number { // Added return type
        const bytes = this.readNBytes(4);
        // DataView is preferred for handling endianness and types
        const buffer = new Uint8Array(bytes).buffer;
        const view = new DataView(buffer);
        // false for big-endian
        return view.getInt32(0, false);
    }
}

// --- File Reading Utilities ---

/**
 * Reads a File object as a Base64 Data URL.
 * Still potentially useful, though preview uses Object URL.
 */
export const asyncFileReaderAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result && typeof e.target.result === 'string') {
                resolve(e.target.result);
            } else {
                reject(new Error("FileReader did not return a valid string Data URL."));
            }
        };
        reader.onerror = (e) => {
            console.error("FileReader error:", reader.error);
            reject(new Error(`FileReader error: ${reader.error?.message || 'Unknown error'}`));
        };
        reader.readAsDataURL(file);
    });
};

/**
 * NEW: Reads a large file in chunks as text.
 * Useful for reading the head of large model files without loading everything into memory.
 */
export const readFileInChunks = async (file: File, chunkSize: number = 1024 * 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    let offset = 0;
    const reader = new FileReader();
    let content = '';

    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        content += e.target.result;
        offset += chunkSize;
        if (offset < file.size) {
          readSlice(offset); // Read next chunk
        } else {
          resolve(content); // Done reading
        }
      } else {
          reject(new Error("FileReader chunk read failed to return string."));
      }
    };

    reader.onerror = (e) => {
        console.error("FileReader chunk read error:", reader.error);
        reject(new Error(`FileReader chunk read error: ${reader.error?.message || 'Unknown error'}`));
    };

    const readSlice = (o: number) => {
      const slice = file.slice(o, o + chunkSize);
      reader.readAsText(slice); // Read chunk as text
    };

    readSlice(0); // Start reading the first chunk
  });
};


// --- Safetensors Metadata Extraction ---

/**
 * Reads the main metadata object from a Safetensors file.
 * Uses BigInt for metadata length according to spec.
 */
export const getSafetensorsMeta = async (file: File): Promise<any> => {
    try {
        // Read the first 8 bytes for the metadata length (uint64 little-endian)
        if (file.size < 8) {
            throw new Error("File is too small to be a valid Safetensors file.");
        }
        const lengthBuffer = await file.slice(0, 8).arrayBuffer();
        const lengthView = new DataView(lengthBuffer);
        const metaLenBigInt = lengthView.getBigUint64(0, true); // true for little-endian

        // Convert BigInt to Number. Check for potential precision loss if length is huge.
        const metaLen = Number(metaLenBigInt);
        if (!Number.isSafeInteger(metaLen)) {
             console.warn("Safetensors metadata length exceeds safe integer limit. Potential precision loss.");
             // You might want to handle extremely large metadata differently if needed.
        }
         if (metaLen <= 0) {
            console.log("Safetensors metadata length is zero or invalid.");
            return {}; // Return empty object if no metadata
         }

        // Read the metadata JSON string
        const metaEnd = 8 + metaLen;
        if (file.size < metaEnd) {
            throw new Error("File size is smaller than indicated metadata length.");
        }
        const metaBuffer = await file.slice(8, metaEnd).text();

        // Parse the JSON metadata
        const meta = JSON.parse(metaBuffer);
        return meta;
    } catch (error: any) { // Add type
        console.error("Error reading Safetensors metadata:", error);
        // Rethrow or return null/error object based on how you want to handle it upstream
        throw new Error(`Failed to get Safetensors metadata: ${error.message}`);
    }
};

/**
 * Extracts the '__metadata__' field specifically, often used by Kohya SS scripts.
 * Assumes the nested keys contain JSON strings that need further parsing.
 */
export const getSafetensorsMetaKohya = async (file: File): Promise<any | null> => {
    try {
        const meta = await getSafetensorsMeta(file); // Get the full metadata first

        if (!meta || !meta["__metadata__"]) {
            console.log("Safetensors metadata does not contain '__metadata__' field.");
            return null; // Indicate that Kohya-specific metadata wasn't found
        }

        let data = meta["__metadata__"];

        // Keys that might contain stringified JSON
        const jsonKeys = ["ss_bucket_info", "ss_network_args", "ss_dataset_dirs", "ss_tag_frequency"];

        for (let k of jsonKeys) {
            // Check if the key exists, is a string, and try parsing it
            if (data[k] && typeof data[k] === 'string') {
                 // Add a length check or other validation if necessary before parsing
                 if (data[k].length < 20000) { // Limit parsing size to prevent hanging on huge strings
                    try {
                        data[k] = JSON.parse(data[k]);
                    } catch (parseError) {
                        console.warn(`Failed to parse nested JSON for key '${k}':`, parseError);
                        // Keep the original string if parsing fails
                    }
                 } else {
                    console.warn(`Skipping parsing for potentially large string in key '${k}'.`);
                 }
            }
        }
        return data; // Return the (potentially modified) __metadata__ object
    } catch (error: any) { // Add type
        console.error("Error extracting Kohya Safetensors metadata:", error);
        // Rethrow or return null based on upstream handling preference
        throw new Error(`Failed to get Kohya Safetensors metadata: ${error.message}`);
    }
};

/**
 * DEPRECATED? This seems less robust than getSafetensorsMeta.
 * Tries to manually extract __metadata__ from a string.
 */
export const tryExtractSafetensorsMeta = (content: string): any | null => {
    console.warn("tryExtractSafetensorsMeta is likely deprecated and less reliable.");
    try {
        const jsonKeys = ["ss_bucket_info", "ss_network_args", "ss_dataset_dirs", "ss_tag_frequency"];
        let metadataStr = ''; // Initialize differently
        let startIndex = content.indexOf('__metadata__');
        if (startIndex === -1) {
            console.log("no __metadata__ found in content");
            return null;
        }
        startIndex = content.indexOf('{', startIndex + 12); // Find the opening brace after '__metadata__':
        if (startIndex === -1) {
             console.log("Could not find opening brace for __metadata__");
             return null;
        }

        let braceCount = 1;
        let currentIndex = startIndex + 1;
        while (braceCount > 0 && currentIndex < content.length) {
            if (content[currentIndex] === '{') {
                braceCount++;
            } else if (content[currentIndex] === '}') {
                braceCount--;
            }
             // Append only if braceCount is still positive (or it's the closing brace)
            if (braceCount >= 0) {
                 metadataStr += content[currentIndex];
            }
            currentIndex++;
        }
         // metadataStr should now contain the content between the braces, including the last brace if found
         if (braceCount !== 0) {
             console.warn("Mismatched braces while extracting __metadata__ string.");
             // Return null or try parsing anyway? For safety, return null.
             return null;
         }


        // Add the surrounding braces back for valid JSON
        const fullMetadataStr = '{' + metadataStr;
        console.log("[debug] extracted metadata string: " + fullMetadataStr);

        const data = JSON.parse(fullMetadataStr);
        for (let k of jsonKeys) {
            if (data[k] && typeof data[k] === 'string') {
                 try { data[k] = JSON.parse(data[k]); } catch (e) { console.warn(`Failed to parse nested JSON for key '${k}' in tryExtractSafetensorsMeta`); }
            }
        }
        return data;
    } catch (error) {
        console.error("Error in tryExtractSafetensorsMeta:", error);
        return null;
    }
};


// --- Stealth Exif Extraction ---

/**
 * Extracts hidden data from image alpha channel LSB (Steganography).
 * Relies on canvas and pako for decompression.
 */
export async function getStealthExif(src: string): Promise<any | null> { // src is now likely an Object URL
    let time = performance.now();
    let canvas: HTMLCanvasElement | null = null; // Allow null initially
    try {
        canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true });
        if (!ctx) {
            throw new Error("Failed to get 2D rendering context from canvas.");
        }

        let img = new Image();
        // Handle potential errors during image loading
        await new Promise((resolve, reject) => {
             img.onload = resolve;
             img.onerror = (err) => reject(new Error(`Failed to load image from src: ${err instanceof ErrorEvent ? err.message : 'Unknown error'}`));
             img.src = src; // Assign Object URL or Data URL
        });

        // Ensure image has dimensions before proceeding
         if (img.width === 0 || img.height === 0) {
             throw new Error("Image loaded with zero dimensions, cannot process.");
         }


        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        let imageData = ctx.getImageData(0, 0, img.width, img.height);
        let lowestData: number[] = [];
        const pixelCount = img.width * img.height;
        const dataLength = imageData.data.length;

        // Optimized loop? Maybe not much faster, but slightly cleaner
        for (let i = 0; i < pixelCount; i++) {
            const alphaIndex = i * 4 + 3;
            // Bounds check for safety, though should match pixelCount * 4
            if (alphaIndex < dataLength) {
                lowestData.push(imageData.data[alphaIndex] & 1);
            } else {
                console.warn("ImageData length mismatch during LSB extraction.");
                break; // Stop if data is shorter than expected
            }
        }

        console.log("LSB data extraction time: ", performance.now() - time, "ms");

        const magic = "stealth_pngcomp";
        const reader = new DataReader(lowestData); // Use improved DataReader

        // Read magic string safely
        const readMagicBytes = reader.readNBytes(magic.length);
        const magicString = String.fromCharCode(...readMagicBytes); // Safer conversion

        if (magic === magicString) {
            console.log("Stealth magic number found.");
            const dataLengthBits = reader.readInt32() * 8; // Length seems to be in bytes, multiply by 8 for bits
            if (dataLengthBits <= 0) {
                 throw new Error("Invalid stealth data length found.");
            }
            const gzipDataBytes = reader.readNBytes(dataLengthBits / 8); // Read bytes based on length

            // Decompress using pako
            const data = pako.ungzip(new Uint8Array(gzipDataBytes));
            const jsonString = new TextDecoder().decode(new Uint8Array(data));

            // Parse the JSON data
            const json = JSON.parse(jsonString);
            console.log("Successfully extracted stealth data.");
            return json;
        } else {
            console.log("Stealth magic number not found.");
            return null; // No hidden data found
        }

    } catch (error: any) { // Add type
        console.error("Error during stealth EXIF extraction:", error);
        // Return null or rethrow based on desired handling
        return null; // Fail silently, returning null
        // throw new Error(`Stealth EXIF extraction failed: ${error.message}`); // Or rethrow
    } finally {
         // Clean up canvas? Not strictly necessary if it goes out of scope,
         // but good practice if you were reusing it.
         canvas = null;
    }
}