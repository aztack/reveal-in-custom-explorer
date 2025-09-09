import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export function activate(context: vscode.ExtensionContext) {
  console.log('Reveal in Custom Explorer extension is now active');

  // Register the reveal command
  const revealDisposable = vscode.commands.registerCommand('revealInCustomExplorer.reveal', async (uri: vscode.Uri) => {
    if (!uri) {
      vscode.window.showErrorMessage('No file or folder selected');
      return;
    }

    try {
      await revealInCustomExplorer(uri.fsPath);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to reveal in custom explorer: ${error}`);
    }
  });

  // Register the configure command
  const configureDisposable = vscode.commands.registerCommand('revealInCustomExplorer.configure', async () => {
    await configureExplorer();
  });

  context.subscriptions.push(revealDisposable, configureDisposable);

}

async function revealInCustomExplorer(filePath: string): Promise<void> {
  const config = vscode.workspace.getConfiguration('revealInCustomExplorer');
  let explorerPath = config.get<string>('explorerPath');
  const useOpenCommand = config.get<boolean>('useOpenCommand', false);

  if (!explorerPath) {
    const action = await vscode.window.showInformationMessage(
      'No file explorer configured. Would you like to configure one now?',
      'Configure Explorer',
      'Cancel'
    );
    
    if (action === 'Configure Explorer') {
      explorerPath = await configureExplorer();
      if (!explorerPath) {
        return;
      }
    } else {
      return;
    }
  }

  // Check if the explorer application exists
  try {
    await execAsync(`test -e "${explorerPath}"`);
  } catch {
    vscode.window.showErrorMessage(`Explorer application not found at: ${explorerPath}`);
    return;
  }

  let command: string;

  if (useOpenCommand) {
    // Use the 'open' command with the specified application
    command = `open -a "${explorerPath}" "${filePath}"`;
  } else {
    // Try to launch the application directly
    if (process.platform === 'darwin') {
      // On macOS, use the 'open' command for .app bundles
      if (explorerPath.endsWith('.app')) {
        command = `open -a "${explorerPath}" "${filePath}"`;
      } else {
        command = `"${explorerPath}" "${filePath}"`;
      }
    } else {
      // On other platforms, try to execute directly
      command = `"${explorerPath}" "${filePath}"`;
    }
  }

  try {
    await execAsync(command);

    // Show a brief success message
    const explorerName = path.basename(explorerPath, '.app');
    vscode.window.setStatusBarMessage(`Revealed in ${explorerName}`, 2000);
  } catch (error) {
    console.error('Failed to execute command:', command, error);

    // Try alternative approach for macOS apps
    if (process.platform === 'darwin' && explorerPath.endsWith('.app') && !useOpenCommand) {
      try {
        const fallbackCommand = `open -a "${explorerPath}" "${filePath}"`;
        await execAsync(fallbackCommand);
        const explorerName = path.basename(explorerPath, '.app');
        vscode.window.setStatusBarMessage(`Revealed in ${explorerName}`, 2000);
      } catch (fallbackError) {
        throw new Error(`Failed to open with both methods: ${error}, ${fallbackError}`);
      }
    } else {
      throw error;
    }
  }
}

async function configureExplorer(): Promise<string | undefined> {
  const commonExplorers = getCommonExplorers();
  
  // Create quick pick items for common explorers
  const quickPickItems: vscode.QuickPickItem[] = [
    ...commonExplorers.map(explorer => ({
      label: explorer.name,
      description: explorer.path,
      detail: `Open files in ${explorer.name}`
    })),
    {
      label: '$(edit) Custom Path...',
      description: 'Enter a custom file explorer path',
      detail: 'Specify your own file explorer application'
    }
  ];

  const selected = await vscode.window.showQuickPick(quickPickItems, {
    placeHolder: 'Select a file explorer or choose custom path',
    title: 'Configure File Explorer'
  });

  if (!selected) {
    return undefined;
  }

  let explorerPath: string;

  if (selected.label === '$(edit) Custom Path...') {
    // User wants to enter custom path
    const customPath = await vscode.window.showInputBox({
      prompt: 'Enter the full path to your file explorer application',
      placeHolder: '/Applications/YourExplorer.app',
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Please enter a valid path';
        }
        return null;
      }
    });

    if (!customPath) {
      return undefined;
    }

    explorerPath = customPath.trim();
  } else {
    // User selected a common explorer
    const explorer = commonExplorers.find(e => e.name === selected.label);
    if (!explorer) {
      return undefined;
    }
    explorerPath = explorer.path;
  }

  // Check if the selected/entered path exists
  try {
    await execAsync(`test -e "${explorerPath}"`);
  } catch {
    const tryAnyway = await vscode.window.showWarningMessage(
      `The file explorer at "${explorerPath}" was not found. Do you want to save this configuration anyway?`,
      'Save Anyway',
      'Cancel'
    );
    
    if (tryAnyway !== 'Save Anyway') {
      return undefined;
    }
  }

  // Save the configuration
  const config = vscode.workspace.getConfiguration('revealInCustomExplorer');
  await config.update('explorerPath', explorerPath, vscode.ConfigurationTarget.Global);

  const explorerName = path.basename(explorerPath, '.app');
  vscode.window.showInformationMessage(`File explorer configured: ${explorerName}`);
  
  return explorerPath;
}

export function deactivate() {
  // Clean up resources if needed
}

// Helper function to get common file explorer paths
export function getCommonExplorers(): { name: string; path: string }[] {
  const explorers = [
    { name: 'Finder', path: '/System/Applications/Finder.app' },
    { name: 'Path Finder', path: '/Applications/Path Finder.app' },
    { name: 'Bloom', path: '/Applications/Bloom.app' },
    { name: 'Commander One', path: '/Applications/Commander One - file manager.app' },
    { name: 'ForkLift 3', path: '/Applications/ForkLift 3.app' },
    { name: 'muCommander', path: '/Applications/muCommander.app' },
    { name: 'Directory Utility', path: '/Applications/Directory Utility.app' }
  ];

  return explorers;
}
