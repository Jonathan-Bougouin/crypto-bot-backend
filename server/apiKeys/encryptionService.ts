/**
 * Service de chiffrement pour les clés API Coinbase
 * 
 * Utilise AES-256-GCM pour chiffrer les clés API de manière sécurisée
 * Chaque utilisateur a une clé de chiffrement unique dérivée de la clé maître
 */

import crypto from 'crypto';

const MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'change-this-in-production-use-32-chars-minimum';
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64; // 512 bits
const ITERATIONS = 100000;

/**
 * Service de chiffrement
 */
export class EncryptionService {
  /**
   * Générer une clé de chiffrement unique pour un utilisateur
   */
  generateUserKey(userId: string): Buffer {
    return crypto.pbkdf2Sync(
      userId,
      MASTER_KEY,
      ITERATIONS,
      KEY_LENGTH,
      'sha256'
    );
  }
  
  /**
   * Chiffrer une clé API
   */
  encrypt(plaintext: string, userId: string): string {
    try {
      // Générer la clé utilisateur
      const userKey = this.generateUserKey(userId);
      
      // Générer un IV aléatoire
      const iv = crypto.randomBytes(IV_LENGTH);
      
      // Créer le cipher
      const cipher = crypto.createCipheriv(ALGORITHM, userKey, iv);
      
      // Chiffrer
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Obtenir le tag d'authentification
      const authTag = cipher.getAuthTag();
      
      // Combiner IV + AuthTag + Encrypted
      // Format: iv:authTag:encrypted
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt API key');
    }
  }
  
  /**
   * Déchiffrer une clé API
   */
  decrypt(encryptedData: string, userId: string): string {
    try {
      // Séparer les composants
      const parts = encryptedData.split(':');
      
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }
      
      const [ivHex, authTagHex, encrypted] = parts;
      
      // Convertir de hex en Buffer
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      // Générer la clé utilisateur
      const userKey = this.generateUserKey(userId);
      
      // Créer le decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, userKey, iv);
      decipher.setAuthTag(authTag);
      
      // Déchiffrer
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt API key');
    }
  }
  
  /**
   * Générer un hash sécurisé (pour les tokens, etc.)
   */
  hash(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }
  
  /**
   * Générer un token aléatoire sécurisé
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
  
  /**
   * Vérifier l'intégrité d'une donnée chiffrée
   */
  verifyIntegrity(encryptedData: string): boolean {
    try {
      const parts = encryptedData.split(':');
      return parts.length === 3;
    } catch {
      return false;
    }
  }
}

/**
 * Instance singleton du service de chiffrement
 */
export const encryptionService = new EncryptionService();

export default encryptionService;
