import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges,
    inject,
    ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule, MatDrawer } from '@angular/material/sidenav';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
    faPlus,
    faPen,
    faTrash,
    faLink,
    faLinkSlash,
    faUser,
    faCalendarDay,
    faHandHoldingHeart,
} from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, finalize, Subject, takeUntil } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActionItemService, GetActionItemsParams } from '../../../services/action-item-service';
import { ActionItemInterface } from '../../../domain/interfaces/request/action-item-interface';
import { ActionItemResponseInterface } from '../../../domain/interfaces/response/action-item-response-interface';
import { ActionTypeEnum } from '../../../domain/enums/action-type-enum';
import { ActionStatusEnum } from '../../../domain/enums/action-status-enum';
import { ToastService } from '../../../shared/toast.service';
import { ActionItemDialogComponent } from './action-item-dialog-component/action-item-dialog-component';
import { UserAccountResponseInterface } from '../../../domain/interfaces/response/user-account-response-interface';
import { UserAccountService } from '../../../services/user-account-service';
import { formatDateToDisplay, normalizeToDate } from '../../../shared/date-utils';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { IncidentService } from '../../../services/incident-service';

interface ActionItemFiltersForm {
    type: ActionTypeEnum | '';
    status: ActionStatusEnum | '';
    overdue: boolean;
    ownerId: number | null;
    query: string;
}

@Component({
    selector: 'app-action-item-tab',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatCheckboxModule,
        MatTooltipModule,
        MatSidenavModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        MatDialogModule,
        FontAwesomeModule,
        ActionItemDialogComponent,
    ],
    templateUrl: './action-item-tab.html',
    styleUrl: './action-item-tab.scss',
})
export class ActionItemTabComponent implements OnInit, OnChanges, OnDestroy {
    @Input() incidentId!: number;

    readonly typeOptions = Object.values(ActionTypeEnum);
    readonly statusOptions = Object.values(ActionStatusEnum);

    private readonly fb = inject(FormBuilder);

    readonly filterForm = this.fb.group({
        type: this.fb.control<ActionTypeEnum | ''>(''),
        status: this.fb.control<ActionStatusEnum | ''>(''),
        overdue: this.fb.control(false, { nonNullable: true }),
        query: this.fb.control(''),
    });

    actionItems: ActionItemResponseInterface[] = [];
    owners: UserAccountResponseInterface[] = [];
    private allOwners: UserAccountResponseInterface[] = [];
    totalItems = 0;
    pageIndex = 0;
    pageSize = 5;
    readonly pageSizeOptions = [5, 10, 20];
    isLoading = false;

    private readonly destroy$ = new Subject<void>();
    @ViewChild('actionDrawer', { static: false }) actionDrawer?: MatDrawer;
    isDrawerOpen = false;
    isDrawerEdit = false;
    drawerAction: ActionItemResponseInterface | null = null;
    private editingActionId: number | null = null;
    incidentStartedAt: Date | null = null;
    drawerResetToken = 0;

    constructor(
        private readonly actionItemService: ActionItemService,
        private readonly toast: ToastService,
        private readonly userAccountService: UserAccountService,
        private readonly dialog: MatDialog,
        private readonly faLibrary: FaIconLibrary,
        private readonly route: ActivatedRoute,
        private readonly cdr: ChangeDetectorRef,
        private readonly incidentService: IncidentService
    ) {
        try {
            this.faLibrary.addIcons(
                faPlus,
                faPen,
                faTrash,
                faLink,
                faLinkSlash,
                faUser,
                faCalendarDay,
                faHandHoldingHeart
            );
        } catch {
            // ignore icon registration issues (e.g., in tests)
        }
    }

