'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, Shield, Eye, AlertCircle } from 'lucide-react';

interface ProctorCameraProps {
  onPermissionsGranted?: () => void;
  isMonitoring?: boolean;
}

export function ProctorCamera({
  onPermissionsGranted,
  isMonitoring = true,
}: ProctorCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function requestMediaPermissions() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            facingMode: 'user',
          },
          audio: true,
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.warn);
        }

        setHasPermission(true);
        setErrorMessage(null);
        if (onPermissionsGranted) onPermissionsGranted();
      } catch (err: any) {
        console.warn('Camera / Mic permission denied or unavailable:', err);
        if (mounted) {
          setHasPermission(false);
          setErrorMessage('Camera / Mic permissions are required for the live proctored interview.');
        }
      }
    }

    requestMediaPermissions();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onPermissionsGranted]);

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border bg-surface shadow-sm group">
      {/* Video Stream Preview */}
      <div className="relative aspect-video w-full bg-black/90 flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover transform -scale-x-100 ${
            isVideoMuted || !hasPermission ? 'hidden' : 'block'
          }`}
        />

        {/* Video Muted or Denied Placeholder */}
        {(isVideoMuted || !hasPermission) && (
          <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
            {hasPermission === false ? (
              <>
                <AlertCircle className="w-8 h-8 text-warning" />
                <span className="text-xs text-text-muted font-medium max-w-[200px]">
                  Camera / Microphone blocked. Please allow permissions in browser.
                </span>
              </>
            ) : (
              <>
                <CameraOff className="w-8 h-8 text-text-subtle" />
                <span className="text-xs text-text-muted font-mono">Camera feed paused</span>
              </>
            )}
          </div>
        )}

        {/* Live Proctoring Badge Overlay */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[10px] font-mono text-white border border-white/10">
          <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
          <span>PROCTOR ACTIVE</span>
        </div>

        {/* Real-time Screen Observation pill */}
        {isMonitoring && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/80 backdrop-blur text-[10px] font-mono text-accent-foreground shadow-sm">
            <Eye className="w-3 h-3" />
            <span>Screen Stream</span>
          </div>
        )}

        {/* Quick controls on hover */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={toggleVideo}
            className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur border border-white/10 transition-colors"
            title={isVideoMuted ? 'Turn camera on' : 'Pause camera'}
          >
            {isVideoMuted ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={toggleAudio}
            className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur border border-white/10 transition-colors"
            title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isAudioMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Proctor Status Bar */}
      <div className="px-3 py-2 bg-bg-subtle border-t border-border flex items-center justify-between text-[11px] font-mono text-text-muted">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-accent" />
          <span>AI Proctoring</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-success">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            Mic On
          </span>
          <span className="text-text-subtle">&bull;</span>
          <span className="text-text-primary">Anti-Cheat Active</span>
        </div>
      </div>
    </div>
  );
}

