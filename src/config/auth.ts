import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { bearer, jwt } from 'better-auth/plugins';
import { getDB } from './db.js';

export function getAuth() {
  const db = getDB();

  return betterAuth({
    database: mongodbAdapter(db),
    secret: process.env.BETTER_AUTH_SECRET || 'fallback_secret_must_be_32_characters_long',
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5000',
    trustedOrigins: [
      process.env.CLIENT_ORIGIN || 'http://localhost:3000',
      'http://localhost:3000',
    ],
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      },
    },
    plugins: [
      bearer(),
      jwt(),
    ],
  });
}

// Singleton reference initialized after DB connection
export let auth: ReturnType<typeof getAuth>;

export function initAuth() {
  auth = getAuth();
  return auth;
}