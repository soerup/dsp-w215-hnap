module.exports = {
    'secret': 'thisshouldbesecret',
    'plugs' : { 'heater': { 'url': "http://192.168.0.11/HNAP1", pin : '111111' }, 
                'kitchen' : { 'url': "http://192.168.0.76/HNAP1", pin : '222222' },
                'office' : { 'url': "http://192.168.0.47/HNAP1", pin : '333333' }
              },
    'auth'  : { 'user' : "username", 'pw' : 'password'},
    'port'  : 8081
}
