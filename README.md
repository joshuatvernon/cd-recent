# cd-recent

A tool for listing and changing directory to a recently visited directory in a UNIX terminal

Install `cd-recent` globally to run anytime to find out what the most recent directories you've visited are:
```
npm i cd-extra -g
```

Then easily set the full path to history file:
```
cd-recent -H /Users/johndoe/.history
```

Then simply run `cd-extra` to see the most recently visited directories
```
cd-extra
```

You can also set a limit for how many recent directories to list
```
cd-recent -l 10
```

You can also set a default number of recent directories to list
```
cd-recent -d 15
```
