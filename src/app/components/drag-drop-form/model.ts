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
  dndIcon: string;
  dndTemp: boolean;
  fieldGroup?: DnDFormConfig[];
};

export const dndFormInputText: DnDFormConfig = {
  dndName: 'Text',
  dndIcon: 'text_fields',
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
  dndIcon: 'numbers',
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
  dndIcon: 'today',
  type: 'datepicker',
  templateOptions: {
    label: 'Date Picker Label',
    required: true,
  },
};

export const dndFormInputRadio: DnDFormConfig = {
  dndName: 'Radio',
  dndTemp: false,
  dndIcon: 'radio_button_checked',
  type: 'radio',
  templateOptions: {
    label: 'Radio Label',
    required: true,
  },
};

export const dndFormInputGroup: DnDFormConfig = {
  dndName: 'Group',
  dndIcon: 'list_alt',
  dndTemp: false,
  fieldGroup: [],
  templateOptions: {
    label: 'Group Label',
  },
};

export const dndFormInputCheckbox: DnDFormConfig = {
  dndName: 'Checkbox',
  dndIcon: 'check_box',
  dndTemp: false,
  type: 'checkbox',
  templateOptions: {
    label: 'Checkbox Label',
    required: true,
  },
};

export const DndFormInputs: DnDFormConfig[] = [
  dndFormInputText,
  dndFormInputNumber,
  dndFormInputCheckbox,
  dndFormInputRadio,
  dndFormInputDatepicker,
  dndFormInputGroup,
];
