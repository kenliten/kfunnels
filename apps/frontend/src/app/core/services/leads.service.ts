import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Lead } from '@kfunnels/shared';

@Injectable({
  providedIn: 'root',
})
export class LeadsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/leads';

  getAll(funnelId?: string): Observable<Lead[]> {
    const params = funnelId ? `?funnelId=${funnelId}` : '';
    return this.http.get<Lead[]>(`${this.baseUrl}${params}`);
  }

  create(lead: Partial<Lead>): Observable<Lead> {
    return this.http.post<Lead>(this.baseUrl, lead);
  }

  delete(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/${id}`);
  }
}
