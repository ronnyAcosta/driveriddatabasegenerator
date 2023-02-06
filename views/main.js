//const e = require("express");

const socket = io();
let portList = [];
let selectedPort = "";
let portStatus = false;
let content;
let iButtonsDatabase = "";
let iButtonsIndex = 1;
let message = "";
let iButtonsList = [];

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

socket.on('iButton', (data)=>{
    if(duplicatedIButtonCheck(data) == true){
        console.log("iButton is on list");
        socket.emit('iButtonCheck', '01')
    }
    else{
        iButtonsList.push(data.toLowerCase());
        message += `<div class='iButtons'><span class='index'><span>${iButtonsIndex}</span>:</span><span>${data.toUpperCase()}</span><span class="delete" onclick='del(this)'>&#10006;</span></div>\n`;
        iButtonsIndex++;
        socket.emit('iButtonCheck', '00')
        let list = document.getElementById('iButtonsList');
        list.innerHTML = message;
    }
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

/*
socket.on('iButtonString', (data)=>{
    iButtonsDatabase = data;
    console.log(iButtonsDatabase);
});*/
/*
socket.on('invalid', ()=>{
    alert('Invalid index');
});
*/
socket.on('alert', (message)=>{
    alert(message);
})

socket.on('fileContent', (iButtonsString)=>{
    if(iButtonsString.length % 16 == 0){
        iButtonsIndex = 1;
        iButtonsList = [];
        for(let i=0; i<iButtonsString.length; i+=16){
            iButtonsList.push(iButtonsString.substring(i, i+16));
        }
        message = '';
        for(iButton of iButtonsList){
            message += `<div class='iButtons'><span class='index'><span>${iButtonsIndex}</span>:</span><span>${iButton.toUpperCase()}</span><span class="delete" onclick='del(this)'>&#10006;</span></div>\n`;
            iButtonsIndex++;
        }
        let list = document.getElementById('iButtonsList');
        list.innerHTML = message;
    }
});

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
    /*
    iButtonsIndex = 1;
    message = "";
    iButtonsList = [];
    */
    socket.emit('reset');
}

function download(){
    let iButtonsString = "";
    for(iButton of iButtonsList){
        iButtonsString += iButton;
    }
    socket.emit('buffer', iButtonsString);
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

function deleteInvalidChar(){
    let iButton = document.getElementById('iButton');
    for(char of iButton.value){
        let code = char.charCodeAt(0);
        if((code<48 || code>57) && (code<65 || code>70) && (code<97 || code>102)){
            iButton.value = iButton.value.replace(char, '');
        }
    }
}

function add(){
    let iButtons = document.getElementById('iButton').value.toLowerCase();
    if(iButtons.length % 16 == 0){
        for(let i=0; i<iButtons.length; i+=16){
            //iButtons.push(iButtons.substring(i, i+16));
            let iButton = iButtons.substring(i, i+16)
            for(char of iButtons){
                let code = char.charCodeAt(0);
                if((code<48 || code>57) && (code<65 || code>70) && (code<97 || code>102)){
                    return alert("Invalid char");
                }
            }
            
            if(duplicatedIButtonCheck(iButton) == true){
                alert(`${iButton.toUpperCase()} is on list`);
            }
            else{
                iButtonsList.push(iButton.toLowerCase());
                message += `<div class='iButtons'><span class='index'><span>${iButtonsIndex}</span>:</span><span>${iButton.toUpperCase()}</span><span class="delete" onclick='del(this)'>&#10006;</span></div>\n`;
                iButtonsIndex++;
                let list = document.getElementById('iButtonsList');
                list.innerHTML = message;
            }
        }
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
            index = parseInt(index)-1;
            if(iButtonsList.length > 0){
                if(iButtonsList.length > index){
                    iButtonsList.splice(index, 1);
                    iButtonsIndex = 1;
                    message = '';
                    for(iButton of iButtonsList){
                        message += `<div class='iButtons'><span class='index'><span>${iButtonsIndex}</span>:</span><span>${iButton.toUpperCase()}</span><span class="delete" onclick='del(this)'>&#10006;</span></div>\n`;
                        iButtonsIndex++;
                    }
                    let list = document.getElementById('iButtonsList');
                    list.innerHTML = message;
                }
                else{
                    alert('Unexpected error');
                }
            }
        }
    }
    else{
        alert("Unexpected error");
    }
}

function duplicatedIButtonCheck(iButton){
    for(index of iButtonsList){
        if(index == iButton){
            return true;
        }
    }
}