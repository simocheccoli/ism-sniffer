# ism-sniffer
[![Dependency Status](https://david-dm.org/rosterloh/ism-sniffer.png)](https://david-dm.org/rosterloh/ism-sniffer)
[![devDependency Status](https://david-dm.org/rosterloh/ism-sniffer/dev-status.png)](https://david-dm.org/rosterloh/ism-sniffer#info=devDependencies)

A [Node.js](http://nodejs.org/) application for sniffing ISM packets. This project uses custom hardware which sniffs the required ISM band and outputs the raw packet data to a serial port. This application logs the packets to a MongoDB database and exposes the packets over WebSockets.

## Prerequisites
* [Node.js](http://www.nodejs.org/download/)
* [MongoDB](http://docs.mongodb.org/manual/installation/)
* [Gulp](http://gulpjs.com/)

### Packages used
* [Express](http://expressjs.com/)
* [Mongoose](http://mongoosejs.com/)
* [Socket.io](http://socket.io/)
* [AngularJS](https://angularjs.org/)
* [Twitter Bootstrap](http://getbootstrap.com/)
* [UI Bootstrap](http://angular-ui.github.io/bootstrap/)

## Install
```bash
$ npm install -g gulp
$ npm install
$ gulp build
```
## License
[The MIT License](http://opensource.org/licenses/MIT)
