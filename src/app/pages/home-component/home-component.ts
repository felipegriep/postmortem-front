import { Component } from '@angular/core';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-home-component',
  imports: [RouterModule, CommonModule],
  standalone: true,
  templateUrl: './home-component.html',
  styleUrl: './home-component.scss'
})
export class HomeComponent {
  get isLoggedIn(): boolean {
    try {
      return !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
    } catch {
      return false;
    }
  }
}
