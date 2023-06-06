const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const moment = require('moment');

function createDirectoryIfNotExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
	fs.mkdirSync(dirPath, { recursive: true });
  }
}
function getDayOfWeek(date) {
	return moment(date).format("D");
  }
function getWeekInterval(date) {
	const startDate = moment(date).startOf("isoWeek");
	const endDate = moment(date).endOf("isoWeek");
	return `${getDayOfWeek(startDate)} - ${getDayOfWeek(endDate)}`;
}
function getCurrentDate() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const monthIndex = currentDate.getMonth();
  const day = currentDate.getDate().toString().padStart(2, "0");
  const week = getWeekInterval(currentDate);
  return { year, month,monthIndex, day, week };
}
function getMonthName(monthIndex) {
	const monthNames = [
	  "Janvier",
	  "Février",
	  "Mars",
	  "Avril",
	  "Mai",
	  "Juin",
	  "Juillet",
	  "Août",
	  "Septembre",
	  "Octobre",
	  "Novembre",
	  "Décembre"
	];
	return monthNames[monthIndex];
  }
  

function activate(context) {
  let disposable = vscode.commands.registerCommand(
	"extension.showCodePopup",
	() => {
	  const editor = vscode.window.activeTextEditor;
	  if (editor) {
		const selection = editor.selection;
		const code = editor.document.getText(selection);
		const filePath = editor.document.fileName;

		const fileLink = vscode.Uri.file(filePath)
		  .with({ scheme: "vscode" })
		  .toString();

		vscode.window
		  .showInputBox({ prompt: "Description du code" })
		  .then((description) => {
			if (description) {
			  const markdown = `[File: ${filePath}](${fileLink})\n\n${description}\n\n\`\`\`javascript\n${code}\n\`\`\`\n\n---\n`;
			  const rootPath = vscode.workspace.rootPath;
			  if (rootPath) {
				const currentDate = getCurrentDate();
				const { year, month,monthIndex, day, week } = currentDate;
				const codeReporterDir = path.join(rootPath, "code-reporter");
				createDirectoryIfNotExists(codeReporterDir);
				const yearDir = path.join(codeReporterDir, year.toString());
				createDirectoryIfNotExists(yearDir);
				const monthDir = path.join(yearDir, getMonthName(monthIndex));

				createDirectoryIfNotExists(monthDir);
				const weekDir = path.join(monthDir, `${week}`);
				createDirectoryIfNotExists(weekDir);
				const dayDir = path.join(weekDir, day.toString());
				createDirectoryIfNotExists(dayDir);

				const reportFileName = `code-report-${year}${month}${day}.md`;
				const reportFilePath = path.join(dayDir, reportFileName);

				const tasks = `
				## Liste des tâches

				- [ ] Tâche 1 : ....
				  - **Pourquoi ne pas encore fini ?** : .....
				- [x] Tâche 2 : .....
				`;
				
				const tasksFileName = `tasks-report-${year}${month}${day}.md`;
				const tasksFilePath = path.join(dayDir, tasksFileName);

				var existingContent = "";
				if (fs.existsSync(reportFilePath)) {
				  existingContent = fs.readFileSync(reportFilePath, "utf-8");

				  fs.writeFileSync(reportFilePath, markdown + existingContent);
				} else {
				  fs.writeFileSync(reportFilePath, markdown);
				 
				}
				if (!fs.existsSync(tasksFilePath)) {
					fs.writeFileSync(tasksFilePath, tasks);
				}

				vscode.window.showInformationMessage(
				  `Le rapport de code a été enregistré dans : ${reportFilePath}`
				);
			  }
			}
		  });
	  }
	}
  );
  context.subscriptions.push(
	vscode.commands.registerCommand("extension.activateContextMenu", () => {
	  vscode.commands.executeCommand(
		"setContext",
		"codeReporter:showContextMenu",
		true
	  );
	})
  );
  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
