const app = require('./app');
const { pool, testConnection } = require('./config/db');

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  try {
    console.log('[Server] Verifying database connectivity...');
    await testConnection();
    console.log('[Server] Database connection verified successfully.');

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] To-Do Application API server running on port ${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`[Server] Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        console.log('[Server] HTTP server closed.');
        try {
          await pool.end();
          console.log('[Server] Database pool connections closed.');
          process.exit(0);
        } catch (err) {
          console.error('[Server] Error closing database pool:', err);
          process.exit(1);
        }
      });

      // Force shutdown if taking longer than 10s
      setTimeout(() => {
        console.error('[Server] Forced shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[Server] Fatal error during startup:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
