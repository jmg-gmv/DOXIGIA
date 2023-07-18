// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('code-summarizer',  async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return; // No open text editor
		}

		const document = editor.document;
		const selection = editor.selection;

		// Get selected code and strip out whitespace and lower case all tokens
		let code = document.getText(selection);
    	//console.log(code);

		// Prompt user for comment using ChatGPT API
		const comment = await promptComment(code);
		//console.log(comment);
    	context.subscriptions.push(disposable);
  });
}

async function promptComment(code: string): Promise<string> {
    const response = await chatGptApiCall(code);
    const comment = response;

	const editor = vscode.window.activeTextEditor;
    if (editor) {
        const document = editor.document;
        const selection = editor.selection;
        const startPosition = new vscode.Position(selection.start.line, 0);
        const commentText = `${comment}\n\n`;
        await editor.edit(editBuilder => {
            editBuilder.insert(startPosition, commentText);
        });
    }
    return comment;
}

async function chatGptApiCall(code: string): Promise<string> {
    const prompt = `/**\n * @brief Comment for the code in a doxygen way with @brief, @param, @return:\n * ${code}\n */`;
    const response = await openaiApiCall(prompt);
    return response;
}

async function openaiApiCall(prompt: string): Promise<string>{
  try {
    const OPENAI_API_KEY = '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'; // Replace with your OpenAI API key
    const url = 'https://api.openai.com/v1/chat/completions';

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    };

    const data = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    };


    const response = await axios.post(url, data, { headers });
    const comment = response.data.choices[0].message.content.trim();
	//console.log(comment);
    return comment;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
