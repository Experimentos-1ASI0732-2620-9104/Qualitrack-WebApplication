import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { LegacyMaterialSnapshot } from '../domain/model/legacy-material-snapshot.entity';
import { LegacyMaterialSnapshotResource } from './legacy-material-snapshot-response';
import { LegacyMaterialSnapshotAssembler } from './legacy-material-snapshot-assembler';

/** Reads the laboratory-scoped resource used by historical material details, through an Inventory ACL. */
export class LegacyMaterialSnapshotApiEndpoint extends ErrorHandlingEnabledBaseType {
  private readonly assembler = new LegacyMaterialSnapshotAssembler();
  constructor(private readonly http: HttpClient) { super(); }

  getByLaboratory(laboratoryId: number): Observable<LegacyMaterialSnapshot[]> {
    const url = environment.serverBasePath + environment.laboratoryLabsEndpointPath + '/' + laboratoryId + environment.laboratoryRawMaterialsEndpointPath;
    return this.http.get<LegacyMaterialSnapshotResource[]>(url).pipe(
      map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError('Failed to fetch historical material references')),
    );
  }
}
