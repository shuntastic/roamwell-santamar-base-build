#!/usr/bin/env bash
#
# Deploy Santamar to AWS Free Tier (single EC2 t3.micro + Elastic IP + Nginx + PM2).
#
# Prerequisites and walkthrough: docs/DEPLOY-AWS.md
#
# Usage (from repo root):
#   cp deploy/aws/aws.env.example deploy/aws/aws.env
#   # edit deploy/aws/aws.env
#   ./deploy/aws/deploy.sh
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
AWS_DIR="${ROOT_DIR}/deploy/aws"
ENV_FILE="${AWS_DIR}/aws.env"
STATE_FILE="${AWS_DIR}/.deploy-state"

log() { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\n\033[1;33mWARN:\033[0m %s\n' "$*" >&2; }
die() { printf '\n\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1 (see docs/DEPLOY-AWS.md)"
}

[[ -f "$ENV_FILE" ]] || die "Missing ${ENV_FILE}. Copy aws.env.example → aws.env and fill values."

# shellcheck disable=SC1090
source "$ENV_FILE"

: "${AWS_REGION:?}"
: "${AWS_PROFILE:?}"
: "${PROJECT_NAME:?}"
: "${INSTANCE_TYPE:?}"
: "${KEY_NAME:?}"
: "${SSH_KEY_PATH:?}"
: "${SSH_CIDR:?}"
: "${REMOTE_USER:?}"
: "${REMOTE_APP_DIR:?}"
: "${DB_MODE:?}"

export AWS_PROFILE AWS_REGION
AWS=(aws --profile "$AWS_PROFILE" --region "$AWS_REGION")

need_cmd aws
need_cmd jq
need_cmd ssh
need_cmd rsync
need_cmd openssl

log "Checking AWS credentials (profile=${AWS_PROFILE}, region=${AWS_REGION})"
ACCOUNT_ID="$("${AWS[@]}" sts get-caller-identity --query Account --output text)" \
  || die "AWS CLI cannot authenticate. Run: aws configure --profile ${AWS_PROFILE}"
log "Authenticated as account ${ACCOUNT_ID}"

save_state() {
  local key="$1" value="$2"
  touch "$STATE_FILE"
  if grep -q "^${key}=" "$STATE_FILE" 2>/dev/null; then
    # portable in-place replace
    local tmp
    tmp="$(mktemp)"
    grep -v "^${key}=" "$STATE_FILE" >"$tmp" || true
    echo "${key}=${value}" >>"$tmp"
    mv "$tmp" "$STATE_FILE"
  else
    echo "${key}=${value}" >>"$STATE_FILE"
  fi
}

load_state() {
  local key="$1"
  [[ -f "$STATE_FILE" ]] || return 0
  grep "^${key}=" "$STATE_FILE" 2>/dev/null | tail -n1 | cut -d= -f2- || true
}

# --- Resolve Ubuntu 22.04 AMI ---
if [[ -z "${AMI_ID:-}" ]]; then
  log "Resolving latest Ubuntu 22.04 AMI via SSM"
  AMI_ID="$("${AWS[@]}" ssm get-parameters \
    --names /aws/service/canonical/ubuntu/server/22.04/stable/current/amd64/hvm/ebs-gp2/ami-id \
    --query 'Parameters[0].Value' --output text)"
fi
[[ "$AMI_ID" != "None" && -n "$AMI_ID" ]] || die "Could not resolve AMI_ID for ${AWS_REGION}"
log "Using AMI ${AMI_ID}"

# --- Key pair ---
if ! "${AWS[@]}" ec2 describe-key-pairs --key-names "$KEY_NAME" >/dev/null 2>&1; then
  log "Creating EC2 key pair ${KEY_NAME}"
  mkdir -p "$(dirname "$SSH_KEY_PATH")"
  "${AWS[@]}" ec2 create-key-pair \
    --key-name "$KEY_NAME" \
    --query 'KeyMaterial' \
    --output text >"$SSH_KEY_PATH"
  chmod 400 "$SSH_KEY_PATH"
  log "Private key written to ${SSH_KEY_PATH}"
else
  log "Key pair ${KEY_NAME} already exists"
  [[ -f "$SSH_KEY_PATH" ]] || die "Key pair exists in AWS but private key missing at ${SSH_KEY_PATH}"
fi

# --- VPC + public subnet (required for Elastic IP + SSH) ---
# Prefer aws.env overrides, then the account default VPC, then recreate a default VPC.
is_aws_none() { [[ -z "${1:-}" || "$1" == "None" || "$1" == "null" ]]; }

resolve_public_subnet() {
  local vpc="$1"
  local subnet=""
  subnet="$("${AWS[@]}" ec2 describe-subnets \
    --filters "Name=vpc-id,Values=${vpc}" "Name=map-public-ip-on-launch,Values=true" \
    --query 'Subnets | sort_by(@, &AvailabilityZone) | [0].SubnetId' --output text 2>/dev/null || true)"
  if is_aws_none "$subnet"; then
    # Subnets that inherit the main route table with an Internet Gateway
    local main_has_igw
    main_has_igw="$("${AWS[@]}" ec2 describe-route-tables \
      --filters "Name=vpc-id,Values=${vpc}" "Name=association.main,Values=true" \
      --query "RouteTables[0].Routes[?DestinationCidrBlock=='0.0.0.0/0' && starts_with(GatewayId, 'igw-')].GatewayId | [0]" \
      --output text 2>/dev/null || true)"
    if [[ "$main_has_igw" == igw-* ]]; then
      subnet="$("${AWS[@]}" ec2 describe-subnets \
        --filters "Name=vpc-id,Values=${vpc}" \
        --query 'Subnets | sort_by(@, &AvailabilityZone) | [0].SubnetId' --output text 2>/dev/null || true)"
    fi
  fi
  is_aws_none "$subnet" && return 1
  printf '%s' "$subnet"
}

VPC_ID="${VPC_ID:-$(load_state VPC_ID)}"
SUBNET_ID="${SUBNET_ID:-$(load_state SUBNET_ID)}"

if is_aws_none "$VPC_ID"; then
  VPC_ID="$("${AWS[@]}" ec2 describe-vpcs \
    --filters Name=isDefault,Values=true \
    --query 'Vpcs[0].VpcId' --output text 2>/dev/null || true)"
fi

if is_aws_none "$VPC_ID"; then
  log "No default VPC in ${AWS_REGION}; creating one (required for Free Tier EC2 + public Elastic IP)"
  VPC_ID="$("${AWS[@]}" ec2 create-default-vpc --query 'Vpc.VpcId' --output text)" \
    || die "Could not create a default VPC. Set VPC_ID (and optionally SUBNET_ID) in deploy/aws/aws.env to an existing public VPC."
  sleep 2
fi

is_aws_none "$VPC_ID" && die "VPC_ID resolved to empty/None. Set VPC_ID in deploy/aws/aws.env."
save_state VPC_ID "$VPC_ID"
log "Using VPC ${VPC_ID}"

if is_aws_none "$SUBNET_ID"; then
  if ! SUBNET_ID="$(resolve_public_subnet "$VPC_ID")"; then
    die "No public subnet found in ${VPC_ID}. Set SUBNET_ID in deploy/aws/aws.env to a subnet with MapPublicIpOnLaunch or an Internet Gateway route."
  fi
fi
save_state SUBNET_ID "$SUBNET_ID"
log "Using subnet ${SUBNET_ID}"

# --- Security group ---
SG_NAME="${PROJECT_NAME}-sg"
SG_ID="$(load_state SG_ID)"
if [[ -z "$SG_ID" ]]; then
  SG_ID="$("${AWS[@]}" ec2 describe-security-groups \
    --filters "Name=group-name,Values=${SG_NAME}" "Name=vpc-id,Values=${VPC_ID}" \
    --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || true)"
  is_aws_none "$SG_ID" && SG_ID=""
fi

if [[ -z "$SG_ID" ]]; then
  log "Creating security group ${SG_NAME}"
  SG_ID="$("${AWS[@]}" ec2 create-security-group \
    --group-name "$SG_NAME" \
    --description "Santamar Free Tier web + SSH" \
    --vpc-id "$VPC_ID" \
    --query GroupId --output text)"
  "${AWS[@]}" ec2 authorize-security-group-ingress --group-id "$SG_ID" \
    --ip-permissions \
    "IpProtocol=tcp,FromPort=22,ToPort=22,IpRanges=[{CidrIp=${SSH_CIDR},Description=SSH}]" \
    "IpProtocol=tcp,FromPort=80,ToPort=80,IpRanges=[{CidrIp=0.0.0.0/0,Description=HTTP}]" \
    "IpProtocol=tcp,FromPort=443,ToPort=443,IpRanges=[{CidrIp=0.0.0.0/0,Description=HTTPS}]" \
    >/dev/null
fi
save_state SG_ID "$SG_ID"
log "Security group ${SG_ID}"

# --- Launch or reuse instance ---
INSTANCE_ID="$(load_state INSTANCE_ID)"
if [[ -n "$INSTANCE_ID" ]]; then
  STATE="$("${AWS[@]}" ec2 describe-instances --instance-ids "$INSTANCE_ID" \
    --query 'Reservations[0].Instances[0].State.Name' --output text 2>/dev/null || echo terminated)"
  if [[ "$STATE" == "terminated" || "$STATE" == "None" || -z "$STATE" ]]; then
    warn "Saved instance ${INSTANCE_ID} is ${STATE}; launching a new one"
    INSTANCE_ID=""
  else
    log "Reusing instance ${INSTANCE_ID} (state=${STATE})"
  fi
fi

if [[ -z "$INSTANCE_ID" ]]; then
  log "Launching ${INSTANCE_TYPE} (Free Tier class) in ${SUBNET_ID}"
  INSTANCE_ID="$("${AWS[@]}" ec2 run-instances \
    --image-id "$AMI_ID" \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_NAME" \
    --network-interfaces "DeviceIndex=0,SubnetId=${SUBNET_ID},Groups=${SG_ID},AssociatePublicIpAddress=true" \
    --count 1 \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${PROJECT_NAME}},{Key=Project,Value=santamar}]" \
    --query 'Instances[0].InstanceId' --output text)"
  save_state INSTANCE_ID "$INSTANCE_ID"
fi

log "Waiting for instance ${INSTANCE_ID} to be running + status OK"
"${AWS[@]}" ec2 wait instance-running --instance-ids "$INSTANCE_ID"
"${AWS[@]}" ec2 wait instance-status-ok --instance-ids "$INSTANCE_ID" || warn "instance-status-ok wait timed out; continuing"

# --- Elastic IP (free while associated with a running instance) ---
ALLOC_ID="$(load_state ALLOC_ID)"
PUBLIC_IP="$(load_state PUBLIC_IP)"
if [[ -z "$ALLOC_ID" || -z "$PUBLIC_IP" ]]; then
  log "Allocating Elastic IP"
  ALLOC_JSON="$("${AWS[@]}" ec2 allocate-address --domain vpc)"
  ALLOC_ID="$(echo "$ALLOC_JSON" | jq -r .AllocationId)"
  PUBLIC_IP="$(echo "$ALLOC_JSON" | jq -r .PublicIp)"
  save_state ALLOC_ID "$ALLOC_ID"
  save_state PUBLIC_IP "$PUBLIC_IP"
fi

ASSOC="$("${AWS[@]}" ec2 describe-addresses --allocation-ids "$ALLOC_ID" \
  --query 'Addresses[0].InstanceId' --output text 2>/dev/null || true)"
if [[ "$ASSOC" != "$INSTANCE_ID" ]]; then
  log "Associating Elastic IP ${PUBLIC_IP} with ${INSTANCE_ID}"
  "${AWS[@]}" ec2 associate-address --instance-id "$INSTANCE_ID" --allocation-id "$ALLOC_ID" >/dev/null
fi

log "Public IP: ${PUBLIC_IP}"

# Resolve public Strapi URL for Next build
if [[ -z "${NEXT_PUBLIC_STRAPI_URL:-}" ]]; then
  if [[ -n "${CMS_DOMAIN:-}" ]]; then
    NEXT_PUBLIC_STRAPI_URL="https://${CMS_DOMAIN}"
  else
    # Same-origin path routing via Nginx (/api /admin /uploads)
    NEXT_PUBLIC_STRAPI_URL="http://${PUBLIC_IP}"
  fi
fi

# Ephemeral lab hosts often reuse an Elastic IP on a new instance; OpenSSH
# "accept-new" refuses when the host key changed. Keep a deploy-local known_hosts
# and refresh the entry whenever the instance behind the IP changes.
KNOWN_HOSTS_FILE="${AWS_DIR}/.known_hosts"
PREV_SSH_INSTANCE_ID="$(load_state SSH_INSTANCE_ID)"
if [[ "$PREV_SSH_INSTANCE_ID" != "$INSTANCE_ID" ]]; then
  log "Refreshing SSH host key for ${PUBLIC_IP} (instance changed: ${PREV_SSH_INSTANCE_ID:-none} → ${INSTANCE_ID})"
  ssh-keygen -R "$PUBLIC_IP" -f "$KNOWN_HOSTS_FILE" >/dev/null 2>&1 || true
  ssh-keygen -R "$PUBLIC_IP" >/dev/null 2>&1 || true
  touch "$KNOWN_HOSTS_FILE"
fi

SSH_OPTS=(
  -i "$SSH_KEY_PATH"
  -o StrictHostKeyChecking=accept-new
  -o UserKnownHostsFile="$KNOWN_HOSTS_FILE"
  -o GlobalKnownHostsFile=/dev/null
  -o ConnectTimeout=10
  -o BatchMode=yes
)
SSH_HOST="${REMOTE_USER}@${PUBLIC_IP}"
RSYNC_SSH="ssh -i ${SSH_KEY_PATH} -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=${KNOWN_HOSTS_FILE} -o GlobalKnownHostsFile=/dev/null"

log "Waiting for SSH on ${SSH_HOST}"
SSH_LAST_ERR=""
for i in {1..36}; do
  if SSH_LAST_ERR="$(ssh "${SSH_OPTS[@]}" "$SSH_HOST" 'echo ok' 2>&1)"; then
    save_state SSH_INSTANCE_ID "$INSTANCE_ID"
    break
  fi
  sleep 5
  if [[ $i -eq 36 ]]; then
    die "SSH never became available for ${SSH_HOST}.
Last error: ${SSH_LAST_ERR}
Check: security group SSH_CIDR, key at ${SSH_KEY_PATH}, and that port 22 is reachable.
If you replaced the instance behind this Elastic IP, remove stale host keys:
  ssh-keygen -R ${PUBLIC_IP}
  ssh-keygen -R ${PUBLIC_IP} -f ${KNOWN_HOSTS_FILE}"
  fi
done

# Ensure remote app dir
ssh "${SSH_OPTS[@]}" "$SSH_HOST" "mkdir -p '${REMOTE_APP_DIR}'"

log "Syncing repository to ${SSH_HOST}:${REMOTE_APP_DIR}"
[[ -f "${ROOT_DIR}/gsap-bonus.tgz" ]] || die "Missing gsap-bonus.tgz at repo root (required by frontend)"

rsync -az --delete \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  --exclude 'frontend/node_modules/' \
  --exclude 'cms/node_modules/' \
  --exclude '.next/' \
  --exclude 'frontend/.next/' \
  --exclude 'cms/dist/' \
  --exclude 'cms/.tmp/' \
  --exclude 'cms/public/uploads/' \
  --exclude 'cms/.strapi/' \
  --exclude '**/storybook-static/' \
  --exclude 'deploy/aws/aws.env' \
  --exclude 'deploy/aws/.deploy-state' \
  --exclude 'deploy/aws/.known_hosts' \
  --exclude 'cms/.env' \
  --exclude 'cms/.env.production' \
  --exclude 'frontend/.env.local' \
  --exclude 'frontend/.env.production' \
  -e "$RSYNC_SSH" \
  "${ROOT_DIR}/" "${SSH_HOST}:${REMOTE_APP_DIR}/"

log "Running remote bootstrap"
ssh "${SSH_OPTS[@]}" "$SSH_HOST" \
  env \
    REMOTE_APP_DIR="$REMOTE_APP_DIR" \
    DB_MODE="$DB_MODE" \
    SEED_CONTENT="${SEED_CONTENT:-true}" \
    SITE_DOMAIN="${SITE_DOMAIN:-}" \
    CMS_DOMAIN="${CMS_DOMAIN:-}" \
    LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}" \
    PUBLIC_IP="$PUBLIC_IP" \
    NEXT_PUBLIC_STRAPI_URL="$NEXT_PUBLIC_STRAPI_URL" \
    bash -s <"${AWS_DIR}/bootstrap-remote.sh"

