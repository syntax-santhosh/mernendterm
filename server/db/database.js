const fs = require('fs');
const path = require('path');
const config = require('../config');
const { getSeedData } = require('./seedData');

class Database {
  constructor() {
    this.dbPath = config.DB_PATH;
    this.ensureDataDir();
    this.data = null;
    this.load();
  }

  ensureDataDir() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  load() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        this.data = JSON.parse(raw);
      } else {
        this.reset();
      }
    } catch (err) {
      console.error('Error loading database, resetting to seed data:', err);
      this.reset();
    }
  }

  save() {
    try {
      const tempPath = `${this.dbPath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, this.dbPath);
    } catch (err) {
      console.error('Failed to save database to disk:', err);
    }
  }

  reset() {
    this.data = getSeedData();
    this.save();
    console.log('Database initialized with seed data.');
    return this.data;
  }

  get(collectionName) {
    if (!this.data[collectionName]) {
      this.data[collectionName] = [];
    }
    return this.data[collectionName];
  }

  find(collectionName, predicate = () => true) {
    return this.get(collectionName).filter(predicate);
  }

  findOne(collectionName, predicate) {
    return this.get(collectionName).find(predicate);
  }

  findById(collectionName, id) {
    return this.get(collectionName).find(item => item.id === id);
  }

  insert(collectionName, item) {
    const col = this.get(collectionName);
    col.push(item);
    this.save();
    return item;
  }

  update(collectionName, id, updates) {
    const col = this.get(collectionName);
    const index = col.findIndex(item => item.id === id);
    if (index === -1) return null;

    col[index] = {
      ...col[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return col[index];
  }

  delete(collectionName, id) {
    const col = this.get(collectionName);
    const index = col.findIndex(item => item.id === id);
    if (index === -1) return false;

    col.splice(index, 1);
    this.save();
    return true;
  }
}

const db = new Database();
module.exports = db;
