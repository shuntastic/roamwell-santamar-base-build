module.exports = {
  apps: [
    {
      name: 'santamar-cms',
      cwd: '/var/www/santamar/cms',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 1337,
        DATABASE_CLIENT: 'mysql',
        DATABASE_HOST: '127.0.0.1',
        DATABASE_PORT: 3306,
        DATABASE_NAME: 'santamar_cms',
        DATABASE_USERNAME: 'santamar',
        DATABASE_PASSWORD: 'change-me',
        FRONTEND_URL: 'https://santamar.example',
      },
    },
  ],
};
