import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure database directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class JsonModel {
  constructor(filename) {
    this.filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  async read() {
    try {
      const data = await fs.promises.readFile(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${this.filePath}:`, error);
      return [];
    }
  }

  async write(data) {
    try {
      await fs.promises.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error(`Error writing to ${this.filePath}:`, error);
    }
  }

  async find(filter = {}) {
    const items = await this.read();
    return items.filter(item => {
      for (const key in filter) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    });
  }

  async findById(id) {
    const items = await this.read();
    return items.find(item => item._id === id) || null;
  }

  async create(doc) {
    const items = await this.read();
    const newDoc = {
      _id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      ...doc
    };
    items.push(newDoc);
    await this.write(items);
    return newDoc;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const items = await this.read();
    const index = items.findIndex(item => item._id === id);
    if (index === -1) return null;
    
    const item = items[index];
    let updatedItem = { ...item };

    // Support Mongoose-like $inc operator if used
    if (update.$inc) {
      for (const field in update.$inc) {
        updatedItem[field] = (updatedItem[field] || 0) + update.$inc[field];
      }
      // Shallow copy the rest, removing $inc
      const { $inc, ...restUpdate } = update;
      updatedItem = { ...updatedItem, ...restUpdate };
    } else {
      updatedItem = { ...updatedItem, ...update };
    }
    
    items[index] = updatedItem;
    await this.write(items);
    return updatedItem;
  }

  async findByIdAndDelete(id) {
    const items = await this.read();
    const index = items.findIndex(item => item._id === id);
    if (index === -1) return null;
    const [deleted] = items.splice(index, 1);
    await this.write(items);
    return deleted;
  }
}

export const TaskDb = new JsonModel('tasks.json');
export const SessionDb = new JsonModel('sessions.json');
