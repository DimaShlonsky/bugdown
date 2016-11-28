"use strict";

/*
post_commit_hook
node "C:\Users\Dima\Dev\other\bugbot\bugbot\app.js" --svn
true
show
enforce
*/

exports.resolveBug = function (bugN, resolvedInRev, resolutionText, loginName, password, options) {
    var path = require('path'),
        fs = require('fs'),
        Q = require('q'),
        Url = require('url'),
        Get = require('simple-get');

    var serverUrl,
        baseURL,
        bugUrl,
        resolvedInText,
        wdSidFileName = path.resolve(__dirname + '/wd-sid.tmp');

    if (options == undefined) {
        options = {};
    }

    baseURL = options.bugupUrl || "http://mobile.toptix-online.com:8080/InformUP";
    resolvedInText = "Rev. " + resolvedInRev;
    bugUrl = baseURL + "/Form/Form.aspx?ItemType=ExistingItem&Item=" + bugN;
    serverUrl = options.webdriverServer || 'http://localhost:4444/wd/hub';


    require('chromedriver');
    var webdriver = require('selenium-webdriver'),
        until = webdriver.until,
        By = webdriver.By,
        browser;

    var builder = new webdriver.Builder()
        .forBrowser('chrome');

    function setCookies() {
        getSessionCookies().catch(function (err) { //no existing cookies found, try to restore from file
            console.info("current browser doesn't have the cookies, trying to restore them");
            return getStoredCookies()
                .then(function (cookies) {
                    return browser.get(baseURL + "/nosuch-dummy").then(function () {
                        var options = browser.manage();
                        var promise, cookie;
                        for (cookie in cookies) {
                            let p2 = options.addCookie({ name: cookie, value: cookies[cookie], domain: "mobile.toptix-online.com", path: "/", httpOnly: true });
                            if (promise == undefined) {
                                promise = p2;
                            } else {
                                promise = promise.then(function () { return p2 });
                            }
                        }
                        return promise;
                    }).catch(function (err) {
                        console.log(err);
                    });
                },
                function () {
                    console.info('No stored cookies found');
                    return login();
                });
        });
    }

    Q.Promise(function (resolve, reject) {
        Get.concat({ url: serverUrl }, function (err, res, data) {
            if (err == null) {
                attachToWdSession().then(function (browser) {
                    resolve(browser);
                }, function (err) {
                    let browser = builder
                        .usingServer(serverUrl)
                        .build();
                    saveWdSessionId(browser);
                    resolve(browser);
                });
            } else {
                let browser = builder
                    .build();
                console.info("New stand-alone browser: " + builder.getServerUrl());
                resolve(browser);
            }
        });
    }).then(function (builtBrowser) {
        browser = builtBrowser;
        return setCookies();
    }).then(function (attachedBrowser) {
        //browser = attachedBrowser;

        browser.get(bugUrl).then(function () {
            return browser.getCurrentUrl();
        })
            .then(function (url) {
                let pathname = Url.parse(url).pathname.toLowerCase();
                if (pathname.endsWith("/login.aspx") || pathname.endsWith("errorSession.htm")) {
                    return login()
                        .then(function () {
                            return browser.get(bugUrl);
                        });
                } else {
                    return;
                }
            })
            .then(function () {
                return getSessionCookies().then(function (cookies) {
                    return saveCookies(cookies);
                });
            })
            .then(function () {
                browser
                    .findElement(By.css("#_ctl0_Status option[value=Resolved]"))
                    .then(function (e) {
                        e.click();
                    });
                browser
                    .findElement(By.css("#_ctl0_Reason option[value='Bug fixed']"))
                    .then(function (e) {
                        e.click();
                    });
                browser.findElement(By.css("#_ctl0_CreatedBy option[selected]"))
                    .getText()
                    .then(function (text) {
                        //console.log(text);
                        return browser
                            .findElement(By.css("#_ctl0_AssignTo option[value='" + text.trim() + "']"))
                            .then(function (e) {
                                e.click();
                            });
                    });
                browser.findElement(By.css("a[href='#tab_2']")).then(function (e) {
                    e.click();
                });
                browser
                    .wait(until.elementLocated(By.css("#tab_2")))
                    .then(function (e) {
                        return browser
                            .wait(until.elementIsVisible(e));
                    });


                browser
                    .findElement(By.css("#_ctl2_FixedBy option[value='" + loginName + "']"))
                    .then(function (e) {
                        e.click();
                    });
                browser.switchTo().frame(browser.findElement(By.css("#_ctl2_HowToTest_FCKeditor1___Frame")))
                    .then(function () {
                        return browser.switchTo().frame(browser.findElement(By.css("#xEditingArea iframe")));
                    })
                    .then(function () {
                        return browser.findElement(By.css("body")).sendKeys(resolutionText);
                    })
                    .then(function () {
                        browser.switchTo().defaultContent();
                    });

                browser
                    .findElement(By.css("#_ctl2_FixedInBuild"))
                    .sendKeys(resolvedInText);

                browser.
                    findElement(By.css("#LinkButtonApply")).then(function (e) {
                        //browser.actions().moveToElement(e).perform();
                    }).then(function () {
                        process.exit(0);
                    });

            });
    })
        .catch(function (err) {
            //return browser.quit().then(function () {
            console.error(err);
            process.exit(1);
            //throw err;
            //});
        });

    function getSessionCookies() {
        var cookies = {}, manage = browser.manage();
        return manage.getCookie("ASP.NET_SessionId").then(function (cookie) {
            cookies[cookie.name] = cookie.value;
            return manage.getCookie(".ASPXFORMSAUTH");
        }).then(function (cookie) {
            cookies[cookie.name] = cookie.value;
        }).then(function () {
            return cookies;
        });
    }

    function getStoredCookies() {
        return Q.Promise(function (resolve, reject) {
            var filename = path.resolve(__dirname + '/cookies.tmp');
            fs.readFile(filename, function (err, data) {
                //var sessionId;
                if (!err) {
                    resolve(JSON.parse(data.toString()));
                } else {
                    console.warn("Could not read from %s", filename);
                    reject(err);
                }
            });
        });
    }

    function saveCookies(cookies) {
        return Q.Promise(function (resolve, reject) {
            var filename = path.resolve(__dirname + '/cookies.tmp');
            fs.writeFile(filename, JSON.stringify(cookies), function (err, data) {
                //var sessionId;
                if (!err) {
                    resolve();
                } else {
                    console.warn("Could not write to %s", filename);
                    reject(err);
                }
            });
        });
    }

    function login() {
        return browser.getCurrentUrl().then(function (url) {
            url = Url.parse(url);
            if (!url.pathname.toLowerCase().endsWith("login.aspx")) {
                var loginUrl = baseURL + "/Login.aspx"; //+"?ReturnUrl=" + encodeURIComponent(Url.parse(bugUrl).path);
                return browser.get(loginUrl);
            }
        }).then(function () {
            browser.findElement(By.css("#Login_name")).sendKeys(loginName)
            browser.findElement(By.css("#Login_password")).sendKeys(password);
            return browser.findElement(By.css("#ButtonLogin")).click();
        });
    }

    function attachToWdSession() {
        return Q.Promise(function (resolve, reject) {
            fs.readFile(wdSidFileName, function (err, data) {
                var sessionId;
                if (!err) {
                    resolve(data.toString());
                } else {
                    console.info("Could not read from %s", wdSidFileName);
                    reject(err);
                }
            });
        }).then(function (sessionId) {
            var wdHttp = require('selenium-webdriver/http');
            var executor = new wdHttp.Executor(new wdHttp.HttpClient(serverUrl));
            var browser = webdriver.WebDriver.attachToSession(executor, sessionId);
            return browser.getCurrentUrl().then(function () {
                return browser;
            });
        });
    }

    function saveWdSessionId(browser) {
        return browser.getSession().then(function (session) {
            var sid = session.getId();
            return new Q.Promise(function (resolve, reject) {
                fs.writeFile(wdSidFileName, sid, { flags: 'w' }, function (err) {
                    var sessionId;
                    if (!!err) {
                        console.warn("Could not write to %s", wdSidFileName);
                    }
                    resolve();
                });
            })
        });
    }

    //function getCookie(browser, cookieName) {
    //    return browser.manage().getCookie(cookieName)
    //        .then(function (cookie) {
    //            return cookie.value;
    //        });
    //}
}