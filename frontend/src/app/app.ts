import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from './shared/nav/nav';
import { ToastsComponent } from './shared/api';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavComponent, ToastsComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');
}
