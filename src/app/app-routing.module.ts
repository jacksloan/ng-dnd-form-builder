import { PathLocationStrategy } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    pathMatch: 'full',
    children: [],
  },
  // { path: '**', component:  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
