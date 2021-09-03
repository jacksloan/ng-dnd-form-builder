import { FormlyFieldConfig } from '@ngx-formly/core';

export type DndInputType =
  | 'Text'
  | 'Number'
  | 'DatePicker'
  | 'Radio'
  | 'Checkbox'
  | 'Group';

export type DnDFormConfig = FormlyFieldConfig & {
  dndName: DndInputType;
  dndTemp: boolean;
  fieldGroup?: DnDFormConfig[];
};

export const dndFormInputText: DnDFormConfig = {
  dndName: 'Text',
  dndTemp: false,
  type: 'input',
  templateOptions: {
    type: 'text',
    label: 'Text Label',
    required: true,
  },
};

export const dndFormInputNumber: DnDFormConfig = {
  dndName: 'Number',
  dndTemp: false,
  type: 'input',
  templateOptions: {
    type: 'number',
    label: 'Number Label',
    required: true,
  },
};

export const dndFormInputDatepicker: DnDFormConfig = {
  dndName: 'DatePicker',
  dndTemp: false,
  type: 'datepicker',
  templateOptions: {
    label: 'Date Picker Label',
    required: true,
  },
};

export const dndFormInputRadio: DnDFormConfig = {
  dndName: 'Radio',
  dndTemp: false,
  type: 'radio',
  templateOptions: {
    label: 'Radio Label',
    required: true,
  },
};

export const dndFormInputGroup: DnDFormConfig = {
  dndName: 'Group',
  dndTemp: false,
  fieldGroup: [],
  templateOptions: {
    label: 'Group Label',
  },
};

export const dndFormInputCheckbox: DnDFormConfig = {
  dndName: 'Checkbox',
  dndTemp: false,
  type: 'checkbox',
  templateOptions: {
    label: 'Checkbox Label',
    required: true,
  },
};

export const DndFormInputs: DnDFormConfig[] = [
  dndFormInputCheckbox,
  dndFormInputDatepicker,
  dndFormInputGroup,
  dndFormInputNumber,
  dndFormInputRadio,
  dndFormInputText,
];
