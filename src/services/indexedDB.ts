/**
 * IndexedDB service for local data storage
 */
import { CaReceipt, CaReceiptDetail } from '../types';

const DB_NAME = 'CashReceiptDB';
const DB_VERSION = 1;
const RECEIPT_STORE = 'ca_receipts';
const DETAIL_STORE = 'ca_receipt_details';

class IndexedDBService {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB database
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create receipt store
        if (!db.objectStoreNames.contains(RECEIPT_STORE)) {
          const receiptStore = db.createObjectStore(RECEIPT_STORE, { keyPath: 'ca_receipt_id' });
          receiptStore.createIndex('ca_receipt_no', 'ca_receipt_no', { unique: true });
          receiptStore.createIndex('ca_receipt_type', 'ca_receipt_type', { unique: false });
          receiptStore.createIndex('ca_status', 'ca_status', { unique: false });
        }

        // Create detail store
        if (!db.objectStoreNames.contains(DETAIL_STORE)) {
          const detailStore = db.createObjectStore(DETAIL_STORE, { keyPath: 'ca_receipt_detail_id' });
          detailStore.createIndex('ca_receipt_id', 'ca_receipt_id', { unique: false });
          detailStore.createIndex('ca_receipt_type', 'ca_receipt_type', { unique: false });
        }
      };
    });
  }

  /**
   * Get database instance
   */
  private getDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Save receipt to IndexedDB
   */
  async saveReceipt(receipt: CaReceipt): Promise<void> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([RECEIPT_STORE], 'readwrite');
      const store = transaction.objectStore(RECEIPT_STORE);
      const request = store.put(receipt);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get receipt by ID
   */
  async getReceipt(id: string): Promise<CaReceipt | null> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([RECEIPT_STORE], 'readonly');
      const store = transaction.objectStore(RECEIPT_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all receipts with pagination and filtering
   */
  async getReceipts(
    page: number = 1,
    pageSize: number = 10,
    filter?: any
  ): Promise<{ receipts: CaReceipt[]; total: number }> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([RECEIPT_STORE], 'readonly');
      const store = transaction.objectStore(RECEIPT_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        let receipts = request.result as CaReceipt[];
        
        // Apply filters
        if (filter) {
          if (filter.receiptType !== undefined) {
            receipts = receipts.filter(r => r.ca_receipt_type === filter.receiptType);
          }
          if (filter.status !== undefined) {
            receipts = receipts.filter(r => r.ca_status === filter.status);
          }
          if (filter.search) {
            const searchLower = filter.search.toLowerCase();
            receipts = receipts.filter(r => 
              r.ca_receipt_no.toLowerCase().includes(searchLower) ||
              r.note.toLowerCase().includes(searchLower)
            );
          }
        }

        // Apply pagination
        const total = receipts.length;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const paginatedReceipts = receipts.slice(start, end);

        resolve({ receipts: paginatedReceipts, total });
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete receipt
   */
  async deleteReceipt(id: string): Promise<void> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([RECEIPT_STORE], 'readwrite');
      const store = transaction.objectStore(RECEIPT_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save receipt detail
   */
  async saveReceiptDetail(detail: CaReceiptDetail): Promise<void> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DETAIL_STORE], 'readwrite');
      const store = transaction.objectStore(DETAIL_STORE);
      const request = store.put(detail);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get receipt details by receipt ID
   */
  async getReceiptDetails(receiptId: string): Promise<CaReceiptDetail[]> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DETAIL_STORE], 'readonly');
      const store = transaction.objectStore(DETAIL_STORE);
      const index = store.index('ca_receipt_id');
      const request = index.getAll(receiptId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete receipt details by receipt ID
   */
  async deleteReceiptDetails(receiptId: string): Promise<void> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DETAIL_STORE], 'readwrite');
      const store = transaction.objectStore(DETAIL_STORE);
      const index = store.index('ca_receipt_id');
      const request = index.openCursor(receiptId);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generate unique ID
   */
  generateId(): string {
    return crypto.randomUUID();
  }
}

export const indexedDBService = new IndexedDBService();

