import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonText,
  IonLoading
} from '@ionic/react';
import { BleClient, BleService, textToDataView } from '@capacitor-community/bluetooth-le';

const Home: React.FC = () => {
  const [deviceId, setDeviceId] = useState<string>('');
  const [serviceUuid, setServiceUuid] = useState<string>('');
  const [characteristicUuid, setCharacteristicUuid] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const initializeBLE = async () => {
    await BleClient.initialize({ androidNeverForLocation: true });
  };

  const verifyAndEnable = async () => {
    const isEnabled = await BleClient.isEnabled();
    if (!isEnabled) {
      await BleClient.enable();
    }
  };

  const scanAndConnect = async () => {
    setLoading(true);
    try {
      await verifyAndEnable();
      await initializeBLE();

      const device = await BleClient.requestDevice({ allowDuplicates: false });
      if (!device) throw new Error('No device selected');

      await BleClient.connect(device.deviceId);
      setDeviceId(device.deviceId);

      const services: BleService[] = await BleClient.getServices(device.deviceId);
      const service = services[0];
      const characteristic = service?.characteristics[0];

      if (!service || !characteristic) {
        throw new Error('Service or Characteristic not found');
      }

      setServiceUuid(service.uuid);
      setCharacteristicUuid(characteristic.uuid);
    } catch (err) {
      alert('Error: ' + err);
    } finally {
      setLoading(false);
    }
  };

  const write = async (data: Uint8Array | string) => {
    const buffer = typeof data === 'string' ? textToDataView(data) : new DataView(data.buffer);
    await BleClient.write(deviceId, serviceUuid, characteristicUuid, buffer);
  };

  const lineFeed = async () => write(new Uint8Array([10]));
  const turnOnBold = async () => write(new Uint8Array([27, 69, 1]));
  const turnOffBold = async () => write(new Uint8Array([27, 69, 0]));
  const feedLeft = async () => write(new Uint8Array([27, 97, 0]));
  const feedCenter = async () => write(new Uint8Array([27, 97, 1]));
  const feedRight = async () => write(new Uint8Array([27, 97, 2]));
  const underline = async () => {
    await lineFeed();
    await write('-'.repeat(30));
  };
  const newEmptyLine = async () => {
    await lineFeed();
    await write(' '.repeat(18) + '\n');
  };
  const writeData = async (text: string) => {
    await lineFeed();
    await write(text);
  };

  const disconnect = async () => {
    await BleClient.disconnect(deviceId);
    alert('Disconnected');
  };

  const handlePrint = async () => {
    setLoading(true);
    try {
      await turnOnBold();
      await feedCenter();
      await writeData('Kingsconcept POS');
      await underline();
      await turnOffBold();

      await feedRight();
      await writeData(`Date: ${new Date().toLocaleString()}`);

      await feedLeft();
      await writeData(`Customer: John Doe`);
      await writeData(`Item: iPhone 13`);
      await writeData(`Qty: 1    Price: ₦500,000`);

      await newEmptyLine();
      await feedCenter();
      await writeData('Please collect after one hour.');
      await writeData('--- Thank you ---');
      await feedLeft();

      await newEmptyLine();
      await disconnect();
    } catch (err) {
      alert('Print failed: ' + err);
    } finally {
      setLoading(false);
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
        <IonButton expand="block" onClick={scanAndConnect}>Scan & Connect</IonButton>
        {deviceId && (
          <IonText>
            <p>Connected to: <strong>{deviceId}</strong></p>
          </IonText>
        )}
        {deviceId && serviceUuid && characteristicUuid && (
          <IonButton expand="block" color="success" onClick={handlePrint}>
            Print Receipt
          </IonButton>
        )}
        <IonLoading isOpen={loading} message={'Please wait...'} />
      </IonContent>
    </IonPage>
  );
};

export default Home;
