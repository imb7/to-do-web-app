module.exports = {
  apps: [
    {
      name: 'todo-backend',
      script: 'src/server.js',
      cwd: '/var/www/todo-app/backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_file: '/etc/todo-app/todo-app.env',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/log/todo-app/backend-error.log',
      out_file: '/var/log/todo-app/backend-out.log',
      merge_logs: true,
      time: true
    }
  ]
};
