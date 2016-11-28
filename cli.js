var bugdown = require('./bugdown');
var meow = require('meow');

var cli = meow(`
Usage

$ bugbot resolve --bugNumber|-n <bug number> --resolutionMessage|-m <resolution message> --resolvedInRevision|-r <resolution revision> <params> [options]
OR
$ bugbot resolve --bySvn [options] <path> <depth> <messagefile> <revision> <error> <cwd>
OR
$ bugbot resolve svn-hook <working copy dir> <params> [options]

Where <params> are:
--loginName|-l  The login name to the BugUp site
--passwrod|-p   The password to the BugUp site

And options are:
--webdriverServer|-s    The URL of the WebDriver server (defult is http://localhost:4444/wd/hub)
--bugupUrl|b            The base URL of the bugup site (default is http://mobile.toptix-online.com:8080/InformUP)

EXAMPLES:
Hooking bugbot to run after commit on your working copy, run:
$bugbot svn-hook c:\srodev\my-working-copy --loginName JohnD --password 12345

`, {
        alias: {
            n: 'bugNumber',
            m: 'resolutionMessage',
            r: 'resolvedInRevision',
            l: 'loginName',
            p: 'passwrod',
            s: 'webdriverServer',
            b: 'bugupUrl'
        }
    });

if (cli.input[0] == "resolveBug") {
    if ("bySvn" in cli.flags) {
        //PATH DEPTH MESSAGEFILE REVISION ERROR CWD
        var messageFile = cli.input[3],
            resolvedInRev = cli.input[4];

        var content = fs.readFileSync(messageFile);
        resolutionText = content.toString();
        var regex = /^(?:.(?!Integration|build))*#(\d{2,})/;
        var match = regex.exec(resolutionText);
        if (match != null) {
            bugN = match[1];
        } else {
            //commit message does not contain bug number, exiting
            process.exit(0);
        }
    } else {
        bugN = cli.flags.n;
        resolutionText = cli.flags.m;
        resolvedInRev = cli.flags.r;
    }

    loginName = cli.flags.l;
    password = cli.flags.p;

    if (bugN == undefined ||
        resolutionText == undefined ||
        resolvedInRev == undefined ||
        loginName == undefined ||
        password == undefined) {
        cli.showHelp();
    }

    bugdown.resolveBug(bugN, resolvedInRev, resolutionText, loginName, password, cli.flags);
} else {
    cli.showHelp();
}

