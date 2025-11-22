import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { DocDispositionEnum } from '../../../domain/enums/doc-disposition-enum';
import { DocFormatEnum } from '../../../domain/enums/doc-format-enum';
import { PostmortemDocResponseInterface } from '../../../domain/interfaces/response/postmortem-doc-response-interface';
import { PostmortemDocService } from '../../../services/postmortem-doc-service';
import { Subject, takeUntil } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFileArrowDown, faCopy, faWandMagicSparkles, faHandHoldingHeart } from '@fortawesome/free-solid-svg-icons';
import { ToastService } from '../../../shared/toast.service';

@Component({
  selector: 'app-postmortem-doc-component',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatFormFieldModule,
    MatSelectModule, MatTooltipModule, FontAwesomeModule,
    MatProgressSpinnerModule, DatePipe
  ],
  templateUrl: './postmortem-doc-component.html',
  styleUrl: './postmortem-doc-component.scss'
})
export class PostmortemDocComponent implements OnInit, OnDestroy, OnChanges {
  @Input() incidentId!: number;

  versions: PostmortemDocResponseInterface[] = [];
  selectedVersion: number | null = null;
  markdownContent = '';

  isLoadingVersions = false;
  isLoadingContent = false;
  isCreating = false;
  private readonly destroy$ = new Subject<void>();
  readonly newVersionIcon = faWandMagicSparkles;
  readonly downloadIcon = faFileArrowDown;
  readonly copyIcon = faCopy;
  readonly infoIcon = faHandHoldingHeart;

  constructor(
    // Injeta o serviço (seja o mock ou o real)
    @Inject('PostmortemDocService') private docService: PostmortemDocService,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
    private readonly toast: ToastService
  ) { }

  ngOnInit(): void {
    this.initializeIncidentIdListeners();
    if (this.incidentId) {
      this.loadVersions();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const idChange = changes['incidentId'];
    if (idChange && idChange.currentValue && idChange.currentValue !== idChange.previousValue) {
      this.loadVersions();
    }
  }

  private initializeIncidentIdListeners(): void {
    const applyId = (rawId: string | null) => {
      if (!rawId) {
        return;
      }
      const parsed = Number(rawId);
      if (Number.isNaN(parsed) || parsed === this.incidentId) {
        return;
      }
      this.incidentId = parsed;
      this.versions = [];
      this.selectedVersion = null;
      this.markdownContent = '';
      this.loadVersions();
    };

    if (!this.incidentId) {
      const snapshotId = this.route.parent?.snapshot.paramMap.get('id') ??
        this.route.snapshot.paramMap.get('id');
      applyId(snapshotId);
    }

    this.route.parent?.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      applyId(params.get('id'));
    });

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      applyId(params.get('id'));
    });
  }

  loadVersions(preferredVersion?: number): void {
    if (!this.incidentId) return;
    this.isLoadingVersions = true;
    const previousSelection = preferredVersion ?? this.selectedVersion;
    this.docService.list(this.incidentId)
      .pipe(finalize(() => {
        this.isLoadingVersions = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: data => {
          this.versions = data ?? [];
          const hasPrevious = previousSelection != null &&
            this.versions.some(v => v.version === previousSelection);
          const fallbackVersion = this.getLatestVersion(this.versions);
          this.selectedVersion = hasPrevious ? previousSelection : fallbackVersion;

          if (this.selectedVersion) {
            this.loadContent();
          } else {
            this.markdownContent = '';
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.versions = [];
          this.selectedVersion = null;
          this.cdr.markForCheck();
        }
      });
  }

  loadContent(): void {
    if (!this.incidentId || !this.selectedVersion) return;
    this.isLoadingContent = true;
    this.markdownContent = '';

    this.docService.get(this.incidentId, this.selectedVersion, DocFormatEnum.MD, DocDispositionEnum.INLINE)
      .pipe(finalize(() => {
        this.isLoadingContent = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: content => {
          this.markdownContent = content;
          this.cdr.markForCheck();
        },
        error: () => {
          this.markdownContent = '';
          this.cdr.markForCheck();
        }
      });
  }

  generateNewVersion(): void {
    if (!this.incidentId) return;
    this.isCreating = true;
    this.docService.create(this.incidentId)
      .pipe(finalize(() => {
        this.isCreating = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          this.toast.success('Nova versão gerada! Atualizando a lista...');
          if (response?.version != null) {
            this.loadVersions(Number(response.version));
          } else {
            this.selectedVersion = null;
            this.loadVersions();
          }
        },
        error: () => {
          this.toast.error('Não foi possível gerar a nova versão. Tente novamente.');
        }
      });
  }

  onDownload(): void {
    if (!this.incidentId || !this.selectedVersion) return;

    this.docService.get(this.incidentId, this.selectedVersion, DocFormatEnum.MD, DocDispositionEnum.ATTACHMENT)
      .subscribe(content => {
        this.downloadFile(content, `postmortem-inc${this.incidentId}-v${this.selectedVersion}.md`);
      });
  }

  onCopy(): void {
    if (!this.markdownContent) return;

    const listener = (e: ClipboardEvent) => {
      e.clipboardData?.setData('text/plain', this.markdownContent);
      e.preventDefault();
      document.removeEventListener('copy', listener);
    };
    document.addEventListener('copy', listener);
    document.execCommand('copy');
    this.toast.success('Conteúdo copiado para a área de transferência.');
  }

  private downloadFile(data: string, filename: string): void {
    const blob = new Blob([data], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private getLatestVersion(list: PostmortemDocResponseInterface[]): number | null {
    if (!list?.length) {
      return null;
    }
    return list.reduce((latest, current) => {
      return current.version > latest ? current.version : latest;
    }, list[0].version);
  }
}
