// Adapted from https://stackblitz.com/github/bithost-gmbh/ngx-mat-select-search-example?file=src%2Fapp%2Fapp.component.html

import { AfterViewInit, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ReplaySubject, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { MatSelect } from '@angular/material/select';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';

export interface Parametro {
  Id: number;
  Nombre: string;
}

@Component({
    selector: 'app-single-selection',
    templateUrl: './single-selection.component.html',
    styleUrls: ['./single-selection.component.css'],
    standalone: false
})
export class SingleSelectionComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

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

  /** list of parametros */
  @Input() public parametros: Parametro[] = [];

  /** control for the selected parametro */
  @Input() public parametroControl: FormControl<number | null> = new FormControl<number | null>(null);

  /** control for the MatSelect filter keyword */
  public formFilterControl: FormControl<string | null> = new FormControl<string | null>('');

  /** list of parametros filtered by search keyword */
  public filteredParametros: ReplaySubject<Parametro[]> = new ReplaySubject<Parametro[]>(1);

  @ViewChild('singleSelect', { static: true }) singleSelect!: MatSelect;

  /** Subject that emits when the component has been destroyed. */
  protected _onDestroy = new Subject<void>();


  constructor() { }

  ngOnInit() {
    // listen for search field value changes
    this.formFilterControl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterParametros();
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["parametros"] && this.parametros) {
      // load the initial parametro list
      this.filteredParametros.next(this.parametros.slice());
      this.setInitialValue();
    }
  }

  ngAfterViewInit() {
    this.setInitialValue();
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  /**
   * Sets the initial value after the filteredParametros are loaded initially
   */
  protected setInitialValue() {
    this.filteredParametros
      .pipe(take(1), takeUntil(this._onDestroy))
      .subscribe(() => {
        // setting the compareWith property to a comparison function
        // triggers initializing the selection according to the initial value of
        // the form control (i.e. _initializeSelection())
        // this needs to be done after the filteredParametros are loaded initially
        // and after the mat-option elements are available
        this.singleSelect.compareWith = (a: number | null, b: number | null) => !!a && !!b && a === b;
      });
  }

  protected filterParametros() {
    if (!this.parametros) {
      return;
    }
    // get the search keyword
    let search = this.formFilterControl.value;
    if (!search) {
      this.filteredParametros.next(this.parametros.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the parametros
    this.filteredParametros.next(
      this.parametros.filter(parametro => parametro.Nombre.toLowerCase().indexOf(search) > -1)
    );
  }

}
