import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
    private _count = 0;
    private _subj = new BehaviorSubject<boolean>(false);
    readonly isLoading$: Observable<boolean> = this._subj.asObservable();

    show(): void {
        this._count = Math.max(0, this._count + 1);
        if (this._count > 0) this._subj.next(true);
    }

    hide(): void {
        this._count = Math.max(0, this._count - 1);
        if (this._count === 0) this._subj.next(false);
    }

    // Force hide and reset counter
    reset(): void {
        this._count = 0;
        this._subj.next(false);
    }
}
