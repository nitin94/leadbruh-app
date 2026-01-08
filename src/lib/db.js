import Dexie from 'dexie';

// Initialize IndexedDB with Dexie
export const db = new Dexie('leadbruh');

db.version(1).stores({
  leads: '++id, name, company, email, phone, createdAt, updatedAt',
  pendingCaptures: '++id, type, data, createdAt, status',
  settings: 'key, value'
});

// Request persistent storage to prevent data loss
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then((persistent) => {
    if (persistent) {
      console.log('Storage will persist and won\'t be cleared without user action');
    } else {
      console.log('Storage may be cleared by the browser under storage pressure');
    }
  });
}

// Check if storage is already persistent
if (navigator.storage && navigator.storage.persisted) {
  navigator.storage.persisted().then((isPersisted) => {
    console.log(`Storage persistence status: ${isPersisted}`);
  });
}

// Lead operations
export const leadsDB = {
  async getAll() {
    return await db.leads.orderBy('createdAt').reverse().toArray();
  },

  async add(lead) {
    const now = new Date().toISOString();
    const id = await db.leads.add({
      ...lead,
      createdAt: now,
      updatedAt: now
    });
    return await db.leads.get(id);
  },

  async update(id, updates) {
    await db.leads.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return await db.leads.get(id);
  },

  async delete(id) {
    await db.leads.delete(id);
  },

  async deleteAll() {
    await db.leads.clear();
  },

  async count() {
    return await db.leads.count();
  },

  async search(query) {
    const q = query.toLowerCase();
    return await db.leads
      .filter(lead => 
        lead.name?.toLowerCase().includes(q) ||
        lead.company?.toLowerCase().includes(q) ||
        lead.email?.toLowerCase().includes(q)
      )
      .toArray();
  }
};

// Pending captures (for offline support)
export const pendingDB = {
  async add(type, data) {
    return await db.pendingCaptures.add({
      type,
      data,
      createdAt: new Date().toISOString(),
      status: 'pending'
    });
  },

  async getAll() {
    return await db.pendingCaptures.where('status').equals('pending').toArray();
  },

  async markProcessing(id) {
    await db.pendingCaptures.update(id, { status: 'processing' });
  },

  async markComplete(id) {
    await db.pendingCaptures.delete(id);
  },

  async markFailed(id, error) {
    await db.pendingCaptures.update(id, { 
      status: 'failed',
      error: error.message 
    });
  },

  async retry(id) {
    await db.pendingCaptures.update(id, { status: 'pending' });
  },

  async clear() {
    await db.pendingCaptures.clear();
  }
};

// Settings
export const settingsDB = {
  async get(key) {
    const setting = await db.settings.get(key);
    return setting?.value;
  },

  async set(key, value) {
    await db.settings.put({ key, value });
  },

  async delete(key) {
    await db.settings.delete(key);
  }
};

export default db;
