#! node

var bugdown = require('./bugdown');
var meow = require('meow');
var fs = require('fs');

var cli = meow(`
Usage

$ bugdown resolveBug --bugNumber|-n <bug number> --resolutionMessage|-m <resolution message> --resolvedInRevision|-r <resolution revision> <params> [options]
OR
$ bugdown resolveBug --bySvn [options] <path> <depth> <messagefile> <revision> <error> <cwd>

Where <params> are:
--loginName|-l  The login name to the BugUp site
--passwrod|-p   The password to the BugUp site

And options are:
--webdriverServer|-s    The URL of the WebDriver server (defult is http://localhost:4444/wd/hub)
--bugupUrl|b            The base URL of the bugup site (default is http://mobile.toptix-online.com:8080/InformUP)


`, {
        alias: {
            n: 'bugNumber',
            m: 'resolutionMessage',
            r: 'resolvedInRevision',
            l: 'loginName',
            p: 'passwrod',
            s: 'webdriverServer',
            b: 'bugupUrl'
        },
        boolean: ['bySvn']
    });

if (cli.input[0] == "resolveBug") {
    var resolutionText,
        bugN,
        resolvedInRev;

    if (cli.flags.bySvn) {
        //PATH DEPTH MESSAGEFILE REVISION ERROR CWD
        var messageFile = cli.input[3];
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

    var loginName = cli.flags.l;
    var password = cli.flags.p;

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

