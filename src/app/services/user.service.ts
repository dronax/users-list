import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { User } from '../models/user.interface';
import {
  PaginationParams,
  PaginatedResponse,
} from '../models/pagination.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  private searchTermSubject = new BehaviorSubject<string>('');
  public searchTerm$ = this.searchTermSubject.asObservable();

  private layoutModeSubject = new BehaviorSubject<'table' | 'card'>(
    this.getStoredLayoutMode(),
  );
  public layoutMode$ = this.layoutModeSubject.asObservable();

  public constructor(private http: HttpClient) {}

  public getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  public getUsersPaginatedAPI(
    params: PaginationParams,
  ): Observable<PaginatedResponse<User>> {
    let httpParams = new HttpParams()
      .set('_page', params.page.toString())
      .set('_limit', params.limit.toString());

    if (params.search) {
      httpParams = httpParams.set('q', params.search);
    }

    return this.http
      .get<User[]>(this.apiUrl, {
        params: httpParams,
        observe: 'response',
      })
      .pipe(
        map((response) => {
          const total = parseInt(
            response.headers.get('X-Total-Count') || '0',
            10,
          );
          const data = response.body || [];

          return {
            data,
            total,
            page: params.page,
            limit: params.limit,
            totalPages: Math.ceil(total / params.limit),
          };
        }),
      );
  }

  public getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  public setSearchTerm(term: string): void {
    this.searchTermSubject.next(term);
  }

  public getSearchTerm(): string {
    return this.searchTermSubject.value;
  }

  public setLayoutMode(mode: 'table' | 'card'): void {
    this.layoutModeSubject.next(mode);
    localStorage.setItem('layoutMode', mode);
  }

  public getLayoutMode(): 'table' | 'card' {
    return this.layoutModeSubject.value;
  }

  private getStoredLayoutMode(): 'table' | 'card' {
    const stored = localStorage.getItem('layoutMode');
    return stored === 'table' || stored === 'card' ? stored : 'table';
  }
}
