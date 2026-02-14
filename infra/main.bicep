// ─── Parameters ──────────────────────────────────────────────
@description('Base name for all resources')
param appName string = 'mycrm'

@description('Azure region')
param location string = resourceGroup().location

@description('Container image to deploy (e.g. mycrm.azurecr.io/mycrm:latest)')
param containerImage string

@description('PostgreSQL admin username')
param dbAdminUser string = 'crmadmin'

@secure()
@description('PostgreSQL admin password')
param dbAdminPassword string

// ─── Variables ───────────────────────────────────────────────
var uniqueSuffix = uniqueString(resourceGroup().id)
var acrName = '${appName}acr${uniqueSuffix}'
var logAnalyticsName = '${appName}-logs-${uniqueSuffix}'
var envName = '${appName}-env-${uniqueSuffix}'
var appContainerName = '${appName}-app'
var pgServerName = '${appName}-pg-${uniqueSuffix}'
var dbName = 'sf_crm'

// ─── Azure Container Registry ────────────────────────────────
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

// ─── Log Analytics Workspace ─────────────────────────────────
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// ─── Container Apps Environment ──────────────────────────────
resource containerEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: envName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// ─── PostgreSQL Flexible Server ──────────────────────────────
resource pgServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: pgServerName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: dbAdminUser
    administratorLoginPassword: dbAdminPassword
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

// Allow Azure services to connect
resource pgFirewall 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-12-01-preview' = {
  parent: pgServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Create the application database
resource pgDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: pgServer
  name: dbName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// ─── Container App ───────────────────────────────────────────
resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: appContainerName
  location: location
  properties: {
    managedEnvironmentId: containerEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3001
        transport: 'http'
        allowInsecure: false
      }
      registries: [
        {
          server: acr.properties.loginServer
          username: acr.listCredentials().username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
        }
        {
          name: 'database-url'
          value: 'postgres://${dbAdminUser}:${dbAdminPassword}@${pgServer.properties.fullyQualifiedDomainName}:5432/${dbName}?sslmode=require'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'mycrm'
          image: containerImage
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'DATABASE_URL'
              secretRef: 'database-url'
            }
            {
              name: 'PORT'
              value: '3001'
            }
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'TEST_DATA_PASSWORD'
              value: 'oldgits'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 3
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

// ─── Outputs ─────────────────────────────────────────────────
output acrLoginServer string = acr.properties.loginServer
output acrName string = acr.name
output appUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output pgServerFqdn string = pgServer.properties.fullyQualifiedDomainName
