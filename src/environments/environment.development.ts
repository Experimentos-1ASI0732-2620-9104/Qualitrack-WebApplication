export const environment = {
  production: false,

  // Base API URL
  serverBasePath: 'http://localhost:8080/api/v1',

  // IAM
  iamSignInEndpointPath: '/authentication/sign-in',
  iamSignUpEndpointPath: '/authentication/sign-up',
  // Password recovery with a verification code sent by e-mail (TS05, TS06)
  iamPasswordRecoveryRequestsEndpointPath: '/authentication/password-recovery-requests',
  iamPasswordResetsEndpointPath: '/authentication/password-resets',

  // Users / Roles
  usersEndpointPath: '/users',
  // Password change of the signed-in user, under /users
  currentUserPasswordChangesEndpointPath: '/me/password-changes',
  // Account of the signed-in user (username and e-mail), under /users
  currentUserAccountEndpointPath: '/me',
  rolesEndpointPath: '/roles',

  // Laboratory
  laboratoryLabsEndpointPath: '/laboratories',
  laboratoryStaffEndpointPath: '/staff',
  laboratoryStaffDeactivationsEndpointPath: '/deactivations',
  laboratoryRawMaterialsEndpointPath: '/raw-materials',
  laboratoryEnvironmentsEndpointPath: '/environments',
  laboratoryEnvironmentUsageAssignmentsEndpointPath: '/usage-assignments',

  // Inventory
  inventoryRawMaterialsEndpointPath: '/raw-materials',
  inventoryRawMaterialBatchesEndpointPath: '/batches',
  inventoryRawMaterialBatchReviewsEndpointPath: '/reviews',
  // Container where a lot is stored, under .../raw-materials/{rawMaterialId}/batches/{rawMaterialBatchId}
  inventoryRawMaterialBatchContainerAssignmentEndpointPath: '/container-assignment',
  inventoryRawMaterialMovementsEndpointPath: '/movements',
  inventoryRawMaterialUsagesEndpointPath: '/usages',
  inventoryEnvironmentRawMaterialBatchesEndpointPath: '/raw-material-batches',
  inventoryRawMaterialImportsEndpointPath: '/raw-material-imports',
  // Pre-Inventory records pending import, under /laboratories/{laboratoryId}/inventory
  inventoryEndpointPath: '/inventory',
  inventoryLegacyMaterialsEndpointPath: '/legacy-materials',

  // Equipment, under /laboratories/{laboratoryId} and .../environments/{environmentId}
  equipmentEndpointPath: '/equipments',
  equipmentStatusChangesEndpointPath: '/status-changes',
  equipmentMaintenanceEndpointPath: '/maintenance-records',
  devicesEndpointPath: '/devices',
  environmentalDevicesEndpointPath: '/environmental-devices',
  containerMonitorsEndpointPath: '/container-monitors',
  // Records of an equipment, under /laboratories/{laboratoryId}/equipments/{equipmentId}
  equipmentBpmConfigEndpointPath: '/bpm-configs',
  equipmentComplianceEventsEndpointPath: '/compliance-events',
  equipmentAuditLogsEndpointPath: '/audit-logs',
  // Under /laboratories/{laboratoryId}/environments/{environmentId}/equipments/{equipmentId} (TS86)
  equipmentLogReportsEndpointPath: '/log-reports',

  // Tracking, under .../environments/{environmentId}[/container-monitors/{deviceId} | /devices/{deviceId}]
  trackingTelemetryStatusEndpointPath: '/telemetry-status',
  trackingTelemetryMeasurementsEndpointPath: '/telemetry-measurements',
  trackingActuationEventsEndpointPath: '/actuation-events',
  trackingEnvironmentalProfileEndpointPath: '/environmental-profile',
  trackingThresholdsEndpointPath: '/thresholds',
  trackingActuationRulesEndpointPath: '/actuation-rules',

  // Product Batch, under /laboratories/{laboratoryId}/environments/{environmentId}
  productsEndpointPath: '/products',
  productBatchesEndpointPath: '/batches',
  batchReleasesEndpointPath: '/releases',
  batchRejectionsEndpointPath: '/rejections',
  batchRawMaterialUsagesEndpointPath: '/raw-material-usages',
  batchEquipmentUsagesEndpointPath: '/equipment-usages',
  batchStaffParticipationsEndpointPath: '/staff-participations',
  batchTraceabilityEndpointPath: '/traceability',
  // Container where a batch is stored, under .../products/{productId}/batches/{batchId}
  batchContainerAssignmentEndpointPath: '/container-assignment',
  // Batch records of other bounded contexts, under /batches/{batchId}
  batchEndpointPath: '/batches',
  batchAuditLogsEndpointPath: '/audit-logs',
  batchComplianceEventsEndpointPath: '/compliance-events',
  batchReportsEndpointPath: '/reports',

  // CA
  // Under /laboratories/{laboratoryId}/environments/{environmentId} (list, TS73/TS74) and at the root (/{alertId})
  deviationAlertsEndpointPath: '/deviation-alerts',
  deviationAlertAcknowledgementsEndpointPath: '/acknowledgements',
  deviationAlertResolutionsEndpointPath: '/resolutions',
  // E-mail notice of a critical alert, under /deviation-alerts/{alertId} (TS78)
  deviationAlertEmailNotificationsEndpointPath: '/email-notifications',
  // Notification preferences and notifications of the signed-in user, under /users
  caNotificationPrefsEndpointPath: '/me/notification-preferences',
  caNotificationsEndpointPath: '/me/notifications',
  caNotificationUnreadCountEndpointPath: '/unread-count',
  caNotificationReadReceiptsEndpointPath: '/read-receipts',

  // Profile of the signed-in user under /users, and of a staff member under /laboratories/{laboratoryId}/staff/{staffId}
  profileCurrentUserEndpointPath: '/me/profile',
  profileEndpointPath: '/profile',
  profilePhotoEndpointPath: '/photo',

  // RA
  raReportsEndpointPath: '/reports',
  raReportContentEndpointPath: '/content',
  raAuditLogsEndpointPath: '/audit-logs',
  raKpiDashboardsEndpointPath: '/kpi-dashboards',
  raComplianceReportsEndpointPath: '/compliance-reports',
  // Under /laboratories/{laboratoryId}/environments/{environmentId} (TS82)
  raDeviationTrendsEndpointPath: '/deviation-trends',
  // Under /laboratories/{laboratoryId} (TS85)
  raInventoryReportsEndpointPath: '/inventory/reports',

  // Subscriptions & Payments
  subscriptionPlansEndpointPath: '/subscription-plans',
  subscriptionCheckoutSessionsEndpointPath: '/subscription-checkout-sessions',
  subscriptionsEndpointPath: '/subscriptions',
  laboratorySubscriptionsEndpointPath: '/subscriptions',
  subscriptionCancellationRequestsEndpointPath: '/cancellation-requests',

  // Stripe
  stripeWebhooksEndpointPath: '/stripe/webhooks',
};
