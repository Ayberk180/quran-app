/**
 * Minimal, dependency-free ZIP writer (store / no-compression).
 *
 * Used by the admin recording tool to bundle a lesson's clips into one
 * lesson-XX.zip download. Compression is deliberately skipped: the clips are
 * webm/opus, which is already compressed, so deflate would add CPU for no size
 * win. Store mode keeps this tiny and avoids pulling in JSZip.
 *
 * Implements the parts of APPNOTE.TXT we actually need: a local file header per
 * entry, a central directory, and an end-of-central-directory record. No ZIP64,
 * no data descriptors, no Unicode flag games — fine for our small ASCII names.
 */

// CRC-32 (IEEE 802.3) with a lazily-built lookup table.
let CRC_TABLE = null;

function crcTable() {
  if (CRC_TABLE) return CRC_TABLE;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  CRC_TABLE = table;
  return table;
}

function crc32(bytes) {
  const table = crcTable();
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// DOS date/time for the entries. The exact value doesn't matter to us; use a
// fixed, valid timestamp (1980-01-01 00:00) for reproducible archives.
const DOS_TIME = 0;
const DOS_DATE = 0x21; // 1980-01-01

function nameBytes(name) {
  return new TextEncoder().encode(name);
}

/**
 * Build a ZIP archive (store mode) from a list of { name, blob } entries.
 *
 * @param {{ name: string, blob: Blob }[]} entries
 * @returns {Promise<Blob>}
 */
export async function makeZip(entries) {
  const files = [];

  // Read all blobs up front so we can compute CRCs and sizes.
  for (const { name, blob } of entries) {
    const data = new Uint8Array(await blob.arrayBuffer());
    files.push({ nameU8: nameBytes(name), data, crc: crc32(data) });
  }

  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const f of files) {
    const localHeader = new DataView(new ArrayBuffer(30));
    localHeader.setUint32(0, 0x04034b50, true); // local file header signature
    localHeader.setUint16(4, 20, true);         // version needed
    localHeader.setUint16(6, 0, true);          // flags
    localHeader.setUint16(8, 0, true);          // method: 0 = store
    localHeader.setUint16(10, DOS_TIME, true);
    localHeader.setUint16(12, DOS_DATE, true);
    localHeader.setUint32(14, f.crc, true);
    localHeader.setUint32(18, f.data.length, true); // compressed size
    localHeader.setUint32(22, f.data.length, true); // uncompressed size
    localHeader.setUint16(26, f.nameU8.length, true);
    localHeader.setUint16(28, 0, true);             // extra field length

    localParts.push(new Uint8Array(localHeader.buffer), f.nameU8, f.data);

    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true); // central dir header signature
    central.setUint16(4, 20, true);         // version made by
    central.setUint16(6, 20, true);         // version needed
    central.setUint16(8, 0, true);          // flags
    central.setUint16(10, 0, true);         // method: store
    central.setUint16(12, DOS_TIME, true);
    central.setUint16(14, DOS_DATE, true);
    central.setUint32(16, f.crc, true);
    central.setUint32(20, f.data.length, true);
    central.setUint32(24, f.data.length, true);
    central.setUint16(28, f.nameU8.length, true);
    central.setUint16(30, 0, true);         // extra length
    central.setUint16(32, 0, true);         // comment length
    central.setUint16(34, 0, true);         // disk number start
    central.setUint16(36, 0, true);         // internal attrs
    central.setUint32(38, 0, true);         // external attrs
    central.setUint32(42, offset, true);    // local header offset

    centralParts.push(new Uint8Array(central.buffer), f.nameU8);

    offset += 30 + f.nameU8.length + f.data.length;
  }

  const centralSize = centralParts.reduce((n, p) => n + p.length, 0);

  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); // end of central dir signature
  end.setUint16(4, 0, true);          // disk number
  end.setUint16(6, 0, true);          // disk with central dir
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);    // central dir offset
  end.setUint16(20, 0, true);         // comment length

  return new Blob([...localParts, ...centralParts, new Uint8Array(end.buffer)], {
    type: 'application/zip',
  });
}
