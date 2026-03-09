import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { MicronetNode } from '../types';

export function useMicronet(socket: Socket | null, userId: string, props: {
  isMicronetActive: boolean;
  setIsMicronetActive: (v: boolean) => void;
  micronetDevice: string | null;
  setMicronetDevice: (v: string | null) => void;
}) {
  const { isMicronetActive, setIsMicronetActive, micronetDevice, setMicronetDevice } = props;
  const [nearbyUsers, setNearbyUsers] = useState<MicronetNode[]>([]);
  const [allNodes, setAllNodes] = useState<MicronetNode[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on('micronet_node_update', (nodes: MicronetNode[]) => {
      setAllNodes(nodes);
    });

    socket.on('micronet_proximity_alert', (data: MicronetNode) => {
      if (micronetDevice === data.deviceName) {
        setNearbyUsers(prev => {
          const combined = [...prev, data];
          return Array.from(new Map(combined.map(item => [item.userId, item])).values());
        });
      }
    });

    return () => {
      socket.off('micronet_node_update');
      socket.off('micronet_proximity_alert');
    };
  }, [socket, micronetDevice]);

  const handlePairing = async () => {
    try {
      const nav = navigator as any;
      if (!nav.bluetooth) {
        alert("Bluetooth not supported in this browser/environment.");
        return;
      }

      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information']
      });

      const name = device.name || "Unknown Node";
      setMicronetDevice(name);
      setIsMicronetActive(true);
      localStorage.setItem('nownet_micronetDevice', name);
      localStorage.setItem('nownet_micronetActive', 'true');
      
      if (socket) {
        socket.emit('micronet_register', { deviceName: name });
        socket.emit('micronet_lookup', { deviceNames: [name] }, (users: MicronetNode[]) => {
          const others = users.filter(u => u.userId !== userId);
          if (others.length > 0) {
            setNearbyUsers(prev => {
              const combined = [...prev, ...others];
              return Array.from(new Map(combined.map(item => [item.userId, item])).values());
            });
          }
        });
      }
      
      try {
        await device.gatt?.connect();
      } catch (connErr) {
        console.warn("GATT Connection failed, but anchor name was set:", connErr);
      }
    } catch (error: any) {
      if (error.name !== 'NotFoundError') {
        console.error("Bluetooth pairing failed:", error);
        alert(`Bluetooth pairing failed: ${error.message || "Unknown error"}`);
      }
    }
  };

  const handleDiscovery = async () => {
    try {
      const nav = navigator as any;
      if (!nav.bluetooth) return;

      setIsScanning(true);
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service']
      });

      const discoveredName = device.name || "Unknown";
      
      if (socket) {
        socket.emit('micronet_lookup', { deviceNames: [discoveredName] }, (users: MicronetNode[]) => {
          const newNearby = users.filter(u => u.userId !== userId);
          setNearbyUsers(prev => {
            const combined = [...prev, ...newNearby];
            return Array.from(new Map(combined.map(item => [item.userId, item])).values());
          });
          setIsScanning(false);
          if (newNearby.length > 0) {
            alert(`MICRONET_DISCOVERY: Found ${newNearby.map(n => `NODE_${n.userId.slice(0,6)}`).join(', ')} nearby!`);
          } else {
            alert(`MICRONET_DISCOVERY: Node "${discoveredName}" is active, but no NowNet users are anchored to it.`);
          }
        });
      }
    } catch (error: any) {
      setIsScanning(false);
      if (error.name !== 'NotFoundError') {
        console.error("Discovery failed:", error);
        alert(`Discovery failed: ${error.message || "Unknown error"}`);
      }
    }
  };

  const clearAnchor = () => {
    setMicronetDevice(null);
    setIsMicronetActive(false);
    localStorage.removeItem('nownet_micronetDevice');
    localStorage.removeItem('nownet_micronetActive');
  };

  return {
    isMicronetActive,
    micronetDevice,
    nearbyUsers,
    allNodes,
    isScanning,
    handlePairing,
    handleDiscovery,
    clearAnchor
  };
}
