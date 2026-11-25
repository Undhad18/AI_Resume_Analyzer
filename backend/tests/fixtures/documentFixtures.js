import zlib from "zlib";

/**
 * Creates a valid minimal PDF buffer with valid catalog, pages, page, stream, xref, and trailer
 * @param {string} text
 * @returns {Buffer}
 */
export const createValidPdfBuffer = (text = "Resume Content") => {
    const streamContent = `BT /F1 12 Tf 72 712 Td (${text}) Tj ET`;
    const streamLength = Buffer.byteLength(streamContent, "utf8");

    const pdf = [
        "%PDF-1.4",
        "1 0 obj",
        "<< /Type /Catalog /Pages 2 0 R >>",
        "endobj",
        "2 0 obj",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "endobj",
        "3 0 obj",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>",
        "endobj",
        "4 0 obj",
        `<< /Length ${streamLength} >>`,
        "stream",
        streamContent,
        "endstream",
        "endobj",
        "xref",
        "0 5",
        "0000000000 65535 f ",
        "0000000009 00000 n ",
        "0000000058 00000 n ",
        "0000000115 00000 n ",
        "0000000206 00000 n ",
        "trailer",
        "<< /Size 5 /Root 1 0 R >>",
        "startxref",
        "310",
        "%%EOF"
    ].join("\n");

    return Buffer.from(pdf, "utf8");
};

/**
 * Creates a valid JPEG binary buffer
 * @returns {Buffer}
 */
export const createValidJpgBuffer = () => {
    return Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0xFF, 0xD9
    ]);
};

/**
 * Creates a valid PNG binary buffer
 * @returns {Buffer}
 */
export const createValidPngBuffer = () => {
    return Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, // IHDR length
        0x49, 0x48, 0x44, 0x52, // IHDR
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00,
        0x90, 0x77, 0x53, 0xDE, // CRC
        0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND
    ]);
};

/**
 * Generates an in-memory ZIP archive from a list of entry objects using raw zlib deflate
 * @param {Array<{name: string, content: string|Buffer}>} files
 * @returns {Buffer}
 */
export const createZipBuffer = (files) => {
    const localHeaders = [];
    const centralHeaders = [];
    let offset = 0;

    for (const file of files) {
        const nameBuf = Buffer.from(file.name, "utf8");
        const contentBuf = Buffer.isBuffer(file.content)
            ? file.content
            : Buffer.from(file.content || "", "utf8");

        const compressed = zlib.deflateRawSync(contentBuf);
        const crc32 = zlib.crc32 ? zlib.crc32(contentBuf) : 0;

        // Local header: 30 bytes + name length + content length
        const local = Buffer.alloc(30 + nameBuf.length + compressed.length);
        local.writeUInt32LE(0x04034b50, 0); // Local header signature PK\x03\x04
        local.writeUInt16LE(20, 4);         // Version needed
        local.writeUInt16LE(0, 6);          // General purpose bit flag
        local.writeUInt16LE(8, 8);          // Compression method: 8 (deflate)
        local.writeUInt16LE(0, 10);         // Mod time
        local.writeUInt16LE(0, 12);         // Mod date
        local.writeUInt32LE(crc32, 14);     // CRC-32
        local.writeUInt32LE(compressed.length, 18); // Compressed size
        local.writeUInt32LE(contentBuf.length, 22); // Uncompressed size
        local.writeUInt16LE(nameBuf.length, 26);    // Filename length
        local.writeUInt16LE(0, 28);                 // Extra field length
        nameBuf.copy(local, 30);
        compressed.copy(local, 30 + nameBuf.length);

        localHeaders.push(local);

        // Central directory header: 46 bytes + name length
        const central = Buffer.alloc(46 + nameBuf.length);
        central.writeUInt32LE(0x02014b50, 0); // Central header signature PK\x01\x02
        central.writeUInt16LE(20, 4);         // Version made by
        central.writeUInt16LE(20, 6);         // Version needed
        central.writeUInt16LE(0, 8);          // General purpose bit flag
        central.writeUInt16LE(8, 10);         // Compression method (deflate)
        central.writeUInt16LE(0, 12);         // Mod time
        central.writeUInt16LE(0, 14);         // Mod date
        central.writeUInt32LE(crc32, 16);     // CRC-32
        central.writeUInt32LE(compressed.length, 20); // Compressed size
        central.writeUInt32LE(contentBuf.length, 24); // Uncompressed size
        central.writeUInt16LE(nameBuf.length, 28);    // Filename length
        central.writeUInt16LE(0, 30);         // Extra field length
        central.writeUInt16LE(0, 32);         // Comment length
        central.writeUInt16LE(0, 34);         // Disk number start
        central.writeUInt16LE(0, 36);         // Internal attributes
        central.writeUInt32LE(0, 38);         // External attributes
        central.writeUInt32LE(offset, 42);    // Relative offset of local header
        nameBuf.copy(central, 46);

        centralHeaders.push(central);
        offset += local.length;
    }

    const centralDirOffset = offset;
    const centralDirSize = centralHeaders.reduce((acc, h) => acc + h.length, 0);

    // End of central directory record (EOCD): 22 bytes
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature PK\x05\x06
    eocd.writeUInt16LE(0, 4);          // Disk number
    eocd.writeUInt16LE(0, 6);          // Start disk
    eocd.writeUInt16LE(files.length, 8);  // Entries on disk
    eocd.writeUInt16LE(files.length, 10); // Total entries
    eocd.writeUInt32LE(centralDirSize, 12); // Central dir size
    eocd.writeUInt32LE(centralDirOffset, 16); // Central dir offset
    eocd.writeUInt16LE(0, 20);         // Comment length

    return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
};

