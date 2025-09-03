import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.interface';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss',
})
export class UserDetailComponent implements OnInit, OnDestroy {
  public user: User | null = null;
  public isLoading: boolean = false;
  public error: string = '';
  public searchTerm: string = '';

  private destroy$ = new Subject<void>();

  public constructor(
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  public ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.searchTerm = params['search'] || '';
      });

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const userId = parseInt(params['id'], 10);
      if (userId) {
        this.loadUser(userId);
      } else {
        this.error = 'Invalid user ID';
      }
    });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public loadUser(id: number): void {
    this.isLoading = true;
    this.error = '';

    this.userService
      .getUserById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.user = user;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load user details. Please try again later.';
          this.isLoading = false;
          console.error('Error loading user:', err);
        },
      });
  }

  public goBack(): void {
    const queryParams: any = {};
    if (this.searchTerm) {
      queryParams.search = this.searchTerm;
    }

    this.router.navigate(['/users'], { queryParams });
  }
}
