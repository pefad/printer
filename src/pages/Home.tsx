import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
} from '@ionic/react';

import { BluetoothLe } from '@capacitor-community/bluetooth-le';
import type { PluginListenerHandle } from '@capacitor/core';

type CustomDevice = {
  deviceId: string;
  name?: string;
};

const Home: React.FC = () => {
  const [devices, setDevices] = useState<CustomDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]); // Store discovered services
  const [characteristics, setCharacteristics] = useState<any[]>([]); // Store discovered characteristics

  // Function to connect to the Bluetooth device using its Bluetooth address (MAC address)
  const connectToDeviceByAddress = async (bluetoothAddress: string) => {
    setSelectedDeviceId(bluetoothAddress);

    try {
      // Connect to the Bluetooth device using its address
      await BluetoothLe.connect({ deviceId: bluetoothAddress });

      // Discover services (this step can be skipped if you already know the service UUIDs)
      const discoveredServices = await BluetoothLe.discover({ deviceId: bluetoothAddress });
      setServices(discoveredServices);

      // Discover characteristics for the first service (you can select the right one)
      const serviceUuid = discoveredServices[0]?.uuid; // Use the first service for demonstration
      const discoveredCharacteristics = await BluetoothLe.discoverCharacteristics({
        deviceId: bluetoothAddress,
        service: serviceUuid,
      });
      setCharacteristics(discoveredCharacteristics);

      console.log('Discovered Services:', discoveredServices);
      console.log('Discovered Characteristics:', discoveredCharacteristics);
    } catch (error: any) {
      console.error('Connection or discovery failed:', error);
      alert('Failed to connect or discover services: ' + error.message);
    }
  };

  // Function to print after discovering characteristics
  const printData = async () => {
    if (!selectedDeviceId || characteristics.length === 0) {
      alert('Please connect to a device and discover characteristics first.');
      return;
    }

    const writableServiceUuid = services[0]?.uuid; // Replace with correct writable service
    const writableCharUuid = characteristics[0]?.uuid; // Replace with correct writable characteristic

    const html = `<b>Hello Printer</b><br>Printed from Ionic React app!`;
    const plainText = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?[^>]+(>|$)/g, '') + '\n\n\n';

    const encoded = new TextEncoder().encode(plainText);
    const base64 = btoa(String.fromCharCode(...encoded));

    try {
      // Write data to the printer
      await BluetoothLe.write({
        deviceId: selectedDeviceId,
        service: writableServiceUuid,
        characteristic: writableCharUuid,
        value: base64,
      });
      alert('Printed successfully!');
    } catch (error: any) {
      console.error('Print failed:', error);
      alert('Print failed: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Bluetooth Printer</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonButton expand="block" onClick={() => connectToDeviceByAddress('DC:0D:51:FB:E4:30')}>
          Connect to Bluetooth Device
        </IonButton>

        <IonList>
          {devices.map((device, idx) => (
            <IonItem
              key={idx}
              button
              onClick={() => connectToDeviceByAddress(device.deviceId)}
            >
              <IonLabel>
                {device.name || 'Unnamed Device'}<br />
                <small>{device.deviceId}</small>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>

        <IonButton expand="block" onClick={printData}>
          Print
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Home;