/**
 * Creates a valid multi-page PDF buffer with selectable text across pages
 * @param {string[]} pagesText
 * @returns {Buffer}
 */
export const createMultiPagePdfBuffer = (pagesText = ["First Page Content", "Second Page Skills"]) => {
    const pageObjects = [];
    const streamObjects = [];
    const kids = [];

    const fontObjNum = 3 + (pagesText.length * 2);

    pagesText.forEach((text, i) => {
        const pageNum = 3 + (i * 2);
        const streamNum = 4 + (i * 2);
        kids.push(`${pageNum} 0 R`);

        pageObjects.push(
            `${pageNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${streamNum} 0 R /Resources << /Font << /F1 ${fontObjNum} 0 R >> >> >>\nendobj`
        );

        const streamContent = `BT /F1 12 Tf 72 712 Td (${text}) Tj ET`;
        const len = Buffer.byteLength(streamContent, "utf8");
        streamObjects.push(
            `${streamNum} 0 obj\n<< /Length ${len} >>\nstream\n${streamContent}\nendstream\nendobj`
        );
    });

    const fontObj = `${fontObjNum} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`;

    const totalObjs = fontObjNum;
    const body = [
        "%PDF-1.4",
        "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
        `2 0 obj\n<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${pagesText.length} >>\nendobj`,
        ...pageObjects,
        ...streamObjects,
        fontObj
    ].join("\n");

    const lines = body.split("\n");
    let currentOffset = 0;
    const offsets = [];
    lines.forEach((line) => {
        if (/^\d+ 0 obj/.test(line)) {
            offsets.push(currentOffset);
        }
        currentOffset += Buffer.byteLength(line, "utf8") + 1;
    });

    const xref = [
        "xref",
        `0 ${totalObjs + 1}`,
        "0000000000 65535 f "
    ];
    offsets.forEach((off) => {
        xref.push(String(off).padStart(10, "0") + " 00000 n ");
    });

    const trailer = [
        xref.join("\n"),
        "trailer",
        `<< /Size ${totalObjs + 1} /Root 1 0 R >>`,
        "startxref",
        String(currentOffset),
        "%%EOF"
    ].join("\n");

    return Buffer.from(`${body}\n${trailer}`, "utf8");
};

