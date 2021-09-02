import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-shell',
  template: `
    <p>
      shell works!
    </p>
  `,
  styles: [
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShellComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
