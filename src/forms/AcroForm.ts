/**
 * AcroForm support - Interactive PDF forms
 */

import { PDFDict, PDFArray, PDFRef, PDFError } from '../types/index.js';
import { PDFObject, PDFObjectId } from '../core/PDFObject.js';

export enum FieldType {
  Text = 'Tx',
  Button = 'Btn',
  Choice = 'Ch',
  Signature = 'Sig'
}

export enum ButtonType {
  PushButton = 'push',
  CheckBox = 'check',
  RadioButton = 'radio'
}

export interface FormFieldOptions {
  name: string;
  type: FieldType;
  value?: string | boolean | number;
  defaultValue?: string | boolean | number;
  required?: boolean;
  readOnly?: boolean;
  bounds?: { x: number; y: number; width: number; height: number };
  appearance?: FormFieldAppearance;
}

export interface FormFieldAppearance {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  fontSize?: number;
  fontColor?: string;
  fontName?: string;
}

export class AcroForm {
  private fields: Map<string, FormField> = new Map();
  private fieldObjects: PDFObject[] = [];

  addTextField(options: FormFieldOptions & { multiline?: boolean; password?: boolean }): TextField {
    const field = new TextField(options);
    this.fields.set(options.name, field);
    return field;
  }

  addCheckBox(options: FormFieldOptions): CheckBoxField {
    const field = new CheckBoxField(options);
    this.fields.set(options.name, field);
    return field;
  }

  addRadioGroup(options: FormFieldOptions & { choices: string[] }): RadioGroupField {
    const field = new RadioGroupField(options);
    this.fields.set(options.name, field);
    return field;
  }

  addComboBox(options: FormFieldOptions & { choices: string[]; editable?: boolean }): ComboBoxField {
    const field = new ComboBoxField(options);
    this.fields.set(options.name, field);
    return field;
  }

  addListBox(options: FormFieldOptions & { choices: string[]; multiSelect?: boolean }): ListBoxField {
    const field = new ListBoxField(options);
    this.fields.set(options.name, field);
    return field;
  }

  addSignatureField(options: FormFieldOptions): SignatureField {
    const field = new SignatureField(options);
    this.fields.set(options.name, field);
    return field;
  }

  getField(name: string): FormField | undefined {
    return this.fields.get(name);
  }

  getAllFields(): FormField[] {
    return Array.from(this.fields.values());
  }

  fillField(name: string, value: any): void {
    const field = this.fields.get(name);
    if (!field) {
      throw new PDFError(`Field not found: ${name}`);
    }
    field.setValue(value);
  }

  flattenForm(): void {
    // Convert form fields to static content
    for (const field of this.fields.values()) {
      field.flatten();
    }
  }

  generateFormDict(): PDFDict {
    const fieldsArray: PDFRef[] = [];
    
    for (const field of this.fields.values()) {
      const fieldObj = field.toPDFObject();
      this.fieldObjects.push(fieldObj);
      fieldsArray.push(fieldObj.id.toRef());
    }

    return {
      Fields: fieldsArray,
      NeedAppearances: true,
      SigFlags: 3, // Enable signatures and append-only
      CO: [], // Calculation order
      DR: {}, // Default resources
      DA: '/Helv 0 Tf 0 g', // Default appearance
      Q: 0 // Quadding (alignment)
    };
  }

  getFieldObjects(): PDFObject[] {
    return this.fieldObjects;
  }
}

export abstract class FormField {
  protected name: string;
  protected type: FieldType;
  protected value: any;
  protected defaultValue: any;
  protected required: boolean;
  protected readOnly: boolean;
  protected bounds?: { x: number; y: number; width: number; height: number };
  protected appearance?: FormFieldAppearance;

  constructor(options: FormFieldOptions) {
    this.name = options.name;
    this.type = options.type;
    this.value = options.value;
    this.defaultValue = options.defaultValue;
    this.required = options.required || false;
    this.readOnly = options.readOnly || false;
    this.bounds = options.bounds;
    this.appearance = options.appearance;
  }

  getName(): string {
    return this.name;
  }

  getValue(): any {
    return this.value;
  }

  setValue(value: any): void {
    this.value = value;
  }

  isRequired(): boolean {
    return this.required;
  }

  isReadOnly(): boolean {
    return this.readOnly;
  }

  abstract toPDFObject(): PDFObject;
  abstract flatten(): void;

