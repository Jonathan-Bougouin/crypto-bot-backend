import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema_saas";
import mysql from "mysql2/promise";

// Configuration de la connexion
const connectionConfig = {
  uri: process.env.DATABASE_URL,
};

// Création du pool de connexion
const poolConnection = mysql.createPool(process.env.DATABASE_URL || '');

// Export de l'instance Drizzle
export const db = drizzle(poolConnection, { schema, mode: "default" });
