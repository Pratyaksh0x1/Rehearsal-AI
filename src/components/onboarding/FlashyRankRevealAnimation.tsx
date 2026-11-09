'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import Image from 'next/image';
import { Sparkles, Trophy, Shield, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

interface FlashyRankRevealAnimationProps {
  username?: string;
  onEnterArena: () => void;
}

export function FlashyRankRevealAnimation({
  username = 'Recruit',
  onEnterArena,
}: FlashyRankRevealAnimationProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // 1. Trigger celebratory multi-burst golden fireworks
    const triggerConfetti = () => {
      // Center burst
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#f59e0b', '#fbbf24', '#d97706', '#cd7f32', '#a855f7'],
        disableForReducedMotion: true,
      });

      // Left cannon
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 60,
          origin: { x: 0.1, y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#ffffff', '#cd7f32'],
        });
      }, 350);

      // Right cannon
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 60,
          origin: { x: 0.9, y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#ffffff', '#cd7f32'],
        });
      }, 700);
    };

    triggerConfetti();

    // Reveal UI cards with slight delay for dramatic effect
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 400);

    // 2. Initialize Three.js 3D Animated Scene
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 480;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 3D Metallic Shield / Emblem Geometry
    // We create an extruded faceted shield shape
    const shieldShape = new THREE.Shape();
    shieldShape.moveTo(0, 1.6);
    shieldShape.lineTo(1.1, 1.2);
    shieldShape.lineTo(1.2, 0.1);
    shieldShape.lineTo(0.7, -1.0);
    shieldShape.lineTo(0, -1.6);
    shieldShape.lineTo(-0.7, -1.0);
    shieldShape.lineTo(-1.2, 0.1);
    shieldShape.lineTo(-1.1, 1.2);
    shieldShape.closePath();

    const extrudeSettings = {
      depth: 0.25,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.1,
      bevelThickness: 0.1,
    };

    const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, extrudeSettings);
    shieldGeo.center();

    // Metallic Bronze / Burnished Gold Material
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0xcd7f32,
      roughness: 0.25,
      metalness: 0.85,
      emissive: 0x4a2a10,
      emissiveIntensity: 0.3,
    });

    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    scene.add(shieldMesh);

    // Inner Emblem Bevel / Trim
    const innerRingGeo = new THREE.TorusGeometry(1.0, 0.04, 16, 64);
    const innerRingMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.15,
      metalness: 0.95,
      emissive: 0x8a4b08,
      emissiveIntensity: 0.5,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.position.z = 0.2;
    scene.add(innerRing);

    // 3. Swirling 3D Particle Vortex (1,000 glowing particle stars)
    const particleCount = 1200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const goldColor = new THREE.Color(0xfbbf24);
    const bronzeColor = new THREE.Color(0xcd7f32);
    const purpleColor = new THREE.Color(0xa855f7);

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.5 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.8;

      positions[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      positions[i * 3 + 1] = radius * Math.sin(phi);
      positions[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);

      const chosenColor =
        Math.random() > 0.6 ? goldColor : Math.random() > 0.3 ? bronzeColor : purpleColor;

      colors[i * 3] = chosenColor.r;
      colors[i * 3 + 1] = chosenColor.g;
      colors[i * 3 + 2] = chosenColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const goldLight = new THREE.PointLight(0xf59e0b, 3, 20);
    goldLight.position.set(3, 3, 4);
    scene.add(goldLight);

    const rimLight = new THREE.PointLight(0xa855f7, 2, 20);
    rimLight.position.set(-3, -2, 2);
    scene.add(rimLight);

    const frontLight = new THREE.DirectionalLight(0xffffff, 1.2);
    frontLight.position.set(0, 2, 5);
    scene.add(frontLight);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Handle Window Resize
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight || 480;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Shield floating and spinning
      shieldMesh.rotation.y = Math.sin(elapsedTime * 0.8) * 0.35 + mouseX * 0.4;
      shieldMesh.rotation.x = Math.cos(elapsedTime * 0.6) * 0.15 + mouseY * 0.3;
      shieldMesh.position.y = Math.sin(elapsedTime * 1.5) * 0.08;

      innerRing.rotation.y = shieldMesh.rotation.y;
      innerRing.rotation.x = shieldMesh.rotation.x;
      innerRing.position.y = shieldMesh.position.y;

      // Swirling particle vortex
      particleSystem.rotation.y = elapsedTime * 0.15;
      particleSystem.rotation.x = elapsedTime * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      clearTimeout(contentTimer);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      // Clean up Three.js objects
      shieldGeo.dispose();
      shieldMat.dispose();
      innerRingGeo.dispose();
      innerRingMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto min-h-[640px] px-4 py-8 flex flex-col items-center justify-center text-center overflow-hidden">
      {/* Three.js 3D Viewport in background */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0 flex items-center justify-center"
      />

      {/* Radial Energy Burst Glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-amber-500/20 via-purple-600/15 to-transparent blur-3xl pointer-events-none -z-10 animate-pulse" />

      {/* Game Promotion Content Overlay */}
      <div
        className={`relative z-10 flex flex-col items-center transition-all duration-700 transform ${
          showContent ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'
        }`}
      >
        {/* Top Gold Glowing Tag matching game calibration */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/60 text-amber-300 font-mono text-xs uppercase tracking-widest font-black shadow-[0_0_20px_rgba(245,158,11,0.4)] mb-4 animate-bounce">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Rank Calibrated</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
        </div>

        {/* 2D Fallback Icon overlay if WebGL is delayed */}
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 my-2 drop-shadow-[0_0_35px_rgba(205,127,50,0.8)] pointer-events-none">
          <Image
            src="/ranks/bronze.svg"
            alt="Soldier Rank Emblem"
            fill
            className="object-contain animate-float-medium"
            priority
          />
        </div>

        {/* Giant Metallic Rank Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-700 drop-shadow-[0_5px_25px_rgba(205,127,50,0.6)] mt-2">
          SOLDIER
        </h1>

        <div className="text-sm sm:text-base font-mono font-semibold text-amber-300/90 tracking-widest uppercase mt-1">
          Tier I &bull; Bronze League
        </div>

        {/* Lore / Motivation Text */}
        <p className="max-w-md mx-auto text-xs sm:text-sm text-amber-100/80 leading-relaxed font-normal mt-3 px-4">
          Welcome to the arena, <strong className="text-white">{username}</strong>. Fresh recruit. You know the basics; now learn to think out loud.
        </p>

        {/* Unlocked Capabilities Pills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg w-full mt-6 mb-8 text-left">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/50 border border-amber-900/40 text-xs text-amber-100/90 backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>45-Minute Voice Interview Chambers</span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/50 border border-amber-900/40 text-xs text-amber-100/90 backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Real-Time Gnani Voice Proctoring</span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/50 border border-amber-900/40 text-xs text-amber-100/90 backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Live LeetCode Test Suite Evaluation</span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/50 border border-amber-900/40 text-xs text-amber-100/90 backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Dual Leagues (Tech &amp; Behavioral HR)</span>
          </div>
        </div>

        {/* High-Energy Action Button */}
        <button
          type="button"
          onClick={onEnterArena}
          className="px-10 py-4 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-neutral-950 font-black text-base shadow-[0_0_40px_rgba(245,158,11,0.65)] hover:shadow-[0_0_55px_rgba(245,158,11,0.85)] transition-all flex items-center gap-3 active:scale-95 group cursor-pointer"
        >
          <Zap className="w-5 h-5 text-neutral-950 fill-current" />
          <span>Enter Rehearsal Arena</span>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
        </button>
      </div>
    </div>
  );
}

