/**
 * Base entity interface for all QualiTrack domain entities.
 * @remarks Uses string UUID as identifier to align with the Spring Boot
 * backend that generates UUIDs (VARCHAR(36)) for all entity IDs.
 * @author QualiTrack
 */
export interface BaseEntity {
  /**
   * The unique identifier for this entity.
   *
   * @remarks
   * This ID is immutable and persists throughout the entity's lifecycle.
   * It uniquely identifies this entity within its bounded context.
   */
  id: number | null;
}
