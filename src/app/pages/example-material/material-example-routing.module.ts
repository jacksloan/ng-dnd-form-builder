import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MaterialExampleComponent } from './material-example.component';

const routes: Routes = [{ path: '', component: MaterialExampleComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FormBuilderRoutingModule {}
