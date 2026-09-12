/**
 * Abstract base class for all QualiTrack API gateway services.
 * @remarks Acts as the root class for bounded context API classes
 * (e.g. TrackingApi, BatchManagementApi). Child classes aggregate
 * multiple endpoint classes and expose them to the application store.
 * @author QualiTrack
 */
export abstract class BaseApi {
  // No methods defined; children classes aggregate specific API endpoints.
}
