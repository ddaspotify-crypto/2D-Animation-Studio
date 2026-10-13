import { spawn } from 'node:child_process';

/** Desktop adapter: only a human-selected directory can become an allowed filesystem root. */
export function chooseDirectory(initialPath: string): Promise<string | null> {
  if (process.platform !== 'win32') throw new Error('Chọn thư mục bằng hộp thoại chỉ hỗ trợ Windows. Dùng STUDIO_PROJECTS_DIR trên hệ điều hành khác.');
  const script = `
Add-Type -AssemblyName System.Windows.Forms
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = 'Chọn thư mục chứa các project của 2D Animation Studio'
$dialog.SelectedPath = $env:STUDIO_PICKER_INITIAL
$dialog.ShowNewFolderButton = $true
if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::Write($dialog.SelectedPath) }
$dialog.Dispose()
`;
  return new Promise((resolve, reject) => {
    const child = spawn('powershell.exe', ['-NoProfile', '-STA', '-WindowStyle', 'Hidden', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], {
      windowsHide: true, env: {...process.env, STUDIO_PICKER_INITIAL: initialPath}, stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '', errors = '';
    child.stdout.setEncoding('utf8').on('data', (chunk: string) => {output += chunk;});
    child.stderr.setEncoding('utf8').on('data', (chunk: string) => {errors += chunk;});
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(output.trim().replace(/^\uFEFF/, '') || null) : reject(new Error(`Không mở được hộp thoại thư mục: ${errors}`)));
  });
}
