// utils/redisClient.js
import { createClient } from 'redis';
import Logger from './logger.js'; // Assuming logger.js is also an ES module

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    if (!process.env.REDIS_URI) {
      Logger.info('Redis URI not provided, skipping Redis connection');
      return;
    }

    try {
      this.client = createClient({
        url: process.env.REDIS_URI,
      });

      this.client.on('error', (err) => {
        Logger.error('Redis error', err);
        this.isConnected = false;
      });

      this.client.on('ready', () => {
        Logger.info('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        Logger.info('Redis reconnecting');
      });

      this.client.on('connect', () => {
         Logger.info('Redis connecting...');
      });

      await this.client.connect();

    } catch (error) {
      Logger.error('Redis connection error during initial connect attempt', error);
      this.isConnected = false;
    }
  }

  async set(key, value, expiry = null) {
    if (!this.isConnected || !this.client) return false;

    try {
      const valueToStore = typeof value === 'object' ? JSON.stringify(value) : value;

      if (expiry) {
        await this.client.set(key, valueToStore, { EX: expiry });
      } else {
        await this.client.set(key, valueToStore);
      }
      return true;
    } catch (error) {
      Logger.error(`Redis set error: ${key}`, error);
      return false;
    }
  }

  async get(key) {
    if (!this.isConnected || !this.client) return null;

    try {
      const value = await this.client.get(key);
      if (value === null) return null;

      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    } catch (error) {
      Logger.error(`Redis get error: ${key}`, error);
      return null;
    }
  }

  async del(key) {
    if (!this.isConnected || !this.client) return false;

    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      Logger.error(`Redis del error: ${key}`, error);
      return false;
    }
  }

  async disconnect() {
    if (!this.client) return;

    try {
      await this.client.quit();
      Logger.info('Redis disconnected');
    } catch (error) {
      Logger.error('Redis disconnect error', error);
    } finally {
      this.isConnected = false;
      this.client = null;
    }
  }

  getClient() {
    return this.client;
  }
}

const redisClient = new RedisClient();
export default redisClient;
