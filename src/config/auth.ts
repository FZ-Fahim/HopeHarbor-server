import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { bearer, jwt } from 'better-auth/plugins';
import { client } from './db.js';

const dbName = process.env.DB_NAME || 'hopeharbor';

// Initialize Better Auth with the native Mongo client database
export const auth = betterAuth({
  database: mongodbAdapter(client.db(dbName)),
  secret: process.env.BETTER_AUTH_SECRET || 'fallback_secret_must_be_32_characters_long',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5000',
  trustedOrigins: [
    process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    'http://localhost:3000',
    'https://*.vercel.app', // Permits any Vercel frontend domain
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
    jwt({
      jwt: {},
    }),
  ],
});