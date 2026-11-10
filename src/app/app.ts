import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationHostComponent } from '@modules/shared/notification-host/notification-host.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationHostComponent],
  template: `<router-outlet></router-outlet><app-notification-host />`,
})
export class App {}
