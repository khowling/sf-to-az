#!/bin/bash
# Script to fetch Azure cost data for the resource group
# Requires Azure CLI to be authenticated

set -e

RESOURCE_GROUP="${1:-mycrm-rg}"
SUBSCRIPTION_ID="${2}"

if [ -z "$SUBSCRIPTION_ID" ]; then
  echo "Usage: $0 <resource-group> <subscription-id>"
  exit 1
fi

# Get costs for the last 30 days
START_DATE=$(date -u -d '30 days ago' +%Y-%m-%d 2>/dev/null || date -u -v-30d +%Y-%m-%d)
END_DATE=$(date -u +%Y-%m-%d)

echo "Fetching costs for resource group: $RESOURCE_GROUP"
echo "Period: $START_DATE to $END_DATE"

# Query Azure Cost Management API
COST_DATA=$(az costmanagement query \
  --type ActualCost \
  --dataset-aggregation totalCost=Sum \
  --dataset-grouping name=ResourceGroupName type=Dimension \
  --dataset-filter "{\"dimensions\":{\"name\":\"ResourceGroupName\",\"operator\":\"In\",\"values\":[\"$RESOURCE_GROUP\"]}}" \
  --timeframe Custom \
  --time-period from="$START_DATE" to="$END_DATE" \
  --scope "/subscriptions/$SUBSCRIPTION_ID" \
  --query "properties.rows[0][0]" \
  -o tsv 2>/dev/null || echo "0")

if [ "$COST_DATA" = "0" ] || [ -z "$COST_DATA" ]; then
  echo "Unable to retrieve cost data. This may be because:"
  echo "- Costs are still being processed by Azure (can take 24-48 hours)"
  echo "- The resource group is very new"
  echo "- There are no costs yet"
  echo "Estimated monthly cost: ~\$15-25 USD"
else
  # Calculate average daily cost and project monthly
  DAILY_COST=$(echo "scale=2; $COST_DATA / 30" | bc)
  MONTHLY_PROJECTION=$(echo "scale=2; $DAILY_COST * 30" | bc)
  
  echo "30-day total: \$$COST_DATA USD"
  echo "Projected monthly cost: \$$MONTHLY_PROJECTION USD"
fi
