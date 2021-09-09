import { PathLocationStrategy } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      {
        path: 'form-builder-material',
        loadChildren: () =>
          import('./pages/example-material/form-builder-material.module').then(
            (m) => m.FormBuilderMaterialModule
          ),
      },
      {
        path: 'form-builder-basic',
        loadChildren: () =>
          import('./pages/example-basic/basic.module').then(
            (m) => m.BasicModule
          ),
      },
      { path: '', redirectTo: '/form-builder-material', pathMatch: 'full' },
    ],
  },
  {
    path: '**',
    component: PageNotFoundComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
