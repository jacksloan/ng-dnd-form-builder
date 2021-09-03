// import { Component } from '@angular/core';

// @Component({
//   selector: 'dnd-copy-list-source',
//   template: `
//     <div class="container drag-list hidden-placeholder">
//       <div
//         class="list"
//         cdkDropList
//         cdkDropListSortingDisabled
//         [cdkDropListData]="inputTypes"
//         [cdkDropListEnterPredicate]="noReturnPredicate"
//         (cdkDropListExited)="onSourceListExited($event)"
//         (cdkDropListEntered)="onSourceListEntered($event)"
//         [cdkDropListConnectedTo]="formInputList"
//       >
//         <div
//           [class.border-none]="isLast"
//           class="item"
//           *ngFor="let input of inputTypes; let isLast = last; let index = index"
//           cdkDrag
//           [cdkDragData]="input"
//         >
//           {{ input.dndName }}
//         </div>
//       </div>
//     </div>
//   `,
// })
// export class DndCopyListSourceComponent {}
