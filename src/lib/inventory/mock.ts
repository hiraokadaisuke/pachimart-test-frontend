export type InventoryStatus = "stock" | "installed" | "inactive";

export type InventoryHistoryEntry = {
  id: string;
  date: string;
  action: string;
  location: string;
  operator?: string;
};

export type InventoryItem = {
  id: string;
  status: InventoryStatus;
  maker: string;
  model: string;
  storageHub: string;
  storageLocation: string;
  stockedAt: string;
  partner: string;
  removedAt?: string;
  readAt?: string;
  reader?: string;
  updatedAt: string;
  history: InventoryHistoryEntry[];
};

export type InventoryImportRead = {
  id: string;
  readAt: string;
  source: string;
  qrPayload?: string;
  qrRaw?: string;
  maker?: string;
  model?: string;
  storageHub?: string;
  storageLocation?: string;
  confirmed: boolean;
};

export type QrImportPayload = {
  qrRaw: string;
  maker?: string;
  model?: string;
  source?: string;
};

export type ConfirmImportPayload = {
  maker: string;
  model: string;
  manufacturedAt?: string;
  certificationNumber?: string;
  certificationDate?: string;
  storageHub: string;
  storageLocation: string;
};

export type ManualItemPayload = {
  maker: string;
  model: string;
  storageHub: string;
  storageLocation: string;
  stockedAt?: string;
  partner?: string;
};

const now = new Date();
const formatDate = (date: Date) => date.toISOString().slice(0, 10);
const formatDateTime = (date: Date) =>
  `${date.toISOString().slice(0, 10)} ${date.toTimeString().slice(0, 5)}`;

let items: InventoryItem[] = [
  {
    id: "INV-1001",
    status: "stock",
    maker: "SANYO",
    model: "P海物語 極JAPAN",
    storageHub: "東東京倉庫",
    storageLocation: "A-12",
    stockedAt: "2024-07-18",
    partner: "豊島商事",
    readAt: "2024-07-18 09:12",
    reader: "佐藤",
    updatedAt: "2024-07-18 09:25",
    history: [
      {
        id: "H-1001",
        date: "2024-07-18 09:25",
        action: "入庫",
        location: "東東京倉庫 / A-12",
        operator: "佐藤",
      },
    ],
  },
  {
    id: "INV-2001",
    status: "installed",
    maker: "Sammy",
    model: "北斗の拳9",
    storageHub: "新宿店",
    storageLocation: "島3列",
    stockedAt: "2024-06-05",
    partner: "新宿ホール",
    removedAt: "",
    readAt: "2024-06-05 14:10",
    reader: "田中",
    updatedAt: "2024-07-10 18:02",
    history: [
      {
        id: "H-2001",
        date: "2024-06-05 14:20",
        action: "設置",
        location: "新宿店 / 島3列",
        operator: "田中",
      },
      {
        id: "H-2002",
        date: "2024-07-10 18:02",
        action: "点検",
        location: "新宿店 / 島3列",
        operator: "鈴木",
      },
    ],
  },
  {
    id: "INV-3001",
    status: "inactive",
    maker: "UNIVERSAL",
    model: "沖ドキ!DUO",
    storageHub: "埼玉倉庫",
    storageLocation: "Z-02",
    stockedAt: "2024-05-22",
    partner: "川口ホール",
    removedAt: "2024-06-30",
    readAt: "2024-05-22 10:05",
    reader: "吉田",
    updatedAt: "2024-06-30 16:40",
    history: [
      {
        id: "H-3001",
        date: "2024-05-22 10:15",
        action: "入庫",
        location: "埼玉倉庫 / Z-02",
        operator: "吉田",
      },
      {
        id: "H-3002",
        date: "2024-06-30 16:40",
        action: "撤去",
        location: "川口ホール / 島1列",
        operator: "吉田",
      },
    ],
  },
];

