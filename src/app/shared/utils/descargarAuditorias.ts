import base64ToArrayBuffer from './base64ToArrayBuffer';

/** The ExcelJS library for handling Excel files */
const ExcelJS = require('exceljs');

/** Array of month abbreviations used in the Excel file */
const MESES_ARCHIVO =
    ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** Headers for the Excel file */
const HEADERS = ['ID', 'Auditoria', 'Tipo de Evaluación', 'Macroproceso', 'Proceso', 'Dependencia', ...MESES_ARCHIVO];

/** Interface representing an audit entry */
interface Auditoria {
  /** The title or name of the audit */
  auditoria: string;
  /** The type of evaluation for the audit */
  tipoEvaluacion: string;
  /** The macroprocess name */
  macroproceso: string;
  /** The process name */
  proceso: string;
  /** The dependency name */
  dependencia: string;
  /** The cronogram string representing scheduled months */
  cronograma: string;
  /** The current status of the audit */
  estado_nombre: string;
}

/** Allowed values for the "Tipo de Evaluación" field */
const TIPOS_EVALUACION = [
  "Auditoría Interna",
  "Seguimiento",
  "Informe",
  "Otro",
];

/**
 * Converts a chronogram string to an array of months representation
 * where 'x' indicates the month is selected and '' indicates it is not.
 * @param cronograma The cronogram string (e.g., "Enero, Marzo, Mayo")
 * @returns An array of strings representing each month
 *    (first string is January, second is February, etc.)
 *    where 'x' indicates the month is selected and '' indicates it is not.
 * @example
 * cronogramaAMeses("Enero, Marzo, Mayo") returns ['x', '', 'x', '', 'x', '', '', '', '', '', '', '']
 */
function cronogramaAMeses(cronograma: string): string[] {
  if (cronograma === 'Todos')
    return MESES_ARCHIVO.map(_ => 'x');

  const mesesSeleccionados: string[] =
      cronograma.split(',').map(mes => mes.trim().substring(0, 3));

  let resultado: string[] = [];
  MESES_ARCHIVO.forEach(mes => {
    if (mesesSeleccionados.includes(mes)) {
      resultado.push('x');
      return;
    }
    else
      resultado.push('');
  });

  return resultado;
}

/**
 * Transforms the dataSource into a format suitable for Excel export
 * @returns An array of objects representing the data in the desired Excel format
 */
function dataSourceToExcelData(dataSource: Array<Auditoria>): Array<object> {
  // 1. Load basic data from dataSource in the desired format
  let data: {[key: string]: Array<string>} = {
    // ID
    [HEADERS[0]]: Array.from(Array(dataSource.length).keys())
                    .map(i => (i + 1).toString()),
    // Auditoria
    [HEADERS[1]]: dataSource.map(a => a.auditoria),
    // Tipo de Evaluación
    [HEADERS[2]]: dataSource.map(a => a.tipoEvaluacion),
    // Macroproceso
    [HEADERS[3]]: dataSource.map(a => a.macroproceso || ''),
    // Proceso
    [HEADERS[4]]: dataSource.map(a => a.proceso || ''),
    // Dependencia
    [HEADERS[5]]: dataSource.map(a => a.dependencia || ''),
  };

  // 2. Transform cronograma into month columns
  const cronogramaMatriz = dataSource.map(a =>
    cronogramaAMeses(a.cronograma)
  );
  let mesesData: {[key: string]: string[]} = {};
  MESES_ARCHIVO.forEach((mes, index) => {
    mesesData[mes] = cronogramaMatriz.map(cronograma => cronograma[index]);
  });

  data = { ...data, ...mesesData };

  // Create final array of objects maintaining HEADERS order
  const numRows = dataSource.length;
  let finalData: Array<object> = [];
  for (let i = 0; i < numRows; i++) {
    let row: {[key: string]: string} = {};
    HEADERS.forEach(header => {
      row[header] = data[header][i];
    });
    finalData.push(row);
  }

  return finalData;
}

/**
 * Creates the Excel file for the given audit data.
 * @param dataSource The array of audit data to be exported.
 *   See {@link Auditoria} for structure.
 * @param base64File The Base64 encoded Excel template file.
 * @returns A Promise that resolves to an ArrayBuffer containing the Excel file data.
 * @throws Error if any issue occurs during the Excel generation process.
 */
export async function descargarAuditorias(
    dataSource: Array<Auditoria>,
    base64File: string,
): Promise<ArrayBuffer> {
  try{
    // Load the template workbook from the Base64 string and select the first worksheet
    const workbook = new ExcelJS.Workbook();
    const inputBuffer = base64ToArrayBuffer(base64File);
    await workbook.xlsx.load(inputBuffer);
    const worksheet = workbook.worksheets[0];

    // Insert 3 new columns after "Tipo de Evaluación" (column 3)
    worksheet.spliceColumns(4, 0, [], [], []);

    // Update header row with new column names
    const headerRow = worksheet.getRow(1);
    headerRow.getCell(4).value = 'Macroproceso';
    headerRow.getCell(5).value = 'Proceso';
    headerRow.getCell(6).value = 'Dependencia';
    
    // Copy style from adjacent header cell
    const styleReference = headerRow.getCell(3);
    [4, 5, 6].forEach(colIdx => {
      const cell = headerRow.getCell(colIdx);
      cell.style = styleReference.style;
      cell.border = styleReference.border;
    });
    headerRow.commit();

    // Prepare to write data starting from row 2, skipping header row
    const rows = dataSourceToExcelData(dataSource);
    const startRowIndex = 2;
    const originalMaxRows = 35;
    const maxRowIndex = Math.max(originalMaxRows, startRowIndex + rows.length - 1);

    // Write data into worksheet by modifying existing rows (keep styles)
    rows.forEach((rowObj, rowIdx) => {
      const excelRow = worksheet.getRow(startRowIndex + rowIdx);
      HEADERS.forEach((hdr, colIdx) => {
        const cell = excelRow.getCell(colIdx + 1);
        const value = (rowObj as any)[hdr] ?? '';
        cell.value = value;
      });
      excelRow.commit();
    });

    // Give new rows the same style and border as the original template rows
    const sourceRow = worksheet.getRow(originalMaxRows);
    for (let r = originalMaxRows + 1; r <= maxRowIndex; r++) {
      const targetRow = worksheet.getRow(r);
      HEADERS.forEach((_, colIdx) => {
        const sourceCell = sourceRow.getCell(colIdx + 1);
        const targetCell = targetRow.getCell(colIdx + 1);
        targetCell.style = sourceCell.style;
        targetCell.border = sourceCell.border;
      });
      targetRow.commit();
    }

    // Add back data validation for 'Tipo de Evaluación' column
    const tipoEvaluacionColIdx = HEADERS.indexOf('Tipo de Evaluación') + 1;
    worksheet.getColumn(tipoEvaluacionColIdx)
        .eachCell({ includeEmpty: true }, (cell: any, rowNumber: number) => {
          if (rowNumber >= startRowIndex && rowNumber <= maxRowIndex) {
            cell.dataValidation = {
              type: 'list',
              allowBlank: true,
              formulae: [`"${TIPOS_EVALUACION.join(',')}"`],
              showErrorMessage: true,
              errorStyle: 'error',
            }
          };
        });

    // Remove other worksheets if any
    workbook.worksheets.forEach((ws: any) => {
      if (ws !== worksheet) {
        workbook.removeWorksheet(ws.id);
      }
    });

    return await workbook.xlsx.writeBuffer();

  } catch (error) {
    console.error('Error al generar el archivo Excel:', error);
    throw error;
  }
}

export default descargarAuditorias;
