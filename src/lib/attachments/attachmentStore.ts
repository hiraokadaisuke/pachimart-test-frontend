export type AttachmentKind = "kentuu" | "tekkyo";

export type AttachmentRecord = {
  attachmentId: string;
  inventoryId: string;
  kind: AttachmentKind;
  filename: string;
  mimeType: string;
  blob: Blob;
  createdAt: string;
};

const DB_NAME = "pachimart_attachments_v1";
const STORE_NAME = "attachments";

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("IndexedDB is not available on the server."));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "attachmentId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB."));
  });

export const createAttachmentId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const saveAttachment = async (record: AttachmentRecord): Promise<void> => {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Failed to save attachment."));
  });
  db.close();
};

export const getAttachment = async (attachmentId?: string | null): Promise<AttachmentRecord | null> => {
  if (!attachmentId) return null;
  const db = await openDb();
  const record = await new Promise<AttachmentRecord | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(attachmentId);
    request.onsuccess = () => resolve((request.result as AttachmentRecord) ?? null);
    request.onerror = () => reject(request.error ?? new Error("Failed to load attachment."));
  });
  db.close();
  return record;
};

export const openAttachmentInNewTab = async (attachmentId?: string | null): Promise<void> => {
  if (!attachmentId) {
    alert("PDFが見つかりません。再アップロードしてください。");
    return;
  }
  const record = await getAttachment(attachmentId);
  if (!record?.blob) {
    alert("PDFが見つかりません。再アップロードしてください。");
    return;
  }
  const url = URL.createObjectURL(record.blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
};
