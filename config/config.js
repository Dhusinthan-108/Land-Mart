// Application configuration

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },

  // Database configuration
  database: {
    uri: process.env.DB_HOST || 'mongodb://localhost:27017/landmart',
    name: process.env.DB_NAME || 'landmart',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || ''
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'landmart-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  // Payment configuration
  payment: {
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY || '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || ''
  },

  // Email configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  },

  // Application settings
  app: {
    name: 'Land Mart',
    version: '1.0.0',
    description: 'A marketplace for buying and selling land properties'
  }
};