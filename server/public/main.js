//const e = require("express");

const socket = io();
let portList = [];
let selectedPort = "";
let portStatus = false;
let content;
let iButtonsDatabase = "";

socket.on('selectedPort', (data) => {
    selectedPort = data;
})

socket.on('portList', function(portListFromServer){
    portList = portListFromServer;
    select.innerHTML = '<option value="" selected>select port</option>';
    for(port of portList){
        select.innerHTML += `<option value="${port}">${port}</option>`;
    }
});

socket.on('portStatus', (status)=>{
    portStatus = status;
})

socket.on('iButtons', (data)=>{
    let iButtonsList = document.getElementById('iButtonsList');
    iButtonsList.innerHTML = data;
});

socket.on('save', (data)=>{
    const a = document.createElement("a");
    const file = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(file);
    a.href = url;
    a.download = " ";
    a.click();
    URL.revokeObjectURL(url);
});

socket.on('iButtonString', (data)=>{
    iButtonsDatabase = data;
    console.log(iButtonsDatabase);
});

socket.on('invalid', ()=>{
    alert('Invalid index');
});

socket.on('alert', (message)=>{
    alert(message);
})

function openPort(){
    let port = document.getElementById("select").value;
    let indicator = document.getElementById('indicator');
    if(port != ""){
        socket.emit('port', port);
        setTimeout(()=>{
            if(portStatus == true){
                indicator.classList.add('portOpen');
            }
        }, 50);
    }
    console.log(port);
    console.log(selectedPort);
    
}

function closePort(){
    socket.emit('closePort');
    setTimeout(()=>{
        if(portStatus == false){
            indicator.classList.remove('portOpen');
        }
    }, 50);
}

function resetIndex(){
    socket.emit('reset');
}

function download(){
    socket.emit('buffer');
}

function openFile(){
    let file = document.getElementById("textFile").files[0];
    
    if(file){
        let reader = new FileReader();

        reader.onload = function (e){
            content = e.target.result;
            socket.emit('file', content);
        }

        reader.readAsArrayBuffer(file);
    }
    console.log("Opening File");
}

function charCode(event){
    let code = event.charCode;
    let iButton = document.getElementById('iButton');
    if((code<48 || code>57) && (code<65 || code>70) && (code<97 || code>102)){
        if(iButton.value.length != 16){
            setTimeout(()=>{
                iButton.value = iButton.value.replace(String.fromCharCode(code), '');
            }, 1);
        }
        
    }
}

function add(){
    let iButton = document.getElementById('iButton').value;
    if(iButton.length == 16){
        for(char of iButton){
            let code = char.charCodeAt(0);
            if((code<48 || code>57) && (code<65 || code>70) && (code<97 || code>102)){
                console.log(`${code}: ${char}`);
                return alert("Invalid char");
            }
        }
        socket.emit('addIButton', iButton.toLowerCase());
        document.getElementById('iButton').value = "";
    }
    else{
        return alert("Missing chars");
    }
}

function del(x){
    let index = x.parentNode.firstChild.firstChild.innerHTML;
    if(index > 0){
        if(confirm("Delete iButton?")){
            socket.emit('delete', index);
        }
    }
    else{
        alert("Invalid index");
    }
}

