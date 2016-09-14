var md5 = require('./hmac_md5');
var request = require('then-request');
var DOMParser = require('xmldom').DOMParser;
var fs = require("fs");
var AES = require('./AES');

var CONST_XMLNS = "http://purenetworks.com/HNAP1/";
var CONST_METHOD = "POST";
var CONST_BODY_ENCODING = "UTF8";
var CONST_LOGIN_METHOD = "Login";

exports.SoapClient = function(password, url) {
    this.password = password;
    this.url = url;
};

exports.login = function(sc) {
    headersSoapAction = '"' + CONST_XMLNS + CONST_LOGIN_METHOD + '"'; 
    bodyContent = requestBody(CONST_LOGIN_METHOD, loginRequest());

    return request(CONST_METHOD, sc.url,
        {
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
                "SOAPAction": headersSoapAction
            },
            body: bodyContent 
        }).then(function (response) {
        
        sc.loginResult = save_login_result(response.getBody(CONST_BODY_ENCODING), sc.password);
        
        sa = soapAction(CONST_LOGIN_METHOD, "LoginResult", requestBody(CONST_LOGIN_METHOD, loginParameters(sc.loginResult)), sc);
        return sa;
    }).catch(function (err) {
        console.log("error:", err);
    });
};
function save_login_result(body, pw) {
    var doc = new DOMParser().parseFromString(body);

    loginResult = new Object();
    loginResult.Result = doc.getElementsByTagName(CONST_LOGIN_METHOD + "Result").item(0).firstChild.nodeValue;
    loginResult.Challenge = doc.getElementsByTagName("Challenge").item(0).firstChild.nodeValue;
    loginResult.PublicKey = doc.getElementsByTagName("PublicKey").item(0).firstChild.nodeValue;
    loginResult.Cookie = doc.getElementsByTagName("Cookie").item(0).firstChild.nodeValue;
    loginResult.PrivateKey = md5.hex_hmac_md5(loginResult.PublicKey + pw, loginResult.Challenge).toUpperCase();
    return loginResult;
}

function requestBody(method, parameters) {
    return "<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
        "<soap:Envelope " +
        "xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" " +
        "xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" " +
        "xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">" +
        "<soap:Body>" +
        "<" + method + " xmlns=\"" + CONST_XMLNS + "\">" +
        parameters +
        "</" + method + ">" +
        "</soap:Body></soap:Envelope>";
}

function moduleParameters(module) {
    return "<ModuleID>" + module + "</ModuleID>";
}

function controlParameters(module, status) {
    return moduleParameters(module) +
        "<NickName>Socket 1</NickName><Description>Socket 1</Description>" +
        "<OPStatus>" + status + "</OPStatus><Controller>1</Controller>";
}

function radioParameters(radio) {
    return "<RadioID>" + radio + "</RadioID>";
}

function soapAction(method, responseElement, body, sc) {
    return request(CONST_METHOD, sc.url,
        {
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
                "SOAPAction": '"' + CONST_XMLNS + method + '"',
                "HNAP_AUTH": getHnapAuth('"' + CONST_XMLNS + method + '"', sc.loginResult.PrivateKey),
                "Cookie": "uid=" + sc.loginResult.Cookie
            },
            body: body
        }).then(function (response) {
        return readResponseValue(response.getBody(CONST_BODY_ENCODING), responseElement);
    }).catch(function (err) {
        console.log("error:", err);
    });
}

exports.on = function (sc) {
    return soapAction("SetSocketSettings", "SetSocketSettingsResult", requestBody("SetSocketSettings", controlParameters(1, true)), sc);
};

exports.off = function (sc) {
    return soapAction("SetSocketSettings", "SetSocketSettingsResult", requestBody("SetSocketSettings", controlParameters(1, false)), sc);
};

exports.state = function (sc) {
    return soapAction("GetSocketSettings", "OPStatus", requestBody("GetSocketSettings", moduleParameters(1)), sc);
};

exports.consumption = function (sc) {
    return soapAction("GetCurrentPowerConsumption", "CurrentConsumption", requestBody("GetCurrentPowerConsumption", moduleParameters(2)), sc);
};

exports.totalConsumption = function (sc) {
    return soapAction("GetPMWarningThreshold", "TotalConsumption", requestBody("GetPMWarningThreshold", moduleParameters(2)), sc);
};

exports.temperature = function (sc) {
    return soapAction("GetCurrentTemperature", "CurrentTemperature", requestBody("GetCurrentTemperature", moduleParameters(3)), sc);
};

exports.getAPClientSettings = function (sc) {
    return soapAction("GetAPClientSettings", "GetAPClientSettingsResult", requestBody("GetAPClientSettings", radioParameters("RADIO_2.4GHz")), sc);
};

exports.setPowerWarning = function (sc) {
    return soapAction("SetPMWarningThreshold", "SetPMWarningThresholdResult", requestBody("SetPMWarningThreshold", powerWarningParameters()), sc);
};

exports.getPowerWarning = function (sc) {
    return soapAction("GetPMWarningThreshold", "GetPMWarningThresholdResult", requestBody("GetPMWarningThreshold", moduleParameters(2)), sc);
};

exports.getTemperatureSettings = function (sc) {
    return soapAction("GetTempMonitorSettings", "GetTempMonitorSettingsResult", requestBody("GetTempMonitorSettings", moduleParameters(3)), sc);
};

