# dsp-w215-hnap
Tool for reading data from D-Link DSP-W215 Home Smart Plug.
Tested with hardware version B1 and firmware version 2.20
and Firmware Internal Version: V2.22b05

<b>service.js</b> will provide a node-js application exposing an API for interacting with the plugs.
Configure your account and the plugs with <b>config.js</b>.

Lots of interesting background information in the Wiki of the original project: 
https://github.com/bikerp/dsp-w215-hnap/wiki


All calls should be prepended with server ip and port - e.g. 10.0.10.22:8080 as configured by your installation.
API calls: 



<b>/api/authenticate</b><br>

name : username as configured in config.js<br>
password : password configured in config.js<br>

Responses: <br>
<code>
{
  "success": true,
  "message": "Enjoy your token!",
  "token": "[long token]"
}

{
  "success": false,
  "message": "Authentication failed. User not found."
}

</code>
All other API calls require a valid token as provided above (token is valid for 24 hrs):<br>

Possible errors for all requests are:<br>

Call with no token:<br>
<code>
{
  "success": false,
  "message": "No token provided."
}
</code>
Call with wrong or old token:
<code>
{
  "success": false,
  "message": "Failed to authenticate token."
}
</code>
Call for unknown device - see plug parameter below.
<code>
{
  "success": false,
  "message": "Unknown plug."
}
</code>
Not very informative, but surfaces directly from soapclient, and most often means you should login 
again, e.g. after reboot or if unit has been powered down.

<code>
"ERROR"
</code>

------------------------------------------------------------------------

Plug names are defined in config.js along with pin-codes.

Two calls that does not require a plug: 

/ <br>
Will respond if the server is functional, aka server is running and token is good

list <br>
Return list of configured plugs

Following calls require a parameter of plug as configured (and shown in list above):

<b>login</b> - log into plug - try if you get return "ERROR" on any call

Control calls: <br>
<b>on</b> - turn plug on
<b>off</b> - turn plug off
<b>reboot</b> - reboot plug

Read calls: <br>
<b>state</b> - return currect power state of plug
<b>temperature</b> - return current temperature of plug
<b>consumption</b> - return current power consumption of plug
<b>ready</b> - return "OK" if plug is ready

Example api call: 


Send:
<code>
GET: 10.1.10.5:8081/api/state?plug=office
Header: x-access-token : <long token>
</code>
Return:
<code> 
"false" 
</code>
This mean that the plug is in off state.


