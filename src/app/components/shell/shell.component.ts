import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-shell',
  template: `
    <header>
      <nav>
        <ul>
          <li>
            <a
              *ngFor="let link of links"
              routerLink="{{ link[0] }}"
              routerLinkActive="text-blue-500"
              [routerLinkActiveOptions]="{ exact: true }"
            >
              {{ link[1] }}
            </a>
          </li>
        </ul>
      </nav>
    </header>

    <section>
      <router-outlet></router-outlet>
    </section>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  links: [string, string][] = [['/', 'Home']];
}
