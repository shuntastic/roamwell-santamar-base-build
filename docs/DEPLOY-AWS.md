# Deploy Santamar on AWS (Free Tier–oriented)

This guide deploys the **Next.js + Strapi** monorepo to a **single Amazon EC2 Free Tier instance** using the scripts in [`deploy/aws/`](../deploy/aws/).

> Santamar is not a PHP app. The Free Tier pattern mirrors the LAMP guide architecturally (reverse proxy + Node + DB), but uses **Nginx + PM2 on EC2** instead of Apache on a generic VPS.

## Architecture (maximize Free Tier)

```
You (laptop)
   │  aws cli + rsync + ssh
   ▼
EC2 t3.micro (Ubuntu 22.04)     ← Free Tier: 750 hrs/mo for 12 months*
   ├─ Nginx :80/:443
   │    ├─ /           → Next.js :3000
   │    └─ /admin|/api|/uploads → Strapi :1337
   ├─ PM2: santamar-web + santamar-cms
   └─ SQLite (default) or on-box MariaDB
Elastic IP                       ← free while attached to a running instance
```

\*Free Tier eligibility depends on account age, region, and AWS promotions. Always check [AWS Free Tier](https://aws.amazon.com/free/).

| Service | Why this choice |
| --- | --- |
| **EC2 `t3.micro` / `t2.micro`** | Both Node apps need a long-lived process; one small instance is the cheapest Free Tier fit |
| **Elastic IP** | Stable address for DNS / bookmarks without paying while associated |
| **SQLite on instance (default)** | Avoids RDS RAM/cost; fits `t3.micro` (1 GiB) better than MySQL+Node together |
| **Nginx + Certbot** | Free TLS; path-based routing so one IP serves site + CMS without a second host |
| **Skipped by default** | RDS, Amplify, ECS, ALB, CloudFront, Route 53 (hosted zones are not free) |

Optional later: move DB to **RDS `db.t3.micro`** (separate Free Tier bucket) if you outgrow SQLite — not required for the scripted path.

---

## Prerequisites (local machine)

### 1. Tools to install

| Tool | macOS | Ubuntu/Debian | Notes |
| --- | --- | --- | --- |
| **AWS CLI v2** | `brew install awscli` | [Install guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) | Required |
| **jq** | `brew install jq` | `sudo apt install jq` | JSON parsing |
| **rsync** | built-in | `sudo apt install rsync` | Code sync |
| **OpenSSH client** | built-in | built-in | Remote bootstrap |
| **openssl** | built-in | built-in | Secret generation on server |

Verify:

```bash
aws --version
jq --version
rsync --version
ssh -V
```

### 2. AWS account access

1. Create / sign in to an [AWS account](https://aws.amazon.com/).
2. Prefer an **IAM user** with programmatic access (not root) and attach a policy that can manage EC2, Elastic IPs, and read SSM public parameters (or AdministratorAccess for a personal lab).
3. Configure credentials locally:

```bash
aws configure --profile default
# AWS Access Key ID
# AWS Secret Access Key
# Default region: us-east-1   # (common Free Tier region)
# Default output: json
```

Required credential material:

| Item | Where it lives |
| --- | --- |
| **Access Key ID** | IAM → Users → Security credentials |
| **Secret Access Key** | Shown once at key creation — store in password manager |
| **Region** | e.g. `us-east-1` |
| **SSH key** | Created by the script into `SSH_KEY_PATH` (or reuse an existing EC2 key pair) |

Test:

```bash
aws sts get-caller-identity --profile default
```

### 3. Repository requirements

- Run commands from the **monorepo root**.
- Root file **`gsap-bonus.tgz`** must exist (frontend depends on `file:../gsap-bonus.tgz`).
- Do **not** commit `deploy/aws/aws.env` or `deploy/aws/.deploy-state` (gitignored).

---

## Configure the deploy

```bash
cp deploy/aws/aws.env.example deploy/aws/aws.env
```

Edit `deploy/aws/aws.env`:

| Variable | Guidance |
| --- | --- |
| `AWS_REGION` | Free Tier–friendly region (`us-east-1` recommended) |
| `AWS_PROFILE` | Profile from `aws configure` |
| `INSTANCE_TYPE` | `t3.micro` or `t2.micro` |
| `KEY_NAME` / `SSH_KEY_PATH` | Script creates the key pair if missing |
| `SSH_CIDR` | **Your public IP `/32`** for production; `0.0.0.0/0` only for short labs |
| `DB_MODE` | `sqlite` (default) or `mysql` (MariaDB on the same box) |
| `SITE_DOMAIN` / `CMS_DOMAIN` | Optional; leave blank to use `http://ELASTIC_IP` |
| `LETSENCRYPT_EMAIL` | Required only when requesting certs for domains |
| `SEED_CONTENT` | `true` on first deploy |

---

## Run the deploy

```bash
chmod +x deploy/aws/deploy.sh deploy/aws/bootstrap-remote.sh
./deploy/aws/deploy.sh
```

What the script does:

1. Authenticates with AWS  
2. Resolves Ubuntu 22.04 AMI  
3. Ensures EC2 key pair + security group (22/80/443)  
4. Launches or reuses a Free Tier–class instance  
5. Allocates/associates an Elastic IP  
6. `rsync`s the repo (excludes `node_modules`, secrets, build artifacts)  
7. SSHs in and runs `bootstrap-remote.sh` (Node 20, Nginx, build, PM2)

First run often takes **15–30+ minutes** on `t3.micro` (npm install + two production builds).

Idempotence: instance / SG / EIP IDs are stored in `deploy/aws/.deploy-state`. Re-running syncs code and re-bootstraps without necessarily creating a new instance.

---

## After deploy

The script prints URLs similar to:

| URL | Purpose |
| --- | --- |
| `http://ELASTIC_IP/en` | Public site |
| `http://ELASTIC_IP/admin` | Strapi Admin — create the first admin user |

Then:

1. Create the Strapi admin account in the browser.  
2. Confirm Content API pages load (site should show CMS content, not only fallbacks).  
3. Set **Global → Instagram URL** and other content.  
4. Restrict `SSH_CIDR` and update the security group ingress for port 22.  
5. If using MariaDB (`DB_MODE=mysql`), change the default DB password immediately.

### Optional HTTPS + custom domains

1. Create DNS **A** records for your site (and optional CMS host) → Elastic IP.  
2. Set `SITE_DOMAIN`, `CMS_DOMAIN`, `LETSENCRYPT_EMAIL` in `aws.env`.  
3. Re-run `./deploy/aws/deploy.sh` or SSH in and run certbot manually:

```bash
ssh -i ~/.ssh/santamar-aws.pem ubuntu@ELASTIC_IP
sudo certbot --nginx -d your.site -d cms.your.site
```

For a dedicated CMS subdomain, extend Nginx so the CMS host proxies entirely to `:1337` (path-based routing on the Elastic IP remains the Free Tier default).

---

## Operations cheatsheet

```bash
# SSH
ssh -i ~/.ssh/santamar-aws.pem ubuntu@ELASTIC_IP

# App status / logs
pm2 status
pm2 logs santamar-cms
pm2 logs santamar-web

# Redeploy code only (from laptop)
./deploy/aws/deploy.sh
```

### Tear down (stop billing)

```bash
# From laptop — example using IDs in deploy/aws/.deploy-state
source deploy/aws/.deploy-state
aws ec2 terminate-instances --instance-ids "$INSTANCE_ID" --region us-east-1
aws ec2 release-address --allocation-id "$ALLOC_ID" --region us-east-1
# Optional: delete security group after instance is terminated
```

**Important:** An Elastic IP that is **allocated but not associated** incurs a charge. Release it when finished. Stopped instances can still incur EBS storage charges.

---

## Design notes / limits

- **`t3.micro` (1 GiB RAM)** is tight for two Node builds. The bootstrap builds sequentially; if `npm ci` / `next build` is OOM-killed, temporarily resize to `t3.small`, build, then resize back — or build artifacts CI-side later.
- **Same-origin Strapi URL** (`http://EIP`) avoids CORS issues in the Free Tier lab layout (`/api`, `/admin`, `/uploads` via Nginx).
- **Do not** use S3 static website hosting for the Next app as-is (middleware + ISR need `next start`).
- Amplify Hosting Free Tier can host Next separately, but you would still need a always-on host for Strapi — a **single EC2** usually wins on Free Tier simplicity and cost predictability.

---

## Related

- LAMP / generic VPS: [`docs/DEPLOY-LAMP.md`](DEPLOY-LAMP.md)  
- Scripts: [`deploy/aws/deploy.sh`](../deploy/aws/deploy.sh), [`deploy/aws/bootstrap-remote.sh`](../deploy/aws/bootstrap-remote.sh)  
- Config template: [`deploy/aws/aws.env.example`](../deploy/aws/aws.env.example)
