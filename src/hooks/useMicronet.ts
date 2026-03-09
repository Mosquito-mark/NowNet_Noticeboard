import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { MicronetNode } from '../types';

const COLORS = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Cyan', 'Magenta', 'Crimson', 'Cobalt', 'Emerald', 'Amber'];
const VERBS = ['Running', 'Jumping', 'Flying', 'Swimming', 'Crawling', 'Falling', 'Rising', 'Spinning', 'Glowing', 'Fading', 'Pulsing', 'Echoing'];
const NOUNS = ['Fox', 'Bear', 'Wolf', 'Eagle', 'Shark', 'Lion', 'Tiger', 'Hawk', 'Owl', 'Snake', 'Dragon', 'Phoenix'];

export function generateNodeName(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = COLORS[Math.abs(hash) % COLORS.length];
  const v = VERBS[Math.abs(hash >> 8) % VERBS.length];
  const n = NOUNS[Math.abs(hash >> 16) % NOUNS.length];
  return `${c}-${v}-${n}`;
}

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

      const rawName = device.name || "Unknown Node";
      const name = generateNodeName(rawName);
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

      const rawName = device.name || "Unknown";
      const discoveredName = generateNodeName(rawName);
      
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
