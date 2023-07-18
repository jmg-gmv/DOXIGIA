// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

  let doxigiaCommand = vscode.commands.registerCommand('extension.doxigia', () => {
 
    let commandMappings = [
      {
        commandId: 'code-summarizer-doxygen',
        handler: doxygenComments
      },
      {
        commandId: 'inLineComments-comments',
        handler: inLineComments
      },
      {
        commandId: 'code-headers',
        handler: putHeaders
      },
      {
        commandId: 'code-explanation',
        handler: explainCode
      }
    ];
    
    let disposables = commandMappings.map(({ commandId, handler }) =>
      vscode.commands.registerCommand(commandId, handler)
    );
    
    disposables.forEach(disposable => context.subscriptions.push(disposable));  
  });
  context.subscriptions.push(doxigiaCommand);
}

async function doxygenComments() {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return; // No open text editor
		}

		const document = editor.document;
		const selection = editor.selection;

		// Get selected code and strip out whitespace and lower case all tokens
		let code = document.getText(selection);

    const prompt = `Give comments for the code I will provide in a doxygen way. 
    But keep in mind this aspects:
    With all the parameters of the doxygen format, 
    the @brief followed by the explanation of the code, @param followed by the input parameters and their
    explanation in that part of the code, the @return and say if or what it returns. Also if you see fit add commonly 
    used tags include @note, @warning, @see, @example, etc. Use these tags to convey important information, warnings, 
    references to related documentation, or code examples. 
    Don't forget to keep comments concise and focused: Write comments that are clear, concise, and focused on the 
    purpose and functionality of the code element. Avoid unnecessary verbosity or repetition. Maintain consistent 
    formatting: Use consistent formatting and indentation throughout the comments to enhance readability. 
    Remember that good documentation should be informative, clear, and useful to both developers and users of your code. 
    
    The code is the following: ${code}\n`;

    const response = await openaiApiCall(prompt);
		// Prompt user for comment using ChatGPT API
		await promptComment(response);
}

async function inLineComments() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return; // No open text editor
  }

  const document = editor.document;
  const selection = editor.selection;

  // Get selected code and strip out whitespace and lower case all tokens
  let code = document.getText(selection);

  const prompt = `I want you to explain the code I will provide the best way you can with just InLine comments.
  But keep in mind this aspects:
  The comments can be put on top of the line you are explaining.
  Don't forget to keep comments concise and focused: Write comments that are clear, concise, and focused on the 
  purpose and functionality of the code element. Avoid unnecessary verbosity or repetition. Maintain consistent.
  Remember that good documentation should be informative, clear, and useful to both developers and users of your code. 
    
  The code is the following:   ${code}\n`;

  const response = await openaiApiCall(prompt);
  // Prompt user for comment using ChatGPT API
  await promptComment(response);
}

async function putHeaders() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return; // No open text editor
  }

  const document = editor.document;
  const selection = editor.selection;

  // Get selected code and strip out whitespace and lower case all tokens
  let code = document.getText(selection);

  const prompt = `I want you to give me a header for this all code that is in the same file. 
  
  The header needs to be in a format similar to this one:
  
  
  /* ============================================================================
 *  Copyright (C) GMVIS Skysoft S.A., 2018
 * ============================================================================
 *  This file is part of the AIR - ARINC 653 Interface in RTEMS - Operating
 *  system.
 *  The license and distribution terms for this file may be found in the file
 *  LICENSE in this distribution or at http://www.rtems.com/license/LICENSE.
 * ==========================================================================*/
/**
 * @file added my author
 * @author added my author
 * @brief Here I want you to give a brief about all the selected code but keep it concise and focused.
 * Write comments that are clear, concise, and focused on the purpose and functionality of the code element.
 * Avoid unnecessary verbosity or repetition. Maintain consistent. Remember that good documentation should 
 * be informative, clear, and useful to both developers and users of your code. 
 */

  The code is the following: ${code}\n`;

  const response = await openaiApiCall(prompt);
  // Prompt user for comment using ChatGPT API
  if (editor) {
      const document = editor.document;
      const selection = editor.selection;

      const startPosition = new vscode.Position(selection.start.line, 0);
      const rangeToReplace = new vscode.Range(selection.start, selection.end);

      await editor.edit(editBuilder => {
        editBuilder.insert(startPosition,response);
        editBuilder.delete(rangeToReplace);
        //editBuilder.replace(rangeToReplace, response);
      });
  }
}

async function explainCode() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return; // No open text editor
  }

  const document = editor.document;
  const selection = editor.selection;

  // Get selected code and strip out whitespace and lower case all tokens
  let code = document.getText(selection);

  const prompt = `I want you explain this portion of the code in the way possible. 
  Comment it and put the comments on top of the code I gave you and inside /** */

  Basically I want concise and focused comments. Write comments that are clear, concise, and focused 
  on the purpose and functionality of the code element. Avoid unnecessary verbosity or repetition. Maintain
  consistent. Remember that good documentation should be informative, clear, and useful to both developers and
  users of your code. 

  So the comments should be

  /** 
   * comments
   * /
  code
  
  The code is the following: ${code}\n`;

  const response = await openaiApiCall(prompt);
  // Prompt user for comment using ChatGPT API
  await promptComment(response);
}

async function promptComment(response: string ){
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const document = editor.document;
      const selection = editor.selection;

      const startPosition = new vscode.Position(selection.start.line, 0);
      const rangeToReplace = new vscode.Range(selection.start, selection.end);

      await editor.edit(editBuilder => {
        editBuilder.insert(startPosition,response);
        editBuilder.delete(rangeToReplace);
        //editBuilder.replace(rangeToReplace, response);
      });
    }
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
    return comment;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
