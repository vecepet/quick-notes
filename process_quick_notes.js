/* *********************************************************************

    Initialize QuickNotes settings variables

********************************************************************* */

// get mail recipient to receive notes and pending tasks
// using Credential object https://scripting.getdrafts.com/classes/credential
const credential = Credential.create("QuickNotes Mail Address", " Enter a mail address to receive pending tasks");
credential.addTextField("recipientMail", "QuickNotes Recipient Mail Address");
credential.authorize();

// create QuickNotes title
const quickNotesTitle = "# QuickNotes"
// create tag to be assigned to quick notes drafts
const quickNotesTag = "quick-notes";

/* *********************************************************************

    QuickNotes processing classes and functions

********************************************************************* */

// class to create current date and time strings
class DateTimeString {
    constructor() {
        this._now = new Date();
    }

    _pad2(n) {
        return n < 10 ? '0' + n : n
    }

    get ym() {
        return this._now.getFullYear().toString() + "/"
            + this._pad2(this._now.getMonth() + 1)
    }

    get ymd() {
        return this.ym + "/"
            + this._pad2(this._now.getDate())
    }

    get ymdHM() {
        return this.ymd + " "
            + this._pad2(this._now.getHours()) + ":"
            + this._pad2(this._now.getMinutes())
    }

    get ymdHMS() {
        return this.ymdHM + ":"
            + this._pad2(this._now.getSeconds())
    }
}

// class to collect all notes and tasks
class QuickNotesCollection {
    constructor() {
        // initialize property to distinguish "note" mode, "task-done" mode and "task-pending" mode
        this._mode = "";
        // initialize property to collect all lines of the current note
        this._currentNote = "";
        // initialize property to collect all lines of the current task
        this._currentTask = "";
        // initialize property to collect all notes - CURRENTLY NOT USED AFTER PARSING
        this._notes = "";
        // initialize property to collect all pending tasks
        this._tasksPending = Array();
        // initialize property to collect all done tasks - CURRENTLY NOT USED AFTER PARSING
        this._tasksDone = Array();
        // initialize property to collect all lines of the archive entry
        this._archiveEntry = "";
    }

    // method to add line to current item (note or task)
    addLine(line) {
        switch (this._mode) {
            case "note":
                this._currentNote += line.trim() + "\n";
                break;
            case "task-pending":
            case "task-done":
                this._currentTask += line.trim() + "\n";
                break;
        }
    }

    //method to add line to archive entry
    addLineArchive(line) {
        this._archiveEntry += line.trim() + "\n";
    }

    // method to push current item (note or task)
    push() {
        switch (this._mode) {
            case "note":
                // add '_currentNote' to '_notes' and empty '_currentNote'
                if (this._currentNote !== "") {
                    this._notes += this._currentNote + "\n";
                    this._currentNote = "";
                }
                break;
            case "task-pending":
                // add '_currentTask' to '_tasksPending' and empty '_currentTask'
                if (this._currentTask !== "") {
                    this._tasksPending.push(this._currentTask);
                    this._currentTask = "";
                }
                break;
            case "task-done":
                // add '_currentTask' to '_tasksDone' and empty '_currentTask'
                if (this._currentTask !== "") {
                    this._tasksDone.push(this._currentTask);
                    this._currentTask = "";
                }
                break;
        }
    }

    // setter to set _mode
    set mode(modeId) {
        this._mode = modeId;
    }

    // getter to get all notes
    get notes() {
        return this._notes.trim();
    }

    // getter to get all pending tasks
    get tasksPending() {
        return this._tasksPending;
    }

    // getter to get all done tasks
    get tasksDone() {
        return this._tasksDone;
    }

    // getter to get archive entry
    get archiveEntry() {
        return this._archiveEntry.trim();
    }
}

// function to find or create draft starting with 'queryString'
function get_draft(queryString, filter) {
    // query for drafts
    let drafts = Draft.query(queryString, filter, [quickNotesTag], [], "modified", true);
    // loop over found drafts looking for a matching draft
    let d;
    for (let draft of drafts) {
        if (draft.content.startsWith(queryString)) {
            d = draft;
        }
    }
    // if we didn't find the draft, create it
    if (!d) {
        d = Draft.create();
        d.content = queryString;
        d.addTag(quickNotesTag);
        if (filter === "archive") d.isArchived = true;
    }
    // add one empty line
    d.content = d.content.trim() + "\n\n";
    d.update();
    return d;
}

