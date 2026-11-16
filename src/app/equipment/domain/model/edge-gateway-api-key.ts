/**
 * API key the cloud issues for an Edge Gateway.
 *
 * @remarks
 * The cloud shows the key only once, when it is issued, and never returns it again. The key is
 * handed to the view that shows it and must not be kept in a store or in the browser storage.
 *
 * @example
 * ```typescript
 * const issued: EdgeGatewayApiKey = {
 *   sensorExternalId: 'EDGE-001',
 *   apiKey: 'the-key-shown-once'
 * };
 * ```
 */
export interface EdgeGatewayApiKey {
  /** The identifier of the Edge Gateway, set as `CLOUD_DEVICE_ID` in the Edge. */
  sensorExternalId: string;

  /** The API key, set as `CLOUD_API_KEY` in the Edge. */
  apiKey: string;
}
