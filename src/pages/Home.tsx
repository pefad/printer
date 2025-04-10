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
  const [characteristics, setCharacteristics] = useState<any[]>([]);

  // Initialize Bluetooth LE
  const initializeBluetooth = async () => {
    try {
      await BluetoothLe.initialize();
    } catch (error: any) {
      alert("Bluetooth initialization failed: " + error.message);
    }
  };

  // Function to scan for nearby Bluetooth printers
  const scanForPrinters = async () => {
    setDevices([]); // Clear any previously listed devices
    await initializeBluetooth(); // Initialize Bluetooth

    const listener = await BluetoothLe.addListener(
      'onScanResult',
      (result: any) => {
        const device = result?.device;
        if (device?.deviceId) {
          const foundDevice: CustomDevice = {
            deviceId: device.deviceId,
            name: device.name,
          };

          setDevices((prev) => {
            const exists = prev.find((d) => d.deviceId === foundDevice.deviceId);
            if (!exists) {
              return [...prev, foundDevice];
            }
            return prev;
          });
        }
      }
    );

    // Start scanning for Bluetooth devices
    await BluetoothLe.requestLEScan({ allowDuplicates: false });

    // Stop the scan after 10 seconds
    setTimeout(async () => {
      await BluetoothLe.stopLEScan();
      await listener.remove();
    }, 10000);
  };

  // Function to connect to the selected device and read characteristics
  const connectAndDiscover = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);

    try {
      await BluetoothLe.connect({ deviceId });
      alert('Connected to device: ' + deviceId);

      // Example service and characteristic UUIDs for reading data
      const serviceUuid = '000018f0-0000-1000-8000-00805f9b34fb'; // Replace with correct UUID
      const characteristicUuid = '00002a00-0000-1000-8000-00805f9b34fb'; // Replace with correct UUID

      // Read the characteristic value
      const readResult = await BluetoothLe.read({
        deviceId,
        service: serviceUuid,
        characteristic: characteristicUuid,
      });

      alert('Read result: ' + JSON.stringify(readResult));
      setCharacteristics([readResult]); // Set read characteristics
    } catch (error: any) {
      alert('Failed to connect or read characteristic: ' + error.message);
    }
  };

  // Function to print after reading characteristics
  const printData = async () => {
    if (!selectedDeviceId || characteristics.length === 0) {
      alert('Please connect to a device and read characteristics first.');
      return;
    }

    const writableServiceUuid = '49535343-fe7d-4ae5-8fa9-9fafd205e455'; // Replace with correct writable service
    const writableCharUuid = '49535343-8841-43f4-a8d4-ecbe34729bb3'; // Replace with correct writable characteristic

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
        <IonButton expand="block" onClick={scanForPrinters}>
          Scan for Bluetooth Printers
        </IonButton>

        <IonList>
          {devices.map((device, idx) => (
            <IonItem
              key={idx}
              button
              onClick={() => connectAndDiscover(device.deviceId)}
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
