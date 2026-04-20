import type { LoadedViewerGraph } from "../types/viewerGraph";

const DB_NAME = "novel-graph-viewer";
const DB_VERSION = 1;
const STORE_NAME = "node-avatars";
const PROJECT_INDEX = "by-project";

type AvatarRecord = {
  id: string;
  projectKey: string;
  nodeId: string;
  dataUrl: string;
  updatedAt: number;
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      const store = database.objectStoreNames.contains(STORE_NAME)
        ? request.transaction!.objectStore(STORE_NAME)
        : database.createObjectStore(STORE_NAME, { keyPath: "id" });

      if (!store.indexNames.contains(PROJECT_INDEX)) {
        store.createIndex(PROJECT_INDEX, "projectKey", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to open avatar database."));
  });

  return dbPromise;
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  runner: (store: IDBObjectStore) => Promise<T>,
): Promise<T> {
  return openDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);

        runner(store).then(resolve).catch(reject);
        transaction.onerror = () =>
          reject(
            transaction.error ?? new Error("Avatar database transaction failed."),
          );
      }),
  );
}

export function getAvatarProjectKey(loaded: LoadedViewerGraph): string {
  return `${loaded.data.project.id}::${loaded.sourceName}`;
}

export function listProjectAvatars(
  projectKey: string,
): Promise<Record<string, string>> {
  return runTransaction("readonly", (store) => {
    const index = store.index(PROJECT_INDEX);

    return new Promise((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.only(projectKey));

      request.onsuccess = () => {
        const records = (request.result as AvatarRecord[]) ?? [];
        resolve(
          Object.fromEntries(records.map((record) => [record.nodeId, record.dataUrl])),
        );
      };
      request.onerror = () =>
        reject(request.error ?? new Error("Failed to load project avatars."));
    });
  });
}

export function saveNodeAvatar(
  projectKey: string,
  nodeId: string,
  dataUrl: string,
): Promise<void> {
  const record: AvatarRecord = {
    id: `${projectKey}::${nodeId}`,
    projectKey,
    nodeId,
    dataUrl,
    updatedAt: Date.now(),
  };

  return runTransaction("readwrite", (store) => {
    return new Promise((resolve, reject) => {
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(request.error ?? new Error("Failed to save node avatar."));
    });
  });
}

export function removeNodeAvatar(
  projectKey: string,
  nodeId: string,
): Promise<void> {
  return runTransaction("readwrite", (store) => {
    return new Promise((resolve, reject) => {
      const request = store.delete(`${projectKey}::${nodeId}`);
      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(request.error ?? new Error("Failed to remove node avatar."));
    });
  });
}

export function imageFileToAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const size = 384;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      URL.revokeObjectURL(objectUrl);

      if (!context) {
        reject(new Error("Canvas 2D context is unavailable."));
        return;
      }

      canvas.width = size;
      canvas.height = size;

      const sourceSize = Math.min(image.width, image.height);
      const sourceX = (image.width - sourceSize) / 2;
      const sourceY = (image.height - sourceSize) / 2;

      context.fillStyle = "#020617";
      context.fillRect(0, 0, size, size);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        size,
        size,
      );

      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to read the selected image."));
    };

    image.src = objectUrl;
  });
}