# Optional: rewrite nginx for dedicated CMS domain mode
if [[ -n "${SITE_DOMAIN:-}" && -n "${CMS_DOMAIN:-}" ]]; then
  log "Domains configured — ensure DNS A records:"
  echo "  ${SITE_DOMAIN}  → ${PUBLIC_IP}"
  echo "  ${CMS_DOMAIN}   → ${PUBLIC_IP}"
  echo "Then SSH in and adjust Nginx server_name / run certbot if certificates were skipped."
fi

cat <<EOF

────────────────────────────────────────────────────────────
Deploy finished (AWS Free Tier single-EC2 topology)

  Account:     ${ACCOUNT_ID}
  Region:      ${AWS_REGION}
  Instance:    ${INSTANCE_ID} (${INSTANCE_TYPE})
  Elastic IP:  ${PUBLIC_IP}
  Strapi URL:  ${NEXT_PUBLIC_STRAPI_URL}
  Site:        http://${PUBLIC_IP}/en
  Admin:       http://${PUBLIC_IP}/admin

State file: ${STATE_FILE}
SSH:        ssh -i ${SSH_KEY_PATH} ${SSH_HOST}

Next steps:
  1. Open Admin, create the first Strapi admin user
  2. Set Global Instagram URL / content as needed
  3. Tighten SSH_CIDR in aws.env to your IP and update the security group
  4. (Optional) Point DNS + enable HTTPS — see docs/DEPLOY-AWS.md
────────────────────────────────────────────────────────────
EOF
