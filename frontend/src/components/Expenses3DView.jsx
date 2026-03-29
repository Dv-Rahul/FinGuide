import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Float, MeshDistortMaterial, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

const ExpenseNode = ({ category, value, maxValue, index, totalNodes }) => {
  const angle = (index / totalNodes) * Math.PI * 2;
  const radius = 3.5;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  
  // Node size relative to max spending, minimum scale 0.3, max 1.0 (prevents dominating the orbit)
  const scaleMultiplier = maxValue > 0 ? (value / maxValue) : 0;
  const scale = 0.3 + (scaleMultiplier * 0.7); 

  const color = COLORS[index % COLORS.length];

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={1.5} position={[x, 0, z]}>
      <mesh scale={scale}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial 
          color={color} 
          envMapIntensity={1} 
          clearcoat={1} 
          clearcoatRoughness={0} 
          metalness={0.8} 
          roughness={0.2} 
          speed={3} 
          distort={0.3} 
        />
      </mesh>
      
      {/* 3D Text Labels */}
      <Text 
        position={[0, scale + 0.6, 0]} 
        fontSize={0.35} 
        color="#ffffff" 
        anchorX="center" 
        anchorY="middle" 
        outlineWidth={0.02} 
        outlineColor="#000000"
        fontWeight="bold"
      >
        {category}
      </Text>
      <Text 
        position={[0, scale + 0.2, 0]} 
        fontSize={0.25} 
        color="#a7f3d0" 
        anchorX="center" 
        anchorY="middle" 
        outlineWidth={0.02} 
        outlineColor="#000000"
      >
        ₹{value.toLocaleString('en-IN')}
      </Text>
    </Float>
  );
};

const Expenses3DView = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value), 0);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden cursor-move relative bg-slate-900 shadow-xl border border-slate-700/50">
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <h3 className="text-white text-xl font-bold tracking-tight">Financial Galaxy</h3>
        <p className="text-slate-400 text-sm mt-1">Drag to explore your spending universe</p>
      </div>
      
      <Canvas camera={{ position: [0, 5, 9], fov: 50 }}>
        {/* Environment */}
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <spotLight position={[-10, 10, -10]} angle={0.3} intensity={1} penumbra={1} />
        
        {/* Starry Background */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        {/* Controls */}
        <OrbitControls 
          enablePan={false} 
          maxPolarAngle={Math.PI / 2} 
          minPolarAngle={Math.PI / 4} 
          maxDistance={15} 
          minDistance={4} 
          autoRotate
          autoRotateSpeed={0.5}
        />
        
        {/* Center Black Hole / Core */}
        <Float speed={1} rotationIntensity={0.5} position={[0, -0.5, 0]}>
           <mesh scale={1.2}>
             <torusGeometry args={[1.5, 0.02, 16, 100]} />
             <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2} />
           </mesh>
           <mesh scale={1}>
             <torusGeometry args={[1, 0.05, 16, 100]} />
             <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={1} />
           </mesh>
        </Float>

        {/* Orbiting Expense Nodes */}
        {data.map((item, i) => (
          <ExpenseNode 
            key={item.name} 
            category={item.name} 
            value={item.value} 
            maxValue={maxValue} 
            index={i} 
            totalNodes={data.length} 
          />
        ))}
      </Canvas>
    </div>
  );
};

export default Expenses3DView;