let importedReads: InventoryImportRead[] = [
  {
    id: "READ-01",
    readAt: formatDateTime(new Date(now.getTime() - 1000 * 60 * 30)),
    source: "プリセットA",
    maker: "SANYO",
    model: "海物語JAPAN2",
    storageHub: "東東京倉庫",
    storageLocation: "B-07",
    confirmed: false,
  },
  {
    id: "READ-02",
    readAt: formatDateTime(new Date(now.getTime() - 1000 * 60 * 60 * 2)),
    source: "プリセットB",
    maker: "SANKYO",
    model: "からくりサーカス",
    storageHub: "西東京倉庫",
    storageLocation: "C-03",
    confirmed: false,
  },
  {
    id: "READ-03",
    readAt: formatDateTime(new Date(now.getTime() - 1000 * 60 * 90)),
    source: "プリセットC",
    maker: "Sammy",
    model: "ディスクアップ2",
    storageHub: "埼玉倉庫",
    storageLocation: "D-18",
    confirmed: false,
  },
];

export function listItems(type: InventoryStatus) {
  return items.filter((item) => item.status === type);
}

export function getItem(id: string) {
  return items.find((item) => item.id === id) ?? null;
}

export function listImportedReads() {
  return importedReads.filter((read) => !read.confirmed);
}

export function listImports() {
  return listImportedReads();
}

export function addImport(qrPayload: string) {
  const timestamp = formatDateTime(new Date());
  const nextId = `READ-${Math.floor(100 + Math.random() * 900)}`;
  const nextImport: InventoryImportRead = {
    id: nextId,
    readAt: timestamp,
    source: "QR仮登録",
    qrPayload,
    qrRaw: qrPayload,
    confirmed: false,
  };

  importedReads = [nextImport, ...importedReads];
  return nextImport;
}

export function addImportFromQr(payload: QrImportPayload) {
  const timestamp = formatDateTime(new Date());
  const nextId = `READ-${Math.floor(100 + Math.random() * 900)}`;
  const nextImport: InventoryImportRead = {
    id: nextId,
    readAt: timestamp,
    source: payload.source ?? "QR仮登録",
    qrPayload: payload.qrRaw,
    qrRaw: payload.qrRaw,
    maker: payload.maker,
    model: payload.model,
    confirmed: false,
  };

  importedReads = [nextImport, ...importedReads];
  return nextImport;
}

export function confirmImport(readId: string, payload: ConfirmImportPayload) {
  const read = importedReads.find((entry) => entry.id === readId);
  if (!read || read.confirmed) return null;

  read.confirmed = true;
  const nextId = `INV-${Math.floor(4000 + Math.random() * 500)}`;
  const timestamp = formatDateTime(new Date());
  const stockDate = formatDate(new Date());

  const newItem: InventoryItem = {
    id: nextId,
    status: "stock",
    maker: payload.maker,
    model: payload.model,
    storageHub: payload.storageHub,
    storageLocation: payload.storageLocation,
    stockedAt: stockDate,
    partner: read.source,
    readAt: read.readAt,
    reader: "仮登録",
    updatedAt: timestamp,
    history: [
      {
        id: `H-${nextId}`,
        date: timestamp,
        action: "入庫",
        location: `${payload.storageHub} / ${payload.storageLocation}`,
        operator: "仮登録",
      },
    ],
  };

  items = [newItem, ...items];
  importedReads = importedReads.filter((entry) => entry.id !== readId);
  return newItem;
}

export function createItemManual(payload: ManualItemPayload) {
  const nextId = `INV-${Math.floor(5000 + Math.random() * 500)}`;
  const timestamp = formatDateTime(new Date());
  const stockDate = payload.stockedAt ?? formatDate(new Date());
  const newItem: InventoryItem = {
    id: nextId,
    status: "stock",
    maker: payload.maker,
    model: payload.model,
    storageHub: payload.storageHub,
    storageLocation: payload.storageLocation,
    stockedAt: stockDate,
    partner: payload.partner ?? "手入力",
    readAt: timestamp,
    reader: "手入力",
    updatedAt: timestamp,
    history: [
      {
        id: `H-${nextId}`,
        date: timestamp,
        action: "入庫",
        location: `${payload.storageHub} / ${payload.storageLocation}`,
        operator: "手入力",
      },
    ],
  };

  items = [newItem, ...items];
  return newItem;
}

export function getInventorySummary() {
  return {
    stock: listItems("stock").length,
    installed: listItems("installed").length,
    inactive: listItems("inactive").length,
    pending: listImports().length,
  };
}
