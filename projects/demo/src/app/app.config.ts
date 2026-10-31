import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideFormlyCore, withFormlyFieldExpression } from '@ngx-formly/core';
import { withFormlyMaterial } from '@ngx-formly/material';
import { provideFormBuilder } from 'ng-dnd-form-builder';
import { RatingField } from './rating-field';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideFormlyCore([
      ...withFormlyMaterial(),
      withFormlyFieldExpression(),
      { types: [{ name: 'rating', component: RatingField }] },
    ]),
    provideFormBuilder({
      fieldTypes: [
        {
          type: 'rating',
          label: 'Rating',
          icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1.1 6.3L12 17.5l-5.6 2.9 1.1-6.3L3 9.7l6.2-.9z"/></svg>',
          defaults: { props: { max: 5 } },
        },
      ],
    }),
  ],
};
