import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  GenerateFunnelDto,
  GeneratedFunnelResult,
  CopywriterDto,
  CopywriterResult,
  CroAuditDto,
  CroAuditResult,
} from '@kfunnels/shared';

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/ai';

  generateFunnel(dto: GenerateFunnelDto): Observable<GeneratedFunnelResult> {
    return this.http.post<GeneratedFunnelResult>(
      `${this.baseUrl}/generate-funnel`,
      dto
    );
  }

  generateCopy(dto: CopywriterDto): Observable<CopywriterResult> {
    return this.http.post<CopywriterResult>(`${this.baseUrl}/copywriter`, dto);
  }

  auditPage(dto: CroAuditDto): Observable<CroAuditResult> {
    return this.http.post<CroAuditResult>(`${this.baseUrl}/cro-audit`, dto);
  }

  optimizeOffer(dto: {
    productName: string;
    mainPrice: number;
    targetAudience: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/optimize-offer`, dto);
  }
}
