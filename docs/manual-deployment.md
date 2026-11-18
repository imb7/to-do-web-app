# Manual Deployment Guide: Standalone Ubuntu 24.04 EC2 Instance

This guide provides step-by-step instructions for manually deploying the **To-Do Application** on a standard Ubuntu Server 24.04 LTS EC2 virtual machine without using Packer or pre-baked AMIs.

---

## 1. System Requirements

- **Base Operating System:** Ubuntu Server 24.04 LTS (x86_64)
- **Minimum Instance Size:** AWS EC2 `t3.small` (2 vCPU, 2 GB RAM recommended for compiling frontend assets)
- **Storage:** 15–20 GB gp3 root volume
- **Inbound Security Group Rules:**
  - `SSH` (port 22) from your IP
  - `HTTP` (port 80) from `0.0.0.0/0`
  - `HTTPS` (port 443) from `0.0.0.0/0`

---

## 2. Step-by-Step Installation Walkthrough

### Step 1: Connect to Your EC2 Instance
```bash
ssh -i /path/to/your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

---

### Step 2: System Packages & Firewall Setup
Update the system repositories and install essential build utilities:

```bash
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y curl wget git unzip software-properties-common ca-certificates gnupg ufw

# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw --force enable
```

---

### Step 3: Install Node.js 22 LTS, PM2, Nginx, and MySQL 8
```bash
# 1. Install Node.js 22 LTS (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt-get install -y nodejs

# 2. Install PM2 process manager globally
sudo npm install -g pm2

# 3. Install Nginx web server
sudo apt-get install -y nginx

# 4. Install MySQL 8 Server
sudo apt-get install -y mysql-server

# 5. Restrict MySQL to localhost only (security hardening)
sudo bash -c 'cat <<EOF > /etc/mysql/mysql.conf.d/mysqld_local.cnf
[mysqld]
bind-address = 127.0.0.1
mysqlx-bind-address = 127.0.0.1
default_time_zone = "+00:00"
EOF'

sudo systemctl restart mysql
sudo systemctl enable mysql
```

---

### Step 4: Transfer / Clone Application Code
Create the target deployment directory:
```bash
sudo mkdir -p /var/www/todo-app
sudo chown -R ubuntu:ubuntu /var/www/todo-app
```

Upload your code from your local machine via SCP or clone via Git:
```bash
# If using git:
git clone <your-repo-url> /tmp/repo
cp -r /tmp/repo/todo-app/* /var/www/todo-app/
rm -rf /tmp/repo
```

---

### Step 5: Install Dependencies and Build Frontend
```bash
# 1. Install backend production dependencies
cd /var/www/todo-app/backend
npm ci --only=production

# 2. Install frontend dependencies and build production assets
cd /var/www/todo-app/frontend
npm ci
npm run build
```

---

### Step 6: Configure MySQL Database & User
Generate a high-entropy password and create the application database and user:
```bash
DB_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)

sudo mysql <<EOSQL
CREATE DATABASE IF NOT EXISTS todo_application CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'todo_user'@'localhost' IDENTIFIED BY '${DB_PASS}';
ALTER USER 'todo_user'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON todo_application.* TO 'todo_user'@'localhost';
FLUSH PRIVILEGES;
EOSQL

echo "Generated DB Password: ${DB_PASS}"
```

---

### Step 7: Create Production Environment File & Run Migrations
Generate a secure JWT secret and create `/etc/todo-app/todo-app.env`:
```bash
sudo mkdir -p /etc/todo-app
JWT_SECRET=$(openssl rand -hex 32)

sudo bash -c "cat <<EOF > /etc/todo-app/todo-app.env
PORT=5000
NODE_ENV=production
CORS_ORIGIN=*
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=todo_application
DB_USER=todo_user
DB_PASSWORD=${DB_PASS}
DB_CONNECTION_LIMIT=10
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h
COOKIE_SECURE=false
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=15
EOF"

sudo chmod 600 /etc/todo-app/todo-app.env
```

Execute the database migration runner to create tables and indexes:
```bash
cd /var/www/todo-app/backend
sudo env $(cat /etc/todo-app/todo-app.env | xargs) node database/init-db.js
```

---

### Step 8: Configure Nginx Reverse Proxy
```bash
# Remove default Nginx placeholder
sudo rm -f /etc/nginx/sites-enabled/default

# Link application virtual host configuration
sudo cp /var/www/todo-app/config/nginx/todo-app.conf /etc/nginx/sites-available/todo-app.conf
sudo ln -sf /etc/nginx/sites-available/todo-app.conf /etc/nginx/sites-enabled/todo-app.conf

# Test syntax and reload
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

### Step 9: Start Application with PM2
```bash
# Secure file ownership
sudo chown -R www-data:www-data /var/www/todo-app /etc/todo-app
sudo chmod -R 755 /var/www/todo-app

# Start Node.js backend using PM2
sudo pm2 start /var/www/todo-app/config/pm2/ecosystem.config.js --env production
sudo pm2 save
sudo pm2 startup systemd -u root --hp /root
```

---

### Step 10: Verify Deployment
Test the API health check endpoint:
```bash
curl -i http://localhost/api/health
```

Expected response:
```json
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "status": "UP",
  "timestamp": "2026-11-17T07:30:00.000Z",
  "uptime": 12.5
}
```

Now open your browser and navigate to:
```
http://<EC2_PUBLIC_IP>/
```

---

## 3. Managing Services & Ongoing Maintenance

### PM2 Process Commands
```bash
sudo pm2 status                 # Check backend process status
sudo pm2 logs todo-backend      # View live application logs
sudo pm2 restart todo-backend   # Restart backend
sudo pm2 reload todo-backend    # Zero-downtime reload
```

### Nginx Commands
```bash
sudo nginx -t                   # Verify configuration syntax
sudo systemctl reload nginx     # Reload configuration without dropping connections
sudo systemctl restart nginx    # Restart web server
```

### Let's Encrypt Free SSL (HTTPS) Setup
To attach a custom domain with automated SSL:
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com --non-interactive --agree-tos --email admin@your-domain.com
```
