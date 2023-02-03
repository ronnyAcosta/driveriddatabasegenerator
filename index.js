
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.set('port', process.env.PORT || 3000)
app.use(express.static(__dirname + '/views'));

server.listen(app.get('port'), function(){
    console.log(`Server listening on port ${app.get('port')}`);
});

//Serial COMM

const { SerialPort } = require('serialport');

const {crc16xmodem} = require('crc');

let portList = [];


SerialPort.list().then(function(ports){
    ports.forEach(function(port){
        if(port.manufacturer == 'wch.cn'){
            portList.push(port.path);
            console.log("Port: ", port);
        }
    });
});

let port = undefined;

io.on('connect', socket => {
    
    socket.emit('portList', portList);  

    socket.on('port', (portFromClient) => {
        if(port == undefined || port.path == ""){
            port = new SerialPort({
            path: portFromClient,
            baudRate: 115200,
            dataBits: 8,
            stopBits: 1,
            parity: 'none',
            autoOpen: false,
        });

        port.open();
        socket.emit('portStatus', true);
        console.log(`Opening ${port.path}.`)
        }
        
        socket.emit('selectedPort', port.path);
        const { ReadlineParser } = require('@serialport/parser-readline');
            const parser = port.pipe(new ReadlineParser({ delimiter: `*` }));
            parser.on('data', (data) => {
                if(data.length == 16){
                    socket.emit('iButton', data);
                }
            });
    }) 

    socket.on('iButtonCheck', check =>{
        let iButtonCheck = Buffer.alloc(1, check, 'hex');
        port.write(iButtonCheck);
    });

    socket.on('closePort', ()=>{
        if(port != undefined){
            console.log(`Closing ${port.path}`);
            port.close();
            port = undefined;
            socket.emit('portStatus', false);
        }
        
    });

    socket.on('reset', ()=>{
        portList = [];
        SerialPort.list().then(function(ports){
            ports.forEach(function(port){
                if(port.manufacturer == 'wch.cn'){
                    portList.push(port.path);
                    console.log("Port: ", port);
                }
            });
        });
        setTimeout(()=>{
            socket.emit('portList', portList);    
        }, 500);
    });

    socket.on('buffer', (iButtonsString)=>{
        let iButtonsBuffer = Buffer.alloc(iButtonsString.length/2, iButtonsString, 'hex');
        let crc = crc16xmodem(iButtonsBuffer).toString(16);
        if(crc.length < 4){
            switch(crc.length){
                case 1:
                    crc = `000${crc}`;
                    break;
                case 2:
                    crc = `00${crc}`;
                    break;
                case 3:
                    crc = `0${crc}`;
                    break;
            }
        }
        let databaseString = `${iButtonsString}${crc}`;
        let iButtonsDatabase = Buffer.alloc(databaseString.length/2, databaseString, 'hex');
        console.log(iButtonsDatabase)
        socket.emit('save', iButtonsDatabase);
    })
  
    socket.on('file', (content)=>{
        if(content.length % 8 == 2){
            let buffer = Buffer.alloc(content.length-2, content);
            let iButtonsString = buffer.toString('hex');
            if(buffer.length % 8 == 0){
                socket.emit('fileContent', iButtonsString);            
            }
        }
        else{
            socket.emit('alert', 'Invalid file')
            console.log("Invalid file");
        }
        
    });
});
