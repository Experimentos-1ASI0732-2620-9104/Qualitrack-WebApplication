import { ProductionEnvironment } from '../domain/model/production-environment.entity';
import { ProductionEnvironmentResource } from './production-environment-response';

/**
 * Translates the environments of Laboratory Management into the environments of Product Batch Management.
 */
export class ProductionEnvironmentAssembler {
  toEntityFromResource(resource: ProductionEnvironmentResource): ProductionEnvironment {
    return new ProductionEnvironment({
      id: resource.id,
      code: resource.code,
      name: resource.name,
      usage: resource.usage ?? null,
    });
  }
}