// function to mail a single task
function mail_task(task) {
    let mail = Mail.create();
    mail.toRecipients = [credential.getValue("recipientMail")];
    mail.sendInBackground = true;

    // get lines
    let lines = task.trim().split("\n");
    // first line is the actual task - use as mail subject
    mail.subject = lines[0];

    // get task comments - use as mail body
    if (lines.length > 1) {
        lines.shift();
        mail.body = lines.join("\n");
    } else {
        mail.body = "-";
    }

    // send mail
    let success = mail.send();
    if (!success) {
        console.log(mail.status);
        context.fail();
    }
}

/* *********************************************************************

    Initialize QuickNotes other variables

********************************************************************* */

// create current date and time strings
const now = new DateTimeString;
// create quick notes collection
let quickNotes = new QuickNotesCollection();

/* *********************************************************************

    Process current draft

********************************************************************* */

// get current draft
const currentDraft = draft;

// get current draft's content
const currentContent = currentDraft.content.trim();

// split draft to loop over paragraphs
let paragraphs = currentContent.split("\n\n");

// loop over paragraphs
for (let paragraph of paragraphs) {
    // skip QuickNotes title
    if (paragraph === quickNotesTitle) continue;
    // always assume a paragraph is a note
    quickNotes.mode = "note";
    // split each paragraph to loop over lines
    let lines = paragraph.split("\n");
    for (let line of lines) {
        // check if a new task starts on the current line
        if (line.startsWith("[ ]") || line.startsWith("- [ ]")) {
            // current line is a pending task, push previous task and change mode
            quickNotes.push();
            quickNotes.mode = "task-pending";
            // adding to task array without task prefix
            quickNotes.addLine(line.replace(/^(- |)\[[ x]]/, ""))
            quickNotes.addLineArchive(line.replace("[ ]", "[>]"));
        } else if (line.startsWith("[x]") || line.startsWith("- [x]")) {
            // current line is a done task, push previous task and change mode
            quickNotes.push();
            quickNotes.mode = "task-done";
             // adding to task array without task prefix
           quickNotes.addLine(line.replace(/^(- |)\[[ x]]/, ""));
            quickNotes.addLineArchive(line);
        } else {
            // current line still belongs to the current item
            quickNotes.addLine(line);
            // add current line to archive
            if (line.startsWith("#")) {
                // current line is a header line - in archive we will replace '#' at the beginning with '*** #'
                quickNotes.addLineArchive(line.replace("#", "*** #"));
            } else {
                // current line is not a header line
                quickNotes.addLineArchive(line);
            }
        }
    }
    // add empty line to archive
    quickNotes.addLineArchive("");
    // before processing next paragraph push current task
    quickNotes.push();
    // before processing next paragraph push current note
    quickNotes.mode = "note";
    quickNotes.push();
}

/* *********************************************************************

    Archive content of the current draft and mail pending tasks

********************************************************************* */

// get QuickNotes archive draft for the current month
let archivedQuickNotes = get_draft(quickNotesTitle + " " + now.ym, "archive")

// if archiveEntry is not empty, update archived QuickNotes draft
if (quickNotes.archiveEntry.length !== 0) {
    archivedQuickNotes.content += "## QuickNotes - " + now.ymdHMS + "\n\n";
    archivedQuickNotes.content += quickNotes.archiveEntry + "\n\n";
    archivedQuickNotes.update();
}

// mail pending tasks one by one, if any
if (quickNotes.tasksPending.length !== 0) {
    for (let task of quickNotes.tasksPending) {
        mail_task(task);
    }
}

/* *********************************************************************

    Trash and Open QuickNotes

********************************************************************* */

if ((currentContent.startsWith(quickNotesTitle)) && (currentContent !== quickNotesTitle)) {
    // if current draft is QuickNotes and it is not empty, move it to trash
    currentDraft.isTrashed = true;
    currentDraft.update();

    // get new empty QuickNotes draft
    let quickNotes = get_draft(quickNotesTitle, "inbox")

    // open it in the editor and go to the end
    editor.activate();
    editor.load(quickNotes);
    editor.setSelectedRange(quickNotes.content.length, 0);
} else if (!currentContent.startsWith("#") && currentContent !== "") {
    // if current draft does not start with heading and it is not empty, move it to trash
    currentDraft.isTrashed = true;
    currentDraft.update();
    // activate editor and create a new blank draft
    editor.activate();
    editor.new();
} else {
    // if current draft starts with heading or it is empty, show editor to hide actions
    editor.activate();
    editor.deactivate();
}
