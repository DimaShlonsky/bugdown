/*
post_commit_hook
node "C:\Users\Dima\Dev\other\bugbot\bugbot\app.js" --svn
true
show
enforce
*/

var serverUrl = 'http://localhost:4444/wd/hub',
    baseURL = "http://mobile.toptix-online.com:8080/InformUP",
    loginName = "Dima",
    password = "",
    bugN,
    bugUrl,
    sessionId = "b01fc05b-6dc9-4530-a381-9b3c2d854c4c",
    resolutionText,
    resolvedInRev,
    resolvedInText;

//var Q=require('q');
    
if (process.argv[2]=="--svn"){
    //PATH DEPTH MESSAGEFILE REVISION ERROR CWD
    var messageFile = process.argv[5],
        resolvedInRev = process.argv[6];

    var fs = require('fs');
    var content = fs.readFileSync(messageFile);
    resolutionText = content.toString();
    var regex = /^(?:.(?!Integration|build))*#(\d{2,})/;
    var match = regex.exec(resolutionText);
    if (match!=null){
        bugN = match[1];    
    }else{
        process.exit(0);
    }
    
}else{
    bugN = process.argv[2],
    resolutionText = process.argv[3];
    resolvedInRev = process.argv[4];
}
    
resolvedInText = "Rev. " + resolvedInRev;
bugUrl = baseURL + "/Form/Form.aspx?ItemType=ExistingItem&Item=" + bugN;

require('chromedriver'); 
var webdriver = require('selenium-webdriver'),
    until = webdriver.until,
    By = webdriver.By,
    browser;

/*
browser = new webdriver.Builder()
        .usingServer(serverUrl)
        .forBrowser('chrome')
        .build();
*/

attachToSession(sessionId).then(function(attachedBrowser){
    browser = attachedBrowser;

    browser.get(bugUrl).then(function(){
        return browser.getCurrentUrl();
    })
    .then(function(url){
        /*
        if (url.indexOf="/login.aspx"){
            return login()
                .then(function(){
                    return browser.get(bugUrl);
                });
        }else{
            return;   
        }*/
    })
    .then(function(){
        browser
            .findElement(By.css("#_ctl0_Status option[value=Resolved]"))
            .then(function(e){
                e.click();
            });
        browser
            .findElement(By.css("#_ctl0_Reason option[value='Bug fixed']"))
            .then(function(e){
                e.click();
            });
        browser.findElement(By.css("#_ctl0_CreatedBy option[selected]"))
            .getText()
            .then(function(text){
                //console.log(text);
                return browser
                    .findElement(By.css("#_ctl0_AssignTo option[value='" + text.trim() + "']"))
                    .then(function(e){
                        e.click();
                    });
            });
        browser.findElement(By.css("a[href='#tab_2']")).then(function(e){
            e.click();
        });
        browser
            .wait(until.elementLocated(By.css("#tab_2")))
            .then(function(e){
                return browser
                    .wait(until.elementIsVisible(e));
            });
        
        
        browser
            .findElement(By.css("#_ctl2_FixedBy option[value='" + loginName + "']"))
            .then(function(e){
                e.click();
            });
        browser.switchTo().frame(browser.findElement(By.css("#_ctl2_HowToTest_FCKeditor1___Frame")))
            .then(function(){
                 return browser.switchTo().frame(browser.findElement(By.css("#xEditingArea iframe")));
            })
            .then(function(){
                return browser.findElement(By.css("body")).sendKeys(resolutionText);
            })
            .then(function(){
                browser.switchTo().defaultContent();
            });

        browser
            .findElement(By.css("#_ctl2_FixedInBuild"))
            .sendKeys(resolvedInText);

        browser.
            findElement(By.css("#LinkButtonApply")).then(function(e){
                //browser.actions().moveToElement(e).perform();
            }).then(function(){
                process.exit(0);
            });

    });
});

function login(){
    browser.findElement(By.css("#Login_name")).sendKeys(loginName)
    browser.findElement(By.css("#Login_password")).sendKeys(password);
    return browser.findElement(By.css("#ButtonLogin")).click();
}

function attachToSession(sessionId){
    var wdHttp = require('selenium-webdriver/http');
    var executor = new wdHttp.Executor(new wdHttp.HttpClient(serverUrl));
    var browser = webdriver.WebDriver.attachToSession(executor, sessionId);
    return browser.getCurrentUrl().then(function () {
        return browser;
    });
}