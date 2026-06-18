"use client";
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Float, Stars, Instances, Instance } from '@react-three/drei';

const NUM_NODES = 120;
const CONNECTION_DISTANCE = 2.8;

// Individual interactive node component
function InteractiveNode({ position, isDark }: { position: THREE.Vector3, isDark: boolean }) {
    const ref = useRef<any>(null);
    const [hovered, setHover] = useState(false);

    useFrame(() => {
        if (ref.current) {
            // Smoothly scale up when hovered
            const targetScale = hovered ? 3.5 : 1;
            ref.current.scale.setScalar(THREE.MathUtils.lerp(ref.current.scale.x, targetScale, 0.15));
        }
    });

    const defaultColor = isDark ? '#818cf8' : '#6366f1';
    const hoverColor = isDark ? '#22d3ee' : '#0ea5e9';

    return (
        <Instance
            ref={ref}
            position={position}
            color={hovered ? hoverColor : defaultColor}
            onPointerOver={(e) => { 
                e.stopPropagation(); 
                setHover(true); 
                document.body.style.cursor = 'crosshair';
            }}
            onPointerOut={() => { 
                setHover(false); 
                document.body.style.cursor = 'auto';
            }}
        />
    );
}

// The main network structure (nodes + lines)
function Network({ isDark }: { isDark: boolean }) {
    const groupRef = useRef<THREE.Group>(null);

    // Generate random node positions in a hollow sphere
    const nodes = useMemo(() => {
        const temp = [];
        for (let i = 0; i < NUM_NODES; i++) {
            // Radius between 2.5 and 6 to leave space for the core
            const r = 2.5 + 3.5 * Math.cbrt(Math.random());
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);
            
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);
            
            temp.push(new THREE.Vector3(x, y, z));
        }
        return temp;
    }, []);

    // Generate lines connecting close nodes
    const lineGeometry = useMemo(() => {
        const points = [];
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                if (nodes[i].distanceTo(nodes[j]) < CONNECTION_DISTANCE) {
                    points.push(nodes[i], nodes[j]);
                }
            }
        }
        return new THREE.BufferGeometry().setFromPoints(points);
    }, [nodes]);

    // Slowly rotate the entire network
    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (groupRef.current) {
            groupRef.current.rotation.y = t * 0.03;
            groupRef.current.rotation.x = Math.sin(t * 0.05) * 0.1;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Render all nodes efficiently using Instances */}
            <Instances limit={NUM_NODES} range={NUM_NODES}>
                <sphereGeometry args={[0.05, 16, 16]} />
                <meshStandardMaterial 
                    color={isDark ? "#4f46e5" : "#6366f1"} 
                    emissive={isDark ? "#4338ca" : "#818cf8"} 
                    emissiveIntensity={isDark ? 1.5 : 0.5} 
                    toneMapped={false} 
                />
                {nodes.map((pos, i) => (
                    <InteractiveNode key={i} position={pos} isDark={isDark} />
                ))}
            </Instances>

            {/* Render connections */}
            <lineSegments geometry={lineGeometry}>
                <lineBasicMaterial 
                    color={isDark ? "#38bdf8" : "#0ea5e9"} 
                    transparent 
                    opacity={isDark ? 0.15 : 0.25} 
                    blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending} 
                />
            </lineSegments>
        </group>
    );
}

// Central pulsing AI core
function AICore({ isDark }: { isDark: boolean }) {
    const coreRef = useRef<THREE.Mesh>(null);
    const wireframeRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (coreRef.current) {
            // Pulse effect
            const scale = 1 + Math.sin(t * 3) * 0.05;
            coreRef.current.scale.setScalar(scale);
            coreRef.current.rotation.y = t * 0.2;
            coreRef.current.rotation.x = t * 0.1;
        }
        if (wireframeRef.current) {
            wireframeRef.current.rotation.y = t * -0.15;
            wireframeRef.current.rotation.x = t * -0.1;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <group>
                {/* Inner solid core */}
                <mesh ref={coreRef}>
                    <icosahedronGeometry args={[1.2, 2]} />
                    <meshStandardMaterial 
                        color={isDark ? "#0f172a" : "#f8fafc"} 
                        emissive={isDark ? "#3730a3" : "#a5b4fc"}
                        emissiveIntensity={isDark ? 0.8 : 0.4}
                        roughness={0.2}
                        metalness={0.8}
                    />
                </mesh>

                {/* Outer tech wireframe */}
                <mesh ref={wireframeRef}>
                    <icosahedronGeometry args={[1.6, 1]} />
                    <meshStandardMaterial
                        color={isDark ? "#22d3ee" : "#0ea5e9"}
                        wireframe
                        transparent
                        opacity={isDark ? 0.2 : 0.3}
                        blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending}
                    />
                </mesh>
            </group>
        </Float>
    );
}

// Camera rig for global mouse parallax effect
function CameraRig() {
    const { camera } = useThree();
    const vec = new THREE.Vector3();
    const globalMouse = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Normalize mouse coordinates to -1 to +1
            globalMouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            globalMouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);
    
    return useFrame(() => {
        // Smoothly interpolate camera position based on global mouse coordinates
        camera.position.lerp(vec.set(globalMouse.current.x * 1.5, globalMouse.current.y * 1.5, 8), 0.05);
        camera.lookAt(0, 0, 0);
    });
}

export default function Scene() {
    const isDark = false; // light-only landing

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={isDark ? 0.1 : 0.8} />
            <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={isDark ? 2 : 1} color={isDark ? "#818cf8" : "#ffffff"} />
            <pointLight position={[-10, -10, -10]} intensity={isDark ? 1 : 0.5} color={isDark ? "#22d3ee" : "#6366f1"} />
            
            {/* Environment */}
            {isDark && <Stars radius={100} depth={50} count={3000} factor={3} saturation={1} fade speed={0.5} />}

            {/* Scene Elements */}
            <AICore isDark={isDark} />
            <Network isDark={isDark} />
            
            {/* Interactivity */}
            <CameraRig />
        </>
    );
}
