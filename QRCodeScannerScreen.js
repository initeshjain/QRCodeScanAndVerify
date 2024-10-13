import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';

const QRCodeScannerScreen = () => {
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [scannedData, setScannedData] = useState(''); // State to store scanned data
  const [isLoading, setIsLoading] = useState(false); // State for loading
  const [controller, setController] = useState(null); // State for AbortController

  const onSuccess = (e) => {
    setScannedData(e.data); // Set the scanned data
    setIsScanning(false); // Stop scanning
  };

  const sendRequest = () => {
    if (!scannedData) return; // Check if there's data to send

    const abortController = new AbortController(); // Create a new AbortController
    setController(abortController); // Save it to state
    setIsLoading(true); // Start loading

    fetch('http://192.168.1.36:3000', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scannedText: scannedData }),
      signal: abortController.signal, // Attach the abort signal
    })
      .then((response) => response.json())
      .then((data) => {
        setIsLoading(false); // Stop loading
        Alert.alert(
          'QR Code Scanned',
          `Scanned Data: ${scannedData}\nServer Response: ${data.data}`,
          [
            {
              text: 'OK',
              onPress: () => {
                setScannedData(''); // Clear scanned data
                setController(null); // Reset controller
              },
            },
          ],
          { cancelable: false }
        );
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          console.log('Request canceled:', error);
        } else {
          Alert.alert(
            'Error Occurred',
            `Scanned Data: ${scannedData}\nError: ${error.message}`,
            [
              {
                text: 'OK',
                onPress: () => {
                  setScannedData(''); // Clear scanned data
                  setController(null); // Reset controller
                },
              },
            ],
            { cancelable: false }
          );
        }
        setIsLoading(false); // Stop loading
      });
  };

  const cancelRequest = () => {
    if (controller) {
      controller.abort(); // Cancel the request
      setIsLoading(false); // Stop loading
      Alert.alert('Request Canceled', 'The request has been canceled.');
      setController(null); // Reset controller
    }
  };

  const toggleFlash = () => {
    setIsFlashOn((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.centerText}>Scan a QR Code</Text>
      {/* Display QR Code Scanner if scanning is active */}
      {isScanning && (
        <QRCodeScanner
          ref={scannerRef} // Attach the scanner ref
          onRead={onSuccess}
          reactivate={false} // Disable default reactivate behavior
          flashMode={isFlashOn ? RNCamera.Constants.FlashMode.torch : RNCamera.Constants.FlashMode.off}
        />
      )}

      <Text style={styles.bottomText}>Point your camera at a QR Code</Text>

      {/* Display the scanned data */}
      {scannedData ? (
        <View style={styles.scannedDataContainer}>
          <Text style={styles.scannedDataText}>Scanned Data: {scannedData}</Text>
          <TouchableOpacity style={styles.button} onPress={sendRequest}>
            <Text style={styles.buttonText}>Send Request</Text>
          </TouchableOpacity>
          {isLoading && (
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={cancelRequest}>
              <Text style={styles.buttonText}>Cancel Request</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {/* Show loading indicator if loading */}
      {isLoading && <ActivityIndicator size="large" color="#1c8adb" style={styles.loadingIndicator} />}

      {/* Button to start scanning */}
      {!isScanning && (
        <TouchableOpacity style={styles.button} onPress={() => setIsScanning(true)}>
          <Text style={styles.buttonText}>Start Scanning</Text>
        </TouchableOpacity>
      )}

      {/* Button to stop scanning */}
      {isScanning && (
        <TouchableOpacity style={[styles.button, { backgroundColor: '#ff5c5c' }]} onPress={() => setIsScanning(false)}>
          <Text style={styles.buttonText}>Stop Scanning</Text>
        </TouchableOpacity>
      )}

      {/* Button to toggle flash */}
      {isScanning && (
        <TouchableOpacity style={styles.button} onPress={toggleFlash}>
          <Text style={styles.buttonText}>{isFlashOn ? 'Turn Off Flash' : 'Turn On Flash'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    fontSize: 18,
    padding: 32,
    color: '#777',
  },
  bottomText: {
    fontSize: 16,
    padding: 20,
    color: '#000',
  },
  scannedDataContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  scannedDataText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#1c8adb',
    padding: 16,
    borderRadius: 8,
    margin: 20,
  },
  cancelButton: {
    backgroundColor: '#ff5c5c', // Different color for the cancel button
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
  },
  loadingIndicator: {
    marginVertical: 20,
  },
});

export default QRCodeScannerScreen;
