import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';

const materialModules = [MatButtonModule, MatSnackBarModule];

@NgModule({
  imports: materialModules,
  exports: materialModules,
})
export class SharedMaterialModule {}
