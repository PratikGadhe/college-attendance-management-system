/**
 * Client-side CSV export utility.
 * Features:
 * - Proper escaping of quotes, commas, and newlines
 * - UTF-8 BOM (\uFEFF) for immediate compatibility with Microsoft Excel, Apple Numbers & Google Sheets
 * - Type-safe column accessors and header mapping
 * - Automatic temporary anchor download trigger with resource cleanup
 */

export interface CsvColumn<T> {
  header: string
  key?: keyof T
  accessor?: (item: T) => string | number | boolean | null | undefined
}

export function exportToCsv<T>(
  filename: string,
  data: T[],
  columns: CsvColumn<T>[]
): void {
  if (!data || data.length === 0) {
    console.warn('No data available to export to CSV')
    return
  }

  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const headerLine = columns.map((col) => formatValue(col.header)).join(',')
  const rowLines = data.map((item) =>
    columns
      .map((col) => {
        if (col.accessor) {
          return formatValue(col.accessor(item))
        }
        if (col.key !== undefined) {
          return formatValue(item[col.key])
        }
        return ''
      })
      .join(',')
  )

  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generates an ISO date/timestamp string safe for filenames: e.g. "2026-11-03"
 */
export function getReportTimestamp(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

