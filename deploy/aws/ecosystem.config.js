/**
 * PM2 apps for Santamar on AWS EC2 Free Tier.
 * Paths are rewritten by bootstrap-remote.sh to REMOTE_APP_DIR.
 */
module.exports = {
  apps: [
    {
      name: 'santamar-cms',
      cwd: '/home/ubuntu/santamar/cms',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'santamar-web',
      cwd: '/home/ubuntu/santamar/frontend',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        HOSTNAME: '127.0.0.1',
        PORT: 3000,
      },
    },
  ],
};
