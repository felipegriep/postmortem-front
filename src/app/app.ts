import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet],
    templateUrl: './app.html',
    styleUrls: ['./app.scss'],
})
export class AppComponent {
    protected readonly title = signal('postmortem-front');
}
