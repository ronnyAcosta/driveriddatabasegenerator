
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.set('port', process.env.PORT || 3000)
app.use(express.static(__dirname + '/public'));

server.listen(app.get('port'), function(){
    console.log(`server listening on port ${app.get('port')}`);
});

//Serial COMM

const { SerialPort } = require('serialport');
const fs = require('fs');

const {crc16xmodem} = require('crc');

let portList = [];


SerialPort.list().then(function(ports){
    ports.forEach(function(port){
        if(port.manufacturer == 'wch.cn'){
            portList.push(port.path);
            console.log("Port: ", port);
        }
        //console.log(port.manufacturer);
    });
});

let iButtonsIndex = 1;
let message = "";
let port = undefined;
let iButtonsList = [];

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
            console.log(`${port.path} is open.`)
        }
    
        socket.emit('selectedPort', port.path);
        
        const { ReadlineParser } = require('@serialport/parser-readline');
        const parser = port.pipe(new ReadlineParser({ delimiter: `*` }))
        //const { appendFile } = require('fs');   
        parser.on('data', (data) => {
            if(data.length == 16){
                if(duplicatedIButtonCheck(data) == true){
                    console.log("iButton is on list");
                }

                else{
                    message += `<div class='iButtons'><span class='index'>${iButtonsIndex}</span>:   <span>${data.toUpperCase()}</span> <span onclick='del(this)'>&#10006;</span></div>\n`;
                    iButtonsIndex++;
                    iButtonsList.push(data);
                    socket.emit('iButtons', message);
                }
            }
        });
    })

    socket.on('closePort', ()=>{
        if(port != undefined){
            console.log(`Closing ${port.path}`);
            port.close();
            port = undefined;
            socket.emit('portStatus', false);
        }
        
    });

    socket.on('reset', ()=>{
        iButtonsIndex = 1;
        message = "";
        iButtonsList = [];
    })

    socket.on('buffer', ()=>{
        let iButtonsString = "";
        for(iButton of iButtonsList){
            iButtonsString += iButton;
        }
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
            iButtonsIndex = 1;
            //let iButtonsArray = [];
            let buffer = Buffer.alloc(content.length-2, content);
            let iButtonsString = buffer.toString('hex');
            iButtonsList = [];
            if(buffer.length % 8 == 0){
                for(let i=0; i<iButtonsString.length; i+=16){
                    iButtonsList.push(iButtonsString.substring(i, i+16));
                }
                message = '';
                for(iButton of iButtonsList){
                    message += `<div class='iButtons'><span class='index'>${iButtonsIndex}</span>:   <span>${iButton.toUpperCase()}</span> <span onclick='del(this)'>&#10006;</span></div>\n`;
                    //console.log(iButtonsIndex);
                    iButtonsIndex++;
                }
                //message += `</span></div>`;
                socket.emit('iButtons', message);
                //socket.emit('iButtonString', iButtonsString);
                console.log("File Opened");             
            }
        }
        else{
            socket.emit('alert', 'Invalid file')
            console.log("Invalid file");
        }
        
    });

    socket.on('addIButton', (iButton)=>{
        if(iButton.length == 16){
            if(duplicatedIButtonCheck(iButton) == true){
                console.log("iButton is on list");
            }
            else{
                iButtonsList.push(iButton);
                message += `<div class='iButtons'><span class='index'>${iButtonsIndex}</span>:   <span>${iButton.toUpperCase()}</span> <span onclick='del(this)'>&#10006;</span></div>\n`;
                iButtonsIndex++;
                socket.emit('iButtons', message);
                //console.log(iButtonsList);
            }
        }
    });

    socket.on('delete', (index)=>{
        index = parseInt(index)-1;
        if(iButtonsList.length > 0){
            if(iButtonsList.length > index){
                iButtonsList.splice(index, 1);
                console.log(iButtonsList);
                iButtonsIndex = 1;
                message = '';
                for(iButton of iButtonsList){
                    message += `<div class='iButtons'><span class='index'>${iButtonsIndex}</span>:   <span>${iButton.toUpperCase()}</span> <span onclick='del(this)'>&#10006;</span></div>\n`;
                    //console.log(iButtonsIndex);
                    iButtonsIndex++;
                }
                //message += `</span></div>`;
                socket.emit('iButtons', message);
            }
            else{
                socket.emit('invalid');
            }
        }
    })
    
});

function duplicatedIButtonCheck(iButton){
    for(index of iButtonsList){
        if(index == iButton){
            return true;
        }
    }
}

//console.log(serial);
//console.log(document.getElementById("serial"));

