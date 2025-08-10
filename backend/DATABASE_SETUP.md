# PlanetScale Database Setup

This guide walks through setting up a PlanetScale MySQL database for the Atlas Agent backend.

## 🚀 Quick Setup

### 1. Create PlanetScale Account

1. Visit [PlanetScale](https://planetscale.com) and sign up
2. Create a new database named `atlas-agent`
3. Choose your preferred region

### 2. Get Connection String

1. Go to your database dashboard
2. Click **"Connect"**
3. Select **"Prisma"** from the framework dropdown
4. Copy the connection string (format: `mysql://username:password@aws.connect.psdb.cloud/atlas-agent?sslaccept=strict`)

### 3. Configure Environment

```bash
# Update .env file
DATABASE_URL="mysql://username:password@aws.connect.psdb.cloud/atlas-agent?sslaccept=strict"
```

### 4. Set Up Database Schema

```bash
# Generate Prisma client
npm run db:generate

# Push schema to PlanetScale (creates tables)
npm run db:push

# Seed with initial questions
npm run db:seed
```

### 5. Verify Setup

```bash
# Open Prisma Studio to view data
npm run db:studio

# Or check the data via API
curl http://127.0.0.1:3002/api/questions/stats
```

## 🛠️ Development Workflow

### Local Development (MySQL)
For local development without PlanetScale:

```bash
# Install MySQL locally
sudo apt install mysql-server  # Ubuntu/Debian
# or
brew install mysql            # macOS

# Create local database
mysql -u root -p
CREATE DATABASE atlas_agent_dev;
exit

# Update .env for local development
DATABASE_URL="mysql://root:password@localhost:3306/atlas_agent_dev"

# Run migrations and seed
npm run db:push
npm run db:seed
```

### Schema Changes
```bash
# After modifying prisma/schema.prisma:
npm run db:push        # Push changes to database
npm run db:generate    # Regenerate Prisma client
```

## 🔧 Available Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema changes |
| `npm run db:seed` | Populate with sample data |
| `npm run db:studio` | Open database browser |

## 📊 Database Schema

### Tables Created:
- **game_sessions** - Active game sessions
- **questions** - Geography questions bank
- **answers** - Player answer history  
- **leaderboard** - High scores and rankings

### Sample Data:
- 11 geography questions across 4 regions
- 1 demo game session
- 1 sample leaderboard entry

## 🚨 Production Notes

- **PlanetScale Branching**: Use branches for schema changes in production
- **Connection Pooling**: PlanetScale handles connection pooling automatically
- **Scaling**: Database will auto-scale with your application
- **Backups**: Automatic daily backups included

## 📱 Alternative: Local MySQL

If you prefer local development:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation

# Start MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Create database
sudo mysql -u root -p
CREATE DATABASE atlas_agent_dev;
CREATE USER 'atlas_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON atlas_agent_dev.* TO 'atlas_user'@'localhost';
FLUSH PRIVILEGES;
exit

# Update .env
DATABASE_URL="mysql://atlas_user:secure_password@localhost:3306/atlas_agent_dev"
```

---

**Ready to connect your Atlas Agent backend to a professional database!** 🚀