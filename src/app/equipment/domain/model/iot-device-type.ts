/**
 * Kinds of ESP32 IoT devices that the laboratory registers as equipment (US51, US53).
 *
 * @remarks
 * The environmental device (space monitor) supervises a whole environment; the container monitor
 * supervises a container of the environment where raw material lots or product batches are kept.
 *
 * - `ENVIRONMENTAL_DEVICE`: space monitor that supervises a whole environment.
 * - `CONTAINER_MONITOR`: monitor of a container where raw material lots or product batches are kept.
 */
export type IotDeviceType = 'ENVIRONMENTAL_DEVICE' | 'CONTAINER_MONITOR';

/**
 * All the valid IoT device types.
 *
 * @remarks
 * Useful for validations and for building selection lists in the UI.
 */
export const IOT_DEVICE_TYPES: readonly IotDeviceType[] = ['ENVIRONMENTAL_DEVICE', 'CONTAINER_MONITOR'];