  protected getBaseFieldDict(): PDFDict {
    const dict: PDFDict = {
      Type: 'Annot',
      Subtype: 'Widget',
      FT: this.type,
      T: this.name,
      Ff: this.getFieldFlags()
    };

    if (this.value !== undefined) {
      dict.V = this.value;
    }

    if (this.defaultValue !== undefined) {
      dict.DV = this.defaultValue;
    }

    if (this.bounds) {
      dict.Rect = [this.bounds.x, this.bounds.y, 
                   this.bounds.x + this.bounds.width, 
                   this.bounds.y + this.bounds.height];
    }

    return dict;
  }

  protected getFieldFlags(): number {
    let flags = 0;
    if (this.readOnly) flags |= 1;
    if (this.required) flags |= 2;
    return flags;
  }
}

export class TextField extends FormField {
  private multiline: boolean;
  private password: boolean;

  constructor(options: FormFieldOptions & { multiline?: boolean; password?: boolean }) {
    super({ ...options, type: FieldType.Text });
    this.multiline = options.multiline || false;
    this.password = options.password || false;
  }

  toPDFObject(): PDFObject {
    const dict = this.getBaseFieldDict();
    
    let flags = this.getFieldFlags();
    if (this.multiline) flags |= 4096;
    if (this.password) flags |= 8192;
    dict.Ff = flags;

    const id = new PDFObjectId(1); // This should be managed by document
    return new PDFObject(id, dict);
  }

  flatten(): void {
    // Convert to static text content
  }
}

export class CheckBoxField extends FormField {
  constructor(options: FormFieldOptions) {
    super({ ...options, type: FieldType.Button });
  }

  toPDFObject(): PDFObject {
    const dict = this.getBaseFieldDict();
    dict.Ff = this.getFieldFlags(); // No pushbutton flag for checkbox

    const id = new PDFObjectId(1);
    return new PDFObject(id, dict);
  }

  flatten(): void {
    // Convert to static checkbox appearance
  }
}

export class RadioGroupField extends FormField {
  private choices: string[];

  constructor(options: FormFieldOptions & { choices: string[] }) {
    super({ ...options, type: FieldType.Button });
    this.choices = options.choices;
  }

  toPDFObject(): PDFObject {
    const dict = this.getBaseFieldDict();
    dict.Ff = this.getFieldFlags() | 32768; // Radio button flag

    const id = new PDFObjectId(1);
    return new PDFObject(id, dict);
  }

  flatten(): void {
    // Convert to static radio button appearance
  }
}

export class ComboBoxField extends FormField {
  private choices: string[];
  private editable: boolean;

  constructor(options: FormFieldOptions & { choices: string[]; editable?: boolean }) {
    super({ ...options, type: FieldType.Choice });
    this.choices = options.choices;
    this.editable = options.editable || false;
  }

  toPDFObject(): PDFObject {
    const dict = this.getBaseFieldDict();
    dict.Opt = this.choices;
    
    let flags = this.getFieldFlags() | 131072; // Combo flag
    if (this.editable) flags |= 262144; // Edit flag
    dict.Ff = flags;

    const id = new PDFObjectId(1);
    return new PDFObject(id, dict);
  }

  flatten(): void {
    // Convert to static text showing selected value
  }
}

export class ListBoxField extends FormField {
  private choices: string[];
  private multiSelect: boolean;

  constructor(options: FormFieldOptions & { choices: string[]; multiSelect?: boolean }) {
    super({ ...options, type: FieldType.Choice });
    this.choices = options.choices;
    this.multiSelect = options.multiSelect || false;
  }

  toPDFObject(): PDFObject {
    const dict = this.getBaseFieldDict();
    dict.Opt = this.choices;
    
    let flags = this.getFieldFlags();
    if (this.multiSelect) flags |= 2097152; // MultiSelect flag
    dict.Ff = flags;

    const id = new PDFObjectId(1);
    return new PDFObject(id, dict);
  }

  flatten(): void {
    // Convert to static text showing selected values
  }
}

export class SignatureField extends FormField {
  constructor(options: FormFieldOptions) {
    super({ ...options, type: FieldType.Signature });
  }

  toPDFObject(): PDFObject {
    const dict = this.getBaseFieldDict();

    const id = new PDFObjectId(1);
    return new PDFObject(id, dict);
  }

  flatten(): void {
    // Convert to static signature appearance
  }
}