    readonly plusIcon = faPlus;
    readonly editIcon = faPen;
    readonly deleteIcon = faTrash;
    readonly linkIcon = faLink;
    readonly linkOffIcon = faLinkSlash;
    readonly ownerIcon = faUser;
    readonly dueIcon = faCalendarDay;
    readonly infoIcon = faHandHoldingHeart;
    readonly formatDateToDisplayFn = formatDateToDisplay;
    readonly truncatedDescription = (value: string | null | undefined, limit = 120): string => {
        if (!value) {
            return '';
        }
        const trimmed = value.trim();
        if (trimmed.length <= limit) {
            return trimmed;
        }
        return `${trimmed.slice(0, limit)}…`;
    };
    private confirm(message: string) {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '420px',
            data: { message },
            disableClose: true,
        });
        return dialogRef.afterClosed().pipe(map((result) => !!result));
    }
    ngOnInit(): void {
        this.loadOwners();
        this.filterForm.valueChanges
            .pipe(debounceTime(300), takeUntil(this.destroy$))
            .subscribe(() => {
                this.pageIndex = 0;
                this.loadActionItems();
            });

        this.initializeIncidentIdListeners();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['incidentId'] && this.incidentId) {
            this.pageIndex = 0;
            this.loadActionItems();
            this.loadIncidentMetadata();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadActionItems();
    }

    onCreateAction(): void {
        this.openDrawer('create');
    }

    onEditAction(item: ActionItemResponseInterface): void {
        if (!item.id) {
            return;
        }
        this.openDrawer('edit', item);
    }

    onDrawerCancel(): void {
        this.closeDrawer();
    }

    onDrawerSubmit(action: ActionItemInterface): void {
        if (this.isDrawerEdit && this.editingActionId != null) {
            this.updateActionItem(this.editingActionId, action);
        } else {
            this.createActionItem(action);
        }
    }

    onDrawerClosed(): void {
        this.isDrawerOpen = false;
        this.isDrawerEdit = false;
        this.editingActionId = null;
        this.drawerAction = null;
        this.cdr.markForCheck();
    }

    onDeleteAction(item: ActionItemResponseInterface): void {
        this.confirm('Esta ação é irreversível. Deseja excluir esta ação?')
            .pipe(takeUntil(this.destroy$))
            .subscribe((confirmed) => {
                if (!confirmed || !item.id) {
                    return;
                }
                this.isLoading = true;
                this.actionItemService
                    .delete(this.incidentId, item.id)
                    .pipe(
                        finalize(() => {
                            this.isLoading = false;
                        }),
                        takeUntil(this.destroy$)
                    )
                    .subscribe({
                        next: () => {
                            this.toast.success('Ação excluída com sucesso.');
                            this.loadActionItems();
                        },
                        error: () => {
                            this.toast.error('Não foi possível excluir a ação. Tente novamente.');
                        },
                    });
            });
    }

    getTypeLabel(type: ActionTypeEnum): string {
        return type === ActionTypeEnum.CORRECTIVE ? 'Corretiva' : 'Preventiva';
    }

    getStatusLabel(status: ActionStatusEnum | 'LATE'): string {
        const labels: Record<ActionStatusEnum | 'LATE', string> = {
            [ActionStatusEnum.TODO]: 'A fazer',
            [ActionStatusEnum.DOING]: 'Em andamento',
            [ActionStatusEnum.DONE]: 'Concluída',
            LATE: 'Em atraso',
        };
        return labels[status];
    }

    isOverdue(item: ActionItemResponseInterface): boolean {
        if (item.status === ActionStatusEnum.DONE) {
            return false;
        }
        if (item.sla?.overdue !== undefined) {
            return item.sla.overdue;
        }
        const dueDate = new Date(item.dueDate);
        const today = new Date();
        return dueDate < today;
    }

    getStatusBadge(item: ActionItemResponseInterface): ActionStatusEnum | 'LATE' {
        if (this.isOverdue(item)) {
            return 'LATE';
        }
        return item.status;
    }

    private loadActionItems(): void {
        if (!this.incidentId) {
            this.isLoading = false;
            return;
        }
        const params = this.buildParams();
        this.isLoading = true;
        this.actionItemService
            .list(this.incidentId, params)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (page) => {
                    const content = Array.isArray((page as any)?.content)
                        ? ((page as any).content as ActionItemResponseInterface[])
                        : (page as unknown as ActionItemResponseInterface[]);

                    this.actionItems = content ?? [];
                    this.totalItems = (page as any)?.totalElements ?? this.actionItems.length;
                    this.updateOwnersCache(this.actionItems);
                    this.isLoading = false;
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.actionItems = [];
                    this.totalItems = 0;
                    this.isLoading = false;
                    this.toast.error('Não foi possível carregar as ações do incidente.');
                    this.cdr.markForCheck();
                },
            });
    }

    private createActionItem(payload: ActionItemInterface): void {
        this.isLoading = true;
        this.actionItemService
            .create(this.incidentId, payload)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.toast.success('Ação criada com sucesso.');
                    this.closeDrawer();
                    this.loadActionItems();
                },
                error: () => {
                    this.toast.error('Não foi possível criar a ação.');
                    this.isLoading = false;
                    this.cdr.markForCheck();
                },
            });
    }

    private updateActionItem(id: number, payload: ActionItemInterface): void {
        this.isLoading = true;
        this.actionItemService
            .update(this.incidentId, id, payload)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.toast.success('Ação atualizada com sucesso.');
                    this.closeDrawer();
                    this.loadActionItems();
                },
                error: () => {
                    this.toast.error('Não foi possível atualizar a ação.');
                    this.isLoading = false;
                    this.cdr.markForCheck();
                },
            });
    }

    private buildParams(): GetActionItemsParams {
        const raw = this.filterForm.getRawValue() as ActionItemFiltersForm;
        const params: GetActionItemsParams = {
            page: this.pageIndex,
            size: this.pageSize,
            sort: 'dueDate',
            direction: 'ASC',
        };

        if (raw.type) {
            params.actionType = raw.type;
        }
        if (raw.status) {
            params.actionStatus = raw.status;
        }
        if (raw.overdue) {
            params.overdue = true;
        }
        if (raw.query?.trim()) {
            params.query = raw.query.trim();
        }

        return params;
    }

    private updateOwnersCache(items: ActionItemResponseInterface[]): void {
        const ownersFromItems = this.extractOwnersFromItems(items);
        this.owners = this.combineOwnersFromSources(ownersFromItems);
    }

    private initializeIncidentIdListeners(): void {
        const applyId = (raw: string | null) => {
            if (!raw) {
                return;
            }
            const parsed = Number(raw);
            if (Number.isNaN(parsed) || parsed === this.incidentId) {
                return;
            }
            this.incidentId = parsed;
            this.pageIndex = 0;
            this.loadActionItems();
            this.loadIncidentMetadata();
        };

        // Attempt snapshot resolution immediately (covers first render)
        const snapshotId =
            this.route.parent?.snapshot.paramMap.get('id') ??
            this.route.snapshot.paramMap.get('id');
        applyId(snapshotId);

        // React to future route changes
        this.route.parent?.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
            applyId(params.get('id'));
        });

        this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
            applyId(params.get('id'));
        });
    }

    private openDrawer(mode: 'create' | 'edit', action?: ActionItemResponseInterface): void {
        this.isDrawerEdit = mode === 'edit';
        this.editingActionId = action?.id ?? null;
        this.drawerAction = action ? { ...action } : null;
        this.isDrawerOpen = true;
        this.drawerResetToken++;
        this.cdr.markForCheck();
        setTimeout(() => {
            this.actionDrawer?.open();
        });
    }

    private closeDrawer(): void {
        this.isDrawerOpen = false;
        this.actionDrawer?.close();
        this.cdr.markForCheck();
    }

    private loadOwners(): void {
        this.userAccountService
            .list()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (users) => {
                    this.allOwners = this.sortOwners(users ?? []);
                    this.owners = this.combineOwnersFromSources(
                        this.extractOwnersFromItems(this.actionItems)
                    );
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.cdr.markForCheck();
                },
            });
    }

    private combineOwnersFromSources(
        additionalOwners: UserAccountResponseInterface[] = []
    ): UserAccountResponseInterface[] {
        const merged = new Map<number, UserAccountResponseInterface>();

        this.allOwners.forEach((owner) => {
            if (owner?.id !== undefined && owner !== null) {
                merged.set(owner.id, owner);
            }
        });

        additionalOwners.forEach((owner) => {
            if (owner?.id !== undefined && owner !== null) {
                merged.set(owner.id, owner);
            }
        });

        return Array.from(merged.values()).sort((a, b) => this.compareOwners(a, b));
    }

    private sortOwners(owners: UserAccountResponseInterface[]): UserAccountResponseInterface[] {
        return owners.slice().sort((a, b) => this.compareOwners(a, b));
    }

    private compareOwners(
        a: UserAccountResponseInterface,
        b: UserAccountResponseInterface
    ): number {
        const nameA = a.name?.toLocaleLowerCase?.() ?? '';
        const nameB = b.name?.toLocaleLowerCase?.() ?? '';
        if (nameA === nameB) {
            const emailA = a.email?.toLocaleLowerCase?.() ?? '';
            const emailB = b.email?.toLocaleLowerCase?.() ?? '';
            return emailA.localeCompare(emailB);
        }
        return nameA.localeCompare(nameB);
    }

    private extractOwnersFromItems(
        items: ActionItemResponseInterface[]
    ): UserAccountResponseInterface[] {
        return items
            .map((item) => item.owner)
            .filter(
                (owner): owner is UserAccountResponseInterface =>
                    !!owner && owner.id !== undefined && owner !== null
            );
    }

    private loadIncidentMetadata(): void {
        if (!this.incidentId) {
            this.incidentStartedAt = null;
            return;
        }

        this.incidentService
            .get(this.incidentId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (incident) => {
                    this.incidentStartedAt = normalizeToDate(incident?.startedAt ?? null);
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.incidentStartedAt = null;
                    this.cdr.markForCheck();
                },
            });
    }
}
