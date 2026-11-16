import { LegacyMaterialSnapshot } from '../domain/model/legacy-material-snapshot.entity';
import { LegacyMaterialSnapshotResource } from './legacy-material-snapshot-response';

/** Translates historical stock fields without excluding imported or empty materials. */
export class LegacyMaterialSnapshotAssembler {
  toEntityFromResource(resource: LegacyMaterialSnapshotResource): LegacyMaterialSnapshot {
    return new LegacyMaterialSnapshot({
      id: resource.id, name: resource.name, code: resource.code, supplier: resource.supplier,
      batchNumber: resource.batchNumber, expirationDate: resource.expirationDate,
      quantityInStock: resource.currentStock, unit: resource.unit, minimumStock: resource.minimumThreshold,
    });
  }
}
