#include <OneWire.h>

#define button 3
#define greenLed 5
#define redLed 6

OneWire  ds(13);
byte addr[8];             
String keyStatus="";
int incomingByte = 0;              
void setup() {
  Serial.begin(115200);
  pinMode(button, INPUT_PULLUP);
  pinMode(greenLed, OUTPUT);
  pinMode(redLed, OUTPUT);
  
  // Los led encienden con un LOW
  digitalWrite(greenLed, HIGH); 
  digitalWrite(redLed, HIGH);
}

void loop() {
  getKeyCode();                           // Llama a la función que lee las llaves   
  String iButton = "";                  // String donde se imprimiran las llaves
  if(keyStatus=="ok"){
    for(int i = 7; i >= 0; i--){
      if(addr[i] < 16){
        iButton += "0"; 
      }
      iButton += String(addr[i], HEX);
    }
    Serial.print(iButton);
    Serial.print("*");
    delay(500);
  }
  else if (keyStatus!="") { 
    Serial.println(keyStatus);
  }
  while (Serial.available()>0){
    incomingByte = Serial.read();
    if(incomingByte == 0){
      digitalWrite(greenLed, LOW);
      delay(1000);
      digitalWrite(greenLed, HIGH);
    }
    else if(incomingByte == 1){
      digitalWrite(redLed, LOW);
      delay(1000);
      digitalWrite(redLed, HIGH);
    }
  }
}

// Función que lee las llaves
void getKeyCode(){
  byte present = 0;
  byte data[12];
  keyStatus="";
  
  if ( !ds.search(addr)) {
      ds.reset_search();
      return;
  }

  if ( OneWire::crc8( addr, 7) != addr[7]) {
      keyStatus="CRC invalid";
      return;
  }
  
  if ( addr[0] != 0x01) {
      keyStatus="not DS1990A";
      return;
  }
  keyStatus="ok";
  ds.reset();
}
