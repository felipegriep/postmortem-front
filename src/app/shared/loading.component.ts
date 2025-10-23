import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from './loading.service';

@Component({
    selector: 'app-loading',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div *ngIf="isLoading | async" class="loading-overlay">
            <div class="loading-center">
                <!-- GIF loader (embedded as data URI) -->
                <img
                    src="data:image/gif;base64,R0lGODlhKwALAPAAAP///wAAACH5BAEAAAAALAAAAAArAAsAAAIKjI+py+0Po5y02ouz3rz7D4biSJbmiaJqyrbuC8fyrv7wEAOw=="
                    alt="loading"
                    class="loading-gif"
                />
                <div class="loading-text">Carregando...</div>
            </div>
        </div>
    `,
    styles: [
        `
            .loading-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.45);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }
            .loading-center {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
            }
            .loading-gif {
                width: 72px;
                height: 72px;
                object-fit: contain;
            }
            .loading-text {
                color: #fff;
                font-weight: 600;
            }
        `,
    ],
})
export class LoadingComponent {
    constructor(private loading: LoadingService) {}

    get isLoading() {
        return this.loading.isLoading$;
    }
}
