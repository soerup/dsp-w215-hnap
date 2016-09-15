dsp-w215-hnap
===============
Tool for reading data from D-Link DSP-W215 Home Smart Plug.
Tested with hardware version B1 and firmware version 2.20
and Firmware Internal Version: V2.22b05

<b>service.js</b> will provide a node-js application exposing an API for interacting with the plugs.
Configure your account and the plugs with <b>config.js</b>.

Lots of interesting background information in the Wiki of the original project:  
https://github.com/bikerp/dsp-w215-hnap/wiki  
(Thanks to the original author for a great example to build on)

All calls should be prepended with server ip and port - e.g. 10.0.10.22:8080 as configured by your installation.

API calls:  
**/api/authenticate**  
name : username as configured in config.js  
password : password configured in config.js  

Responses:  
```
{
  "success": true,
  "message": "Enjoy your token!",
  "token": "[long token]"
}
``` 

```
{  
  "success": false,  
  "message": "Authentication failed. User not found."  
}
```
All other API calls require a valid token as provided above (token is valid for 24 hrs):  

Possible errors for all requests are:  
Call with no token:  
```
{
  "success": false,
  "message": "No token provided."
}
```

Call with wrong or old token:
```
{
  "success": false,
  "message": "Failed to authenticate token."
}
```

Call for unknown device - see plug parameter below.
```
{
  "success": false,
  "message": "Unknown plug."
}
```

Not very informative, but surfaces directly from soapclient, and most often means you should login
again, e.g. after reboot or if unit has been powered down.  
```
"ERROR"
```

------------------------------------------------------------------------

Plug names are defined in config.js along with pin-codes. See example config in source.

Two calls that does not require a plug:

**/**  - Will respond if the server is functional, aka server is running and token is good

**list** - Return list of configured plugs

Following calls require a parameter of plug as configured (and shown in list above):  
**login** - log into plug - try calling this if you get return `"ERROR"` on any call

Control calls:  
**on** - turn plug on  
**off** - turn plug off  
**reboot** - reboot plug  

Read calls:  
**state** - return currect power state of plug  
**temperature** - return current temperature of plug  
**consumption** - return current power consumption of plug  
**ready** - return `"OK"` if plug is ready 

Example api call:

Send:  
```
GET: 10.1.10.5:8081/api/state?plug=office
Header: x-access-token : <long token>
```
Return:
```
"false"
```

Which means the plugs is in it's off state

Installation
===============

Install Node.js (Google it!)  
Checkout this repo   
In the the checkout folder run  
```
npm  install
```
Copy example_config.js to config.js and edit according to your environment.  
Start server (interactive mode):  
```
node service.js
```

If you want to run the API server automatically on Ubuntu flavors here is a link describing how it can be done:  

https://www.axllent.org/docs/view/nodejs-service-with-systemd/  

raspbian folder contains service file that works for me during development with a Raspbian Jessie installation. It should be trivial to update for a similar setup.