exports.setTemperatureSettings = function (sc) {
    return soapAction("SetTempMonitorSettings", "SetTempMonitorSettingsResult", requestBody("SetTempMonitorSettings", temperatureSettingsParameters(3)), sc);
};

exports.getSiteSurvey = function (sc) {
    return soapAction("GetSiteSurvey", "GetSiteSurveyResult", requestBody("GetSiteSurvey", radioParameters("RADIO_2.4GHz")), sc);
};

exports.triggerWirelessSiteSurvey = function (sc) {
    return soapAction("SetTriggerWirelessSiteSurvey", "SetTriggerWirelessSiteSurveyResult", requestBody("SetTriggerWirelessSiteSurvey", radioParameters("RADIO_2.4GHz")), sc);
};

exports.latestDetection = function (sc) {
    return soapAction("GetLatestDetection", "GetLatestDetectionResult", requestBody("GetLatestDetection", moduleParameters(2)), sc);
};

exports.reboot = function (sc) {
    return soapAction("Reboot", "RebootResult", requestBody("Reboot", ""), sc);
};

exports.isDeviceReady = function (sc) {
    return soapAction("IsDeviceReady", "IsDeviceReadyResult", requestBody("IsDeviceReady", ""), sc);
};

exports.getModuleSchedule = function (sc) {
    return soapAction("GetModuleSchedule", "GetModuleScheduleResult", requestBody("GetModuleSchedule", moduleParameters(0)), sc);
};

exports.getModuleEnabled = function (sc) {
    return soapAction("GetModuleEnabled", "GetModuleEnabledResult", requestBody("GetModuleEnabled", moduleParameters(0)), sc);
};

exports.getModuleGroup = function (sc) {
    return soapAction("GetModuleGroup", "GetModuleGroupResult", requestBody("GetModuleGroup", groupParameters(0)), sc);
};

exports.getScheduleSettings = function (sc) {
    return soapAction("GetScheduleSettings", "GetScheduleSettingsResult", requestBody("GetScheduleSettings", ""), sc);
};

exports.setFactoryDefault = function (sc) {
    return soapAction("SetFactoryDefault", "SetFactoryDefaultResult", requestBody("SetFactoryDefault", ""), sc);
};

exports.getWLanRadios = function (sc) {
    return soapAction("GetWLanRadios", "GetWLanRadiosResult", requestBody("GetWLanRadios", ""), sc);
};

exports.getInternetSettings = function (sc) {
    return soapAction("GetInternetSettings", "GetInternetSettingsResult", requestBody("GetInternetSettings", ""), sc);
};

exports.setAPClientSettings = function (sc) {
    return soapAction("SetAPClientSettings", "SetAPClientSettingsResult", requestBody("SetAPClientSettings", APClientParameters()), sc);
};

exports.settriggerADIC = function (sc) {
    return soapAction("SettriggerADIC", "SettriggerADICResult", requestBody("SettriggerADIC", ""), sc);
};

function APClientParameters(group) {
    return "<Enabled>true</Enabled>" +
        "<RadioID>RADIO_2.4GHz</RadioID>" +
        "<SSID>My_Network</SSID>" +
        "<MacAddress>XX:XX:XX:XX:XX:XX</MacAddress>" +
        "<ChannelWidth>0</ChannelWidth>" +
        "<SupportedSecurity>" +
        "<SecurityInfo>" +
        "<SecurityType>WPA2-PSK</SecurityType>" +
        "<Encryptions>" +
        "<string>AES</string>" +
        "</Encryptions>" +
        "</SecurityInfo>" +
        "</SupportedSecurity>" +
        "<Key>" + AES.AES_Encrypt128("password", HNAP_AUTH.PrivateKey) + "</Key>";
}

function groupParameters(group) {
    return "<ModuleGroupID>" + group + "</ModuleGroupID>";
}
function temperatureSettingsParameters(module) {
    return moduleParameters(module) +
        "<NickName>TemperatureMonitor 3</NickName>" +
        "<Description>Temperature Monitor 3</Description>" +
        "<UpperBound>80</UpperBound>" +
        "<LowerBound>Not Available</LowerBound>" +
        "<OPStatus>true</OPStatus>";
}
function powerWarningParameters() {
    return "<Threshold>28</Threshold>" +
        "<Percentage>70</Percentage>" +
        "<PeriodicType>Weekly</PeriodicType>" +
        "<StartTime>1</StartTime>";
}

function loginRequest() {
    return "<Action>request</Action>"
        + "<Username>admin</Username>"
        + "<LoginPassword></LoginPassword>"
        + "<Captcha></Captcha>";
}

function loginParameters(loginResult) {
    var login_pwd = md5.hex_hmac_md5(loginResult.PrivateKey, loginResult.Challenge);
    return "<Action>login</Action>"
        + "<Username>admin</Username>"
        + "<LoginPassword>" + login_pwd.toUpperCase() + "</LoginPassword>"
        + "<Captcha></Captcha>";
}

function getHnapAuth(SoapAction, privateKey) {
    var current_time = new Date();
    var time_stamp = Math.round(current_time.getTime() / 1000);
    var auth = md5.hex_hmac_md5(privateKey, time_stamp + SoapAction);
    return auth.toUpperCase() + " " + time_stamp;
}

function readResponseValue(body, elementName) {
    if (body && elementName) {
        var doc = new DOMParser().parseFromString(body);
        var node = doc.getElementsByTagName(elementName).item(0);
        return (node) ? node.firstChild.nodeValue : "ERROR";
    }
}


