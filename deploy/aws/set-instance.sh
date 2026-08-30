AWS_PROFILE=default
AWS_REGION=us-east-1
INSTANCE_ID=i-0dd452d161931343e
NEW_TYPE=t3.small
# EC2 Free Tier: t2.micro or t3.micro (750 hrs/mo for 12 months on eligible accounts)
# for deploying new content: t3.small


aws ec2 stop-instances --profile "$AWS_PROFILE" --region "$AWS_REGION" \
  --instance-ids "$INSTANCE_ID"
aws ec2 wait instance-stopped --profile "$AWS_PROFILE" --region "$AWS_REGION" \
  --instance-ids "$INSTANCE_ID"
aws ec2 modify-instance-attribute --profile "$AWS_PROFILE" --region "$AWS_REGION" \
  --instance-id "$INSTANCE_ID" \
  --instance-type "{\"Value\": \"$NEW_TYPE\"}"
aws ec2 start-instances --profile "$AWS_PROFILE" --region "$AWS_REGION" \
  --instance-ids "$INSTANCE_ID"
aws ec2 wait instance-running --profile "$AWS_PROFILE" --region "$AWS_REGION" \
  --instance-ids "$INSTANCE_ID"
aws ec2 describe-instances --profile "$AWS_PROFILE" --region "$AWS_REGION" \
  --instance-ids "$INSTANCE_ID" \
  --query 'Reservations[0].Instances[0].{Type:InstanceType,State:State.Name,PublicIp:PublicIpAddress}' \
  --output table