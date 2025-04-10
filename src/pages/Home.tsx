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

import {
  BluetoothLe,
} from '@capacitor-community/bluetooth-le';

import type { PluginListenerHandle } from '@capacitor/core';

type CustomDevice = {
  deviceId: string;
  name?: string;
};

const Home: React.FC = () => {
  const [devices, setDevices] = useState<CustomDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [scanListener, setScanListener] = useState<PluginListenerHandle | null>(null);

  // Function to scan for nearby Bluetooth printers
  const scanForPrinters = async () => {
    setDevices([]); // Clear any previously listed devices
    await BluetoothLe.initialize();

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

    setScanListener(listener);

    // Start scanning for Bluetooth devices
    await BluetoothLe.requestLEScan({ allowDuplicates: false });

    // Stop the scan after 10 seconds
    setTimeout(async () => {
      await BluetoothLe.stopLEScan();
      await listener.remove();
      setScanListener(null);
    }, 10000);
  };

  // Function to connect to a selected device and print data
  const connectAndPrint = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);

    try {
      // Connect to the selected Bluetooth device
      await BluetoothLe.connect({ deviceId });

      // Read a characteristic value (e.g., device information or status)
      // Example: You would replace 'serviceUuid' and 'characteristicUuid' with actual values for your printer.
      const readResult = await BluetoothLe.read({
        deviceId,
        service: '000018f0-0000-1000-8000-00805f9b34fb',
        characteristic: '00002af0-0000-1000-8000-00805f9b34fb',
      });

      console.log('Read result:', readResult);

      // Now, write data to the device (print data)
      const writableServiceUuid = 'your-service-uuid-here'; // Replace with your service UUID
      const writableCharUuid = 'your-characteristic-uuid-here'; // Replace with your characteristic UUID

      // HTML content to print
      const html = `<b>Hello Printer</b><br>Printed from Ionic React app!`;
      const plainText = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?[^>]+(>|$)/g, '') + '\n\n\n';

      const encoded = new TextEncoder().encode(plainText);
      const base64 = btoa(String.fromCharCode(...encoded));

      // Write the data to the printer
      await BluetoothLe.write({
        deviceId,
        service: writableServiceUuid,
        characteristic: writableCharUuid,
        value: base64,
      });

      alert('Printed successfully!');
    } catch (error: any) {
      console.error(error);
      alert('Print failed: ' + (error.message || 'Unknown error'));
    } finally {
      try {
        await BluetoothLe.disconnect({ deviceId });
      } catch {}
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
              onClick={() => connectAndPrint(device.deviceId)}
            >
              <IonLabel>
                {device.name || 'Unnamed Device'}<br />
                <small>{device.deviceId}</small>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Home;
