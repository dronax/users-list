import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import {
  Subject,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
} from 'rxjs';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.interface';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbPaginationModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit, OnDestroy {
  paginatedUsers: User[] = [];
  searchTerm = '';
  currentPage = 1;
  pageSize = 5;
  pageSizeOptions = [5, 10];
  totalUsers = 0;
  totalPages = 0;
  isLoading = false;
  error = '';
  layoutMode: 'table' | 'card' = 'table';
  Math = Math;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    public userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.userService.layoutMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mode) => (this.layoutMode = mode));

    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
        tap(() => {
          this.isLoading = true;
          this.error = '';
        }),
        switchMap((term) => {
          this.searchTerm = term;
          return this.userService.getUsersPaginatedAPI({
            page: this.currentPage,
            limit: this.pageSize,
            search: term,
          });
        })
      )
      .subscribe({
        next: (response) => this.handleResponse(response, true),
        error: (err) => this.handleError(err),
      });

    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        if (params['search']) {
          this.searchTerm = params['search'];
          this.userService.setSearchTerm(this.searchTerm);
        }
        if (params['page'])
          this.currentPage = parseInt(params['page'], 10) || 1;
        if (params['pageSize']) {
          const size = parseInt(params['pageSize'], 10);
          if (this.pageSizeOptions.includes(size)) this.pageSize = size;
        }
      });

    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.error = '';
    this.userService
      .getUsersPaginatedAPI({
        page: this.currentPage,
        limit: this.pageSize,
        search: this.searchTerm || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.handleResponse(response),
        error: (err) => this.handleError(err),
      });
  }

  onSearchChange(event: Event): void {
    this.searchSubject.next((event.target as HTMLInputElement).value);
  }

  clearSearch(inputElement?: HTMLInputElement): void {
    this.searchSubject.next('');
    if (inputElement) setTimeout(() => inputElement.focus(), 100);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updateUrl();
    this.loadUsers();
  }

  toggleLayoutMode(): void {
    this.userService.setLayoutMode(
      this.layoutMode === 'table' ? 'card' : 'table'
    );
  }

  viewUserDetail(userId: number): void {
    this.router.navigate(['/user', userId], {
      queryParams: this.searchTerm ? { search: this.searchTerm } : {},
    });
  }

  onPageSizeChange(newPageSize: number): void {
    this.pageSize = newPageSize;
    this.currentPage = 1;
    this.updateUrl();
    this.loadUsers();
  }

  private handleResponse(response: any, resetPage = false): void {
    this.paginatedUsers = response.data;
    this.totalUsers = response.total;
    this.totalPages = response.totalPages;
    this.isLoading = false;
    if (resetPage) this.currentPage = 1;
    this.updateUrl();
  }

  private handleError(err: any): void {
    this.error = 'Failed to load users. Please try again later.';
    this.isLoading = false;
    console.error('Error loading users:', err);
  }

  private updateUrl(): void {
    const queryParams: any = {};
    if (this.searchTerm?.trim()) queryParams.search = this.searchTerm;
    if (this.currentPage > 1) queryParams.page = this.currentPage;
    queryParams.pageSize = this.pageSize;
    this.router.navigate([], { relativeTo: this.route, queryParams });
  }
}
