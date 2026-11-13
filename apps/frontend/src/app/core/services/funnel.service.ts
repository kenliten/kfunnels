import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Funnel, FunnelStep } from '@kfunnels/shared';

@Injectable({
  providedIn: 'root',
})
export class FunnelService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/funnels';

  getAll(): Observable<Funnel[]> {
    return this.http.get<Funnel[]>(this.baseUrl);
  }

  getById(id: string): Observable<Funnel> {
    return this.http.get<Funnel>(`${this.baseUrl}/${id}`);
  }

  getBySlug(slug: string): Observable<Funnel> {
    return this.http.get<Funnel>(`${this.baseUrl}/slug/${slug}`);
  }

  create(funnel: Partial<Funnel>): Observable<Funnel> {
    return this.http.post<Funnel>(this.baseUrl, funnel);
  }

  update(id: string, funnel: Partial<Funnel>): Observable<Funnel> {
    return this.http.put<Funnel>(`${this.baseUrl}/${id}`, funnel);
  }

  delete(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/${id}`);
  }

  addStep(funnelId: string, step: Partial<FunnelStep>): Observable<Funnel> {
    return this.http.post<Funnel>(`${this.baseUrl}/${funnelId}/steps`, step);
  }

  updateStep(
    funnelId: string,
    stepId: string,
    step: Partial<FunnelStep>
  ): Observable<Funnel> {
    return this.http.put<Funnel>(
      `${this.baseUrl}/${funnelId}/steps/${stepId}`,
      step
    );
  }

  deleteStep(funnelId: string, stepId: string): Observable<Funnel> {
    return this.http.delete<Funnel>(
      `${this.baseUrl}/${funnelId}/steps/${stepId}`
    );
  }

  clone(id: string): Observable<Funnel> {
    return this.http.post<Funnel>(`${this.baseUrl}/${id}/clone`, {});
  }

  seedTemplates(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/seed`,
      {}
    );
  }
}
