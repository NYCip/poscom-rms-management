import chalk from 'chalk';

export const displaySuccess = (msg: string) => console.log(chalk.green('✓ ' + msg));
export const displayError = (msg: string) => console.error(chalk.red('✗ ' + msg));
export const displayInfo = (msg: string) => console.log(chalk.blue(msg));
export const displayWarning = (msg: string) => console.log(chalk.yellow('⚠ ' + msg));

export function displayTable(headers: string[], rows: string[][]): void {
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map(r => (r[i] || '').length)));
  console.log(headers.map((h, i) => h.padEnd(widths[i] ?? 0)).join(' | '));
  console.log(widths.map(w => '-'.repeat(w)).join('-+-'));
  rows.forEach(row => console.log(row.map((c, i) => (c || '').padEnd(widths[i] ?? 0)).join(' | ')));
}
