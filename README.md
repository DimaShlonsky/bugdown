# bugdown

Utility for automating managing BugUp bugs using WebDriver. Uses Chrome to navigate to the given bug on the BugUp site and fill in resolution details as provided

# Install

```
$ npm install -g git+https://github.com/DimaShlonsky/bugdown.git
```

# Help
```
$ bugdown --help 
```

# Hooking to Tortoise Svn

In TortoiseSvn's settings, add a new Hook script like this:

![Alt](http://i.imgur.com/QQiAQAd.png "Hook type='Post-Commit hook', Working copy path='C:\\svn-sources\\working-copy', Command LIne to Execute='cmd.exe /c bugdown resolveBug --bySvn -l JohnDoe -p \"s3cr3tPwd\"'")

This will look for the bug number in the commit message (denoted by "#") and run bugdown to fill the following fileds of that bug: 

* Status = Resolved
* Reason = Bug fixed
* Assign to = _\<the person who opened the bug\>_ 
* Fixed by = _\<your login name\>_
* Resolution = _\<the commit message\>_
* Fixed in Build = Rev _\<the commit revision number\>_

For example, if you have a bug #12345 opend by "QA person 1" and you configured as shown above and then committed revision 100 with message `"Did stuff to resolve #12345"` it will open the bug #12345, it will fill:

* Status = Resolved
* Reason = Bug fixed
* Assign to = QA person 1
* Fixed by = JohnDoe
* Resolution = Did stuff to resolve #12345
* Fixed in Build = Rev 100

All you will have to do then is click the "Save" button. 

