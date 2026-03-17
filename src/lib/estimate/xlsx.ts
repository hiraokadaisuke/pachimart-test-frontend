const textEncoder = new TextEncoder();

const ZIP_LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const ZIP_CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const value of data) {
    crc = crcTable[(crc ^ value) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function xmlEscape(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function getColumnName(columnIndex: number) {
  let dividend = columnIndex;
  let columnName = "";

  while (dividend > 0) {
    const modulo = (dividend - 1) % 26;
    columnName = String.fromCharCode(65 + modulo) + columnName;
    dividend = Math.floor((dividend - modulo) / 26);
  }

  return columnName;
}

type ZipEntry = {
  name: string;
  data: Uint8Array;
  crc: number;
  offset: number;
};

function createZip(files: Array<{ name: string; content: string }>) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  const entries: ZipEntry[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = textEncoder.encode(file.name);
    const data = textEncoder.encode(file.content);
    const crc = crc32(data);

    const localHeader = new ArrayBuffer(30 + nameBytes.length);
    const localView = new DataView(localHeader);
    localView.setUint32(0, ZIP_LOCAL_FILE_HEADER_SIGNATURE, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true);
    new Uint8Array(localHeader, 30, nameBytes.length).set(nameBytes);

    localParts.push(new Uint8Array(localHeader), data);

    entries.push({ name: file.name, data, crc, offset });
    offset += localHeader.byteLength + data.length;
  }

  let centralOffset = 0;
  for (const entry of entries) {
    const nameBytes = textEncoder.encode(entry.name);
    const centralHeader = new ArrayBuffer(46 + nameBytes.length);
    const centralView = new DataView(centralHeader);
    centralView.setUint32(0, ZIP_CENTRAL_DIRECTORY_SIGNATURE, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, entry.crc, true);
    centralView.setUint32(20, entry.data.length, true);
    centralView.setUint32(24, entry.data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, entry.offset, true);
    new Uint8Array(centralHeader, 46, nameBytes.length).set(nameBytes);

    centralParts.push(new Uint8Array(centralHeader));
    centralOffset += centralHeader.byteLength;
  }

  const endRecord = new ArrayBuffer(22);
  const endView = new DataView(endRecord);
  endView.setUint32(0, ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralOffset, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, new Uint8Array(endRecord)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function buildSheetXml(headers: string[], rows: string[][], columnWidths: number[]) {
  const allRows = [headers, ...rows];

  const cols = columnWidths
    .map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`)
    .join("");

  const rowXml = allRows
    .map((values, rowIndex) => {
      const cells = values
        .map((value, colIndex) => {
          const cellRef = `${getColumnName(colIndex + 1)}${rowIndex + 1}`;
          const styleIndex = rowIndex === 0 ? 1 : 0;
          return `<c r="${cellRef}" t="inlineStr" s="${styleIndex}"><is><t>${xmlEscape(value)}</t></is></c>`;
        })
        .join("");

      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${getColumnName(headers.length)}${allRows.length}"/>
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>${cols}</cols>
  <sheetData>${rowXml}</sheetData>
</worksheet>`;
}

function buildWorkbookXml(sheetName: string) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${xmlEscape(sheetName)}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;
}

export function downloadEstimateXlsx({
  fileName,
  sheetName,
  headers,
  rows,
  columnWidths,
}: {
  fileName: string;
  sheetName: string;
  headers: string[];
  rows: string[][];
  columnWidths: number[];
}) {
  const files = [
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
    },
    {
      name: "docProps/app.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>pachimart-test-frontend</Application>
</Properties>`,
    },
    {
      name: "docProps/core.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:creator>pachimart-test-frontend</dc:creator>
</cp:coreProperties>`,
    },
    {
      name: "xl/workbook.xml",
      content: buildWorkbookXml(sheetName),
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      name: "xl/styles.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyFont="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
</styleSheet>`,
    },
    {
      name: "xl/worksheets/sheet1.xml",
      content: buildSheetXml(headers, rows, columnWidths),
    },
  ];

  const blob = createZip(files);
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

type ImportedEstimateRow = {
  manufacturer: string;
  machineName: string;
  quantity: string;
  memo: string;
};

type ZipEntryMeta = {
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
};

const requiredTemplateHeaders = ["メーカー名", "機種名", "数量", "メモ"] as const;

const normalizeCellValue = (value: unknown) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const decodeZipText = new TextDecoder("utf-8");

const inflateRaw = async (data: Uint8Array) => {
  const stream = new DecompressionStream("deflate-raw");
  const writer = stream.writable.getWriter();
  writer.write(data);
  writer.close();
  const decompressed = await new Response(stream.readable).arrayBuffer();
  return new Uint8Array(decompressed);
};

const findZipEntries = (bytes: Uint8Array) => {
  let endOffset = -1;
  for (let offset = bytes.length - 22; offset >= 0; offset -= 1) {
    const signature = new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, true);
    if (signature === ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
      endOffset = offset;
      break;
    }
  }

  if (endOffset < 0) {
    throw new Error("テンプレート形式ではありません");
  }

  const endView = new DataView(bytes.buffer, bytes.byteOffset + endOffset, 22);
  const centralDirectoryOffset = endView.getUint32(16, true);
  const totalEntries = endView.getUint16(10, true);

  const entries = new Map<string, ZipEntryMeta>();
  let pointer = centralDirectoryOffset;

  for (let i = 0; i < totalEntries; i += 1) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + pointer, 46);
    if (view.getUint32(0, true) !== ZIP_CENTRAL_DIRECTORY_SIGNATURE) {
      throw new Error("テンプレート形式ではありません");
    }

    const compressionMethod = view.getUint16(10, true);
    const compressedSize = view.getUint32(20, true);
    const fileNameLength = view.getUint16(28, true);
    const extraFieldLength = view.getUint16(30, true);
    const fileCommentLength = view.getUint16(32, true);
    const localHeaderOffset = view.getUint32(42, true);

    const nameStart = pointer + 46;
    const nameEnd = nameStart + fileNameLength;
    const fileName = decodeZipText.decode(bytes.slice(nameStart, nameEnd));

    entries.set(fileName, { compressionMethod, compressedSize, localHeaderOffset });

    pointer = nameEnd + extraFieldLength + fileCommentLength;
  }

  return entries;
};

const getZipEntryData = async (bytes: Uint8Array, entries: Map<string, ZipEntryMeta>, name: string) => {
  const entry = entries.get(name);
  if (!entry) {
    return null;
  }

  const headerView = new DataView(bytes.buffer, bytes.byteOffset + entry.localHeaderOffset, 30);
  if (headerView.getUint32(0, true) !== ZIP_LOCAL_FILE_HEADER_SIGNATURE) {
    throw new Error("テンプレート形式ではありません");
  }

  const fileNameLength = headerView.getUint16(26, true);
  const extraFieldLength = headerView.getUint16(28, true);
  const dataStart = entry.localHeaderOffset + 30 + fileNameLength + extraFieldLength;
  const compressed = bytes.slice(dataStart, dataStart + entry.compressedSize);

  if (entry.compressionMethod === 0) {
    return compressed;
  }
  if (entry.compressionMethod === 8) {
    return inflateRaw(compressed);
  }

  throw new Error("テンプレート形式ではありません");
};

const getSheetRows = (sheetXml: string, sharedStrings: string[]) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(sheetXml, "application/xml");
  const rows = Array.from(doc.getElementsByTagName("row"));

  return rows.map((rowNode) => {
    const row: string[] = [];
    const cells = Array.from(rowNode.getElementsByTagName("c"));

    for (const cell of cells) {
      const ref = cell.getAttribute("r") ?? "";
      const letters = ref.match(/^[A-Z]+/)?.[0] ?? "A";
      let columnIndex = 0;
      for (const char of letters) {
        columnIndex = columnIndex * 26 + (char.charCodeAt(0) - 64);
      }
      columnIndex -= 1;

      const cellType = cell.getAttribute("t");
      const valueNode = cell.getElementsByTagName("v")[0];
      const inlineNode = cell.getElementsByTagName("t")[0];

      let value = "";
      if (cellType === "s") {
        const index = Number.parseInt(valueNode?.textContent ?? "", 10);
        value = Number.isFinite(index) ? sharedStrings[index] ?? "" : "";
      } else if (cellType === "inlineStr") {
        value = inlineNode?.textContent ?? "";
      } else {
        value = valueNode?.textContent ?? "";
      }

      row[columnIndex] = normalizeCellValue(value);
    }

    return row;
  });
};

const getSharedStrings = (xml: string | null) => {
  if (!xml) return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  return Array.from(doc.getElementsByTagName("si")).map((node) =>
    normalizeCellValue(
      Array.from(node.getElementsByTagName("t"))
        .map((textNode) => textNode.textContent ?? "")
        .join(""),
    ),
  );
};

export async function parseEstimateImportFile(file: File): Promise<ImportedEstimateRow[]> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const entries = findZipEntries(bytes);

  const sheetData = await getZipEntryData(bytes, entries, "xl/worksheets/sheet1.xml");
  if (!sheetData) {
    throw new Error("テンプレート形式ではありません");
  }

  const sharedStringsData = await getZipEntryData(bytes, entries, "xl/sharedStrings.xml");
  const sharedStrings = getSharedStrings(sharedStringsData ? decodeZipText.decode(sharedStringsData) : null);
  const rows = getSheetRows(decodeZipText.decode(sheetData), sharedStrings);

  if (rows.length === 0) return [];

  const headerRow = rows[0].map((cell) => normalizeCellValue(cell));
  const headerMap = new Map<string, number>();
  headerRow.forEach((header, index) => {
    if (header) headerMap.set(header, index);
  });

  const missingHeader = requiredTemplateHeaders.find((header) => !headerMap.has(header));
  if (missingHeader) {
    throw new Error("テンプレート形式ではありません");
  }

  return rows
    .slice(1)
    .map((row) => ({
      manufacturer: normalizeCellValue(row[headerMap.get("メーカー名") ?? -1]),
      machineName: normalizeCellValue(row[headerMap.get("機種名") ?? -1]),
      quantity: normalizeCellValue(row[headerMap.get("数量") ?? -1]),
      memo: normalizeCellValue(row[headerMap.get("メモ") ?? -1]),
    }))
    .filter((row) => Boolean(row.manufacturer || row.machineName || row.quantity || row.memo));
}
