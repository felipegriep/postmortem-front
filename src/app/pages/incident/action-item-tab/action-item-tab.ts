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
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
    faPlus,
    faPen,
    faTrash,
    faLink,
    faLinkSlash,
    faUser,
    faCalendarDay,
} from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, finalize, Subject, takeUntil } from 'rxjs';
import { ActionItemService, GetActionItemsParams } from '../../../services/action-item-service';
import { ActionItemInterface } from '../../../domain/interfaces/request/action-item-interface';
import { ActionItemResponseInterface } from '../../../domain/interfaces/response/action-item-response-interface';
import { ActionTypeEnum } from '../../../domain/enums/action-type-enum';
import { ActionStatusEnum } from '../../../domain/enums/action-status-enum';
import { ToastService } from '../../../shared/toast.service';
import { ActionItemDialogComponent } from './action-item-dialog-component/action-item-dialog-component';
import { UserAccountResponseInterface } from '../../../domain/interfaces/response/user-account-response-interface';
import { formatDateToDisplay } from '../../../shared/date-utils';

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

    constructor(
        private readonly actionItemService: ActionItemService,
        private readonly toast: ToastService,
        private readonly faLibrary: FaIconLibrary,
        private readonly route: ActivatedRoute,
        private readonly cdr: ChangeDetectorRef
    ) {
        try {
            this.faLibrary.addIcons(faPlus, faPen, faTrash, faLink, faLinkSlash, faUser, faCalendarDay);
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
    readonly formatDateToDisplayFn = formatDateToDisplay;
    ngOnInit(): void {
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
        const confirmed = window.confirm('Tem certeza que deseja excluir esta ação?');
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
        const ownersMap = new Map<number, UserAccountResponseInterface>();
        items.forEach((item) => {
            if (item.owner?.id !== undefined && item.owner !== null) {
                ownersMap.set(item.owner.id, item.owner);
            }
        });
        this.owners = Array.from(ownersMap.values()).sort((a, b) => {
            const nameA = a.name?.toLocaleLowerCase?.() ?? '';
            const nameB = b.name?.toLocaleLowerCase?.() ?? '';
            return nameA.localeCompare(nameB);
        });
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

    private openDrawer(
        mode: 'create' | 'edit',
        action?: ActionItemResponseInterface
    ): void {
        this.isDrawerEdit = mode === 'edit';
        this.editingActionId = action?.id ?? null;
        this.drawerAction = action ? { ...action } : null;
        this.isDrawerOpen = true;
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
}