/**
 * Creates a valid PDF that contains no text content (e.g. empty or scanned blank)
 * @returns {Buffer}
 */
export const createEmptyPdfBuffer = () => {
    const pdf = [
        "%PDF-1.4",
        "1 0 obj",
        "<< /Type /Catalog /Pages 2 0 R >>",
        "endobj",
        "2 0 obj",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "endobj",
        "3 0 obj",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>",
        "endobj",
        "xref",
        "0 4",
        "0000000000 65535 f ",
        "0000000009 00000 n ",
        "0000000058 00000 n ",
        "0000000115 00000 n ",
        "trailer",
        "<< /Size 4 /Root 1 0 R >>",
        "startxref",
        "190",
        "%%EOF"
    ].join("\n");

    return Buffer.from(pdf, "utf8");
};

/**
 * Creates an encrypted / password-protected PDF buffer
 * @returns {Buffer}
 */
export const createEncryptedPdfBuffer = () => {
    const pdf = [
        "%PDF-1.4",
        "1 0 obj",
        "<< /Type /Catalog /Pages 2 0 R >>",
        "endobj",
        "2 0 obj",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "endobj",
        "3 0 obj",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>",
        "endobj",
        "4 0 obj",
        "<< /Filter /Standard /V 2 /R 3 /O <0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef> /U <0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef> /P -4 >>",
        "endobj",
        "xref",
        "0 5",
        "0000000000 65535 f ",
        "0000000009 00000 n ",
        "0000000058 00000 n ",
        "0000000115 00000 n ",
        "0000000190 00000 n ",
        "trailer",
        "<< /Size 5 /Root 1 0 R /Encrypt 4 0 R /ID [<1234567890abcdef1234567890abcdef> <1234567890abcdef1234567890abcdef>] >>",
        "startxref",
        "380",
        "%%EOF"
    ].join("\n");

    return Buffer.from(pdf, "utf8");
};

/**
 * Creates a valid DOCX buffer with multiple distinct paragraphs and headings
 * @param {string[]} paragraphs
 * @returns {Buffer}
 */
export const createMultiParagraphDocxBuffer = (paragraphs = ["Professional Summary", "Senior Full-Stack Engineer", "Technical Skills: React, Node.js, Express, MySQL"]) => {
    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

    const paragraphsXml = paragraphs
        .map((p) => `<w:p><w:r><w:t>${p}</w:t></w:r></w:p>`)
        .join("");

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphsXml}
  </w:body>
</w:document>`;

    return createZipBuffer([
        { name: "[Content_Types].xml", content: contentTypesXml },
        { name: "word/document.xml", content: documentXml }
    ]);
};

/**
 * Creates an empty DOCX archive (valid OOXML structure, but empty body text)
 * @returns {Buffer}
 */
export const createEmptyDocxBuffer = () => {
    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p/>
  </w:body>
</w:document>`;

    return createZipBuffer([
        { name: "[Content_Types].xml", content: contentTypesXml },
        { name: "word/document.xml", content: documentXml }
    ]);
};

/**
 * Creates an invalid DOCX archive missing the mandatory word/document.xml entry
 * @returns {Buffer}
 */
export const createDocxWithoutDocumentXml = () => {
    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
</Types>`;

    return createZipBuffer([
        { name: "[Content_Types].xml", content: contentTypesXml }
    ]);
};

/**
 * Creates a valid minimal DOCX archive buffer containing required OpenXML parts
 * @param {string} text
 * @returns {Buffer}
 */
export const createValidDocxBuffer = (text = "Resume Candidate Profile") => {
    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>${text}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

    return createZipBuffer([
        { name: "[Content_Types].xml", content: contentTypesXml },
        { name: "word/document.xml", content: documentXml }
    ]);
};
