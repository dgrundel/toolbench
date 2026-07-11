export type MarkdownLibrarySummary = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
};

export type MarkdownLibraryDocument = MarkdownLibrarySummary & {
  content: string;
};

type MarkdownLibraryRecord = MarkdownLibrarySummary & {
  compressedContent: ArrayBuffer;
};

const DATABASE_NAME = "toolbench-markdown-library";
const DATABASE_VERSION = 1;
const STORE_NAME = "documents";

let databasePromise: Promise<IDBDatabase> | null = null;

export async function listMarkdownDocuments(): Promise<MarkdownLibrarySummary[]> {
  const database = await getDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error ?? new Error("Unable to read markdown documents."));
    request.onsuccess = () => {
      const records = (request.result as MarkdownLibraryRecord[]).slice().sort((left, right) => {
        if (left.createdAt !== right.createdAt) {
          return left.createdAt - right.createdAt;
        }

        return left.name.localeCompare(right.name);
      });

      resolve(records.map(toSummary));
    };
  });
}

export async function loadMarkdownDocument(id: string): Promise<MarkdownLibraryDocument | null> {
  const database = await getDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onerror = () => reject(request.error ?? new Error("Unable to read markdown document."));
    request.onsuccess = async () => {
      const record = request.result as MarkdownLibraryRecord | undefined;

      if (!record) {
        resolve(null);
        return;
      }

      try {
        const content = await decompressText(record.compressedContent);

        resolve({
          id: record.id,
          name: record.name,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          content
        });
      } catch (error) {
        reject(error);
      }
    };
  });
}

export async function saveMarkdownDocument(document: {
  id: string;
  name: string;
  content: string;
  createdAt?: number;
}): Promise<MarkdownLibrarySummary> {
  const database = await getDatabase();
  const now = Date.now();
  const compressedContent = await compressText(document.content);
  const record: MarkdownLibraryRecord = {
    id: document.id,
    name: document.name,
    createdAt: document.createdAt ?? now,
    updatedAt: now,
    compressedContent
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(record);

    request.onerror = () => reject(request.error ?? new Error("Unable to save markdown document."));
    transaction.oncomplete = () => resolve(toSummary(record));
    transaction.onerror = () => reject(transaction.error ?? new Error("Unable to save markdown document."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Unable to save markdown document."));
  });
}

export async function deleteMarkdownDocument(id: string): Promise<void> {
  const database = await getDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error ?? new Error("Unable to delete markdown document."));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Unable to delete markdown document."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Unable to delete markdown document."));
  });
}

function toSummary(record: MarkdownLibraryRecord): MarkdownLibrarySummary {
  return {
    id: record.id,
    name: record.name,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

async function compressText(content: string): Promise<ArrayBuffer> {
  if (typeof CompressionStream === "undefined") {
    throw new Error("CompressionStream is not supported in this browser.");
  }

  const stream = new Blob([content]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Response(stream).arrayBuffer();
}

async function decompressText(content: ArrayBuffer): Promise<string> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("DecompressionStream is not supported in this browser.");
  }

  const stream = new Blob([content]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

async function getDatabase(): Promise<IDBDatabase> {
  if (!databasePromise) {
    databasePromise = openDatabase();
  }

  return databasePromise;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onerror = () => reject(request.error ?? new Error("Unable to open markdown library database."));
    request.onblocked = () => reject(new Error("Markdown library database upgrade is blocked."));
    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => {
      const database = request.result;

      database.onversionchange = () => {
        database.close();
        databasePromise = null;
      };

      resolve(database);
    };
  });
}
