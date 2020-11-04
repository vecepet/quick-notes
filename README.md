# Outlook Mail Tasks for Drafts (aka QuickNotes)

## What is QuickNotes?

Use Drafts to quickly note down tasks and notes. And if you do a task quickly, mark it done. Do you want to clean up
 the draft and receive any pending tasks per mail? Invoke **QuickNotes** action.

**QuickNotes** is a Drafts action which:

1. parses current draft looking for tasks and notes
2. sends each pending task individually per mail, e.g., to allow **Outlook** users to flag them as a task
3. archives current draft by appending it into the monthly **QuickNotes** archive draft
4. optionally moves current draft to trash

To learn more about Drafts visit https://docs.getdrafts.com.

## QuickNotes Input Formatting

**QuickNotes** action processes current draft. It recognizes the following elements:
- *draft title*
- *task* - a task can be pending or done
- *note*

### Draft Title
A *draft title* is the first line of a draft, in case the line starts with `#`. A draft can be with or without a *draft
 title*.
 
A draft having *draft title* starting with `# QuickNotes` is a *QuickNotes draft* and it has special processing.

### Task

A *task* starts with a *task subject* - a line starting with
- `- [ ]` or `[ ]` in case of a pending task or
- `- [x]` or `[x]` in case of a done task

A *task* ends if
- next line is empty or
- next line is a start of another task.

A *task* can have a *task body* - one or more task comment lines. A *task* can be with or without a *task body*.

### Note
A *note* consist of subsequent non-empty lines, which are not part of any *task*.

### Example Draft

    have met Martin
    
    - [ ] buy cola
    preferably sugar free
    
    [ ] buy potatoes
    - organic please
    - not imported
    [x] buy newspaper
    English or German
    - [ ] call John
    - [x] call mother

    watched a good movie
    - The Shawshank Redemption   

## QuickNotes Processing

**QuickNotes** action processes current draft. The processing consists of three steps:
- mailing pending tasks
- archiving current draft
- optionally moving current draft to trash

### Mailing Pending Tasks

Processing the example draft above will cause 3 mails to be sent, each containing one pending task.

Note that the task prefix `- [ ]` or `[ ]` will be removed.

**Mail 1**

    Subject: buy cola
    
             preferably sugar free

**Mail 2**

    Subject: buy potatoes
    
             - organic please
             - not imported

**Mail 3**

    Subject: call John
    
             -
    
See also [Configuring QuickNotes Processing] below.

Note, **QuickNotes** action uses `Send in background` option. It is used to send the email via web service without the
 requirement of opening a preview of the message. Because these messages come “From” a generic address, it’s best for
  action which email to your own email address as a reminder, or similar.

### Archiving Current Draft

**QuickNotes** action creates one archive draft per month. This archive draft is located in the Archive and it has draft
 title `# QuickNotes YYYY/MM`. All drafts processed within the month will be appended into it. 

Prefix of the pending tasks `[ ]` will be modified to `[>]`, signalling that the task was forwarded.

Processing the example draft above will append the following text to the archive draft, with the header containing
 current timestamp.

    # QuickNotes 2020/11
    
    ## QuickNotes - 2020/11/02 22:32:14

    have met Martin
    
    - [>] buy cola             
    preferably sugar free      
                               
    [>] buy potatoes           
    - organic please           
    - not imported             
    [x] buy newspaper          
    English or German          
    - [>] call John            
    - [x] call mother          
                               
    watched a good movie       
    - The Shawshank Redemption 

### Moving Current Draft to Trash

As the last step, the processed draft will usually be moved to trash. There are three options:

- A *QuickNotes draft* will be processed and moved to trash, and afterwards a new *QuickNotes draft* will be created.
 
- Any draft without a *draft title* will be processed and moved to trash, and afterwards a new blank draft will be
 created.

- Any draft with a *draft title* will be processed, but not moved to trash.

### Configuring QuickNotes Processing

When running **QuickNotes** action for the first time, the user must enter a mail address to receive pending tasks per
 mail. This information is stored using Credential object. See https://scripting.getdrafts.com/classes/credential.

