// Adapted from https://stackblitz.com/github/bithost-gmbh/ngx-mat-select-search-example?file=src%2Fapp%2Fapp.component.html

import { AfterViewInit, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ReplaySubject, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { MatSelect } from '@angular/material/select';

export interface Selectable {
  value: any;
  label: string;
}

@Component({
    selector: 'app-search-selection',
    templateUrl: './search-selection.component.html',
    standalone: false
})
export class SearchSelectionComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

  /** Label for the single selection filter */
  @Input() public label: string = 'Parámetro';

  /** Icon for the single selection filter */
  @Input() public icon: string = 'search';

  /** placeholder for the single selection filter */
  @Input() public placeholder: string = 'Seleccione una opción';

  /** Error message when no option is selected and the selection is required */
  @Input() public noSelectionErrorMessage: string = 'Debe seleccionar una opción';

  /** Error message when no options are available */
  @Input() public noOptionsErrorMessage: string = 'No hay opciones disponibles';

  /** Input array of items for the selection list. If labelKey and valueKey are provided, the items will be converted to Selectable objects using those keys. Otherwise, the items will be used as they are (with string representation as label). */
  @Input() public items: any[] = [];

  /** The key to use for the label property of the Selectable objects. Leave it null to use the string representation of the item. */
  @Input() public labelKey: string | null = null;

  /** The key to use for the value property of the Selectable objects. Leave it null to use the entire item as the value. */
  @Input() public valueKey: string | null = null;

  /** list of selectables */
  public selectables: Selectable[] = [];

  /** control for the selected selectable */
  @Input() public selectionControl: FormControl<any> = new FormControl<any>(null);

  /** Multiple selection flag — acepta atributo sin binding (p. ej. "multiple") */
  private _multiple: boolean = false;
  @Input()
  public set multiple(value: boolean | string | undefined) {
    this._multiple = value === '' || value === true || value === 'true';
  }
  public get multiple(): boolean {
    return this._multiple;
  }

  /** control for the MatSelect filter keyword */
  public formFilterControl: FormControl<string | null> = new FormControl<string | null>('');

  /** list of selectables filtered by search keyword */
  public filteredSelectables: ReplaySubject<Selectable[]> = new ReplaySubject<Selectable[]>(1);

  @ViewChild('matSelect', { static: true }) matSelect!: MatSelect;

  /** Subject that emits when the component has been destroyed. */
  protected _onDestroy = new Subject<void>();


  constructor() { }

  ngOnInit() {
    // listen for search field value changes
    this.formFilterControl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterSelectables();
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["multiple"] && this.multiple) {
      this.ensureMultipleSelectionValueIsArray();
    }

    if (changes["items"] && this.items) {
      // load the initial selectable list
      this.selectables = this.anies_to_selectables(this.items, this.labelKey, this.valueKey);
      this.filteredSelectables.next(this.selectables.slice());
      this.setInitialValue();
    }
  }

  ngAfterViewInit() {
    this.ensureMultipleSelectionValueIsArray();
    this.setInitialValue();
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  /**
   * Converts an array of any objects to an array of Selectable objects, using the specified keys for label and value. 
   * @param items The array of objects to convert.
   * @param labelKey The key to use for the label property of the Selectable objects.
   * @param valueKey (optional) The key to use for the value property of the Selectable objects. If not provided, the entire item will be used as the value.
   * @returns An array of Selectable objects.
   */
  protected anies_to_selectables(items: any[], labelKey: string | null, valueKey: string | null): Selectable[] {
    console.debug('Converting items to selectables:', items);
    console.debug('Using labelKey:', labelKey, 'and valueKey:', valueKey);
    const selectables: Selectable[] = items.map(item => ({
      label: labelKey ? item[labelKey] : String(item),
      value: valueKey ? item[valueKey] : item
    }));
    console.debug('Converted selectables:', selectables);
    return selectables;
  }

  /**
   * Sets the initial value after the filteredSelectables are loaded initially
   */
  protected setInitialValue() {
    this.filteredSelectables
      .pipe(take(1), takeUntil(this._onDestroy))
      .subscribe(() => {
        // setting the compareWith property to a comparison function
        // triggers initializing the selection according to the initial value of
        // the form control (i.e. _initializeSelection())
        // this needs to be done after the filteredSelectables are loaded initially
        // and after the mat-option elements are available
        this.matSelect.compareWith = (a: any, b: any) => !!a && !!b && a === b;
      });
  }

  /**
   * If the multiple flas is true, ensures that the value of the selectionControl is an array. 
   */
  protected ensureMultipleSelectionValueIsArray(): void {
    if (!this.multiple || !this.selectionControl) {
      return;
    }

    const currentValue = this.selectionControl.value;
    if (currentValue == null) {
      this.selectionControl.setValue([], { emitEvent: false });
      return;
    }

    if (!Array.isArray(currentValue)) {
      this.selectionControl.setValue([currentValue], { emitEvent: false });
    }
  }

  protected filterSelectables() {
    if (!this.selectables) {
      return;
    }
    // get the search keyword
    let search = this.formFilterControl.value;
    if (!search) {
      this.filteredSelectables.next(this.selectables.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the selectables
    this.filteredSelectables.next(
      this.selectables.filter(selectable => selectable.label.toLowerCase().indexOf(search) > -1)
    );
  }

}
