import React, { useState } from "react";
import { AnimatePresence, motion, useSpring } from "framer-motion";
import { Play, Plus } from "lucide-react";
import {
  MediaControlBar,
  MediaController,
  MediaMuteButton,
  MediaPlayButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaTimeDisplay,
  MediaTimeRange,
  MediaVolumeRange,
} from "media-chrome/react";

// --- Media Chrome Wrappers ---
export const VideoPlayerWrapper = ({ style, ...props }) => (
  <MediaController style={style} {...props} />
);

export const VideoPlayerControlBar = (props) => (
  <MediaControlBar {...props} />
);

export const VideoPlayerTimeRange = ({ style, ...props }) => (
  <MediaTimeRange
    style={{
      '--media-range-thumb-opacity': 0,
      '--media-range-track-height': '2px',
      ...style
    }}
    {...props}
  />
);

export const VideoPlayerTimeDisplay = ({ style, ...props }) => (
  <MediaTimeDisplay style={{ padding: '0.625rem', ...style }} {...props} />
);

export const VideoPlayerVolumeRange = ({ style, ...props }) => (
  <MediaVolumeRange style={{ padding: '0.625rem', ...style }} {...props} />
);

export const VideoPlayerPlayButton = ({ style, ...props }) => (
  <MediaPlayButton style={{ ...style }} {...props} />
);

export const VideoPlayerSeekBackwardButton = ({ style, ...props }) => (
  <MediaSeekBackwardButton style={{ padding: '0.625rem', ...style }} {...props} />
);

export const VideoPlayerSeekForwardButton = ({ style, ...props }) => (
  <MediaSeekForwardButton style={{ padding: '0.625rem', ...style }} {...props} />
);

export const VideoPlayerMuteButton = ({ style, ...props }) => (
  <MediaMuteButton style={{ ...style }} {...props} />
);

export const VideoPlayerContent = ({ style, className, ...props }) => (
  <video style={{ margin: 0, ...style }} className={className} {...props} />
);

// --- Main Demo Component ---
export const DemoVideoPlayer = () => {
  const [showVideoPopOver, setShowVideoPopOver] = useState(false);

  const SPRING = { mass: 0.1 };
  const x = useSpring(0, SPRING);
  const y = useSpring(0, SPRING);
  const opacity = useSpring(0, SPRING);

  const handlePointerMove = (e) => {
    opacity.set(1);
    const bounds = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - bounds.left);
    y.set(e.clientY - bounds.top);
  };

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      marginTop: '4rem'
    }}>
      <div style={{
        position: 'absolute',
        top: '-2rem',
        display: 'grid',
        alignContent: 'start',
        justifyItems: 'center',
        gap: '1.5rem',
        textAlign: 'center'
      }}>
        <span style={{
          position: 'relative',
          maxWidth: '12ch',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          lineHeight: 1.2,
          opacity: 0.4,
          color: 'var(--text-primary)'
        }}>
          Click the video to play
          {/* Faux line beneath */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '100%',
            height: '4rem',
            width: '1px',
            background: 'linear-gradient(to bottom, var(--text-primary), transparent)',
            transform: 'translateX(-50%)',
            marginTop: '0.5rem'
          }} />
        </span>
      </div>

      <AnimatePresence>
        {showVideoPopOver && (
          <VideoPopOver setShowVideoPopOver={setShowVideoPopOver} />
        )}
      </AnimatePresence>

      <div
        onMouseMove={handlePointerMove}
        onMouseLeave={() => opacity.set(0)}
        onClick={() => setShowVideoPopOver(true)}
        style={{
          width: '180px',
          height: '180px',
          position: 'relative',
          cursor: 'none',
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: '0 0 40px rgba(0, 229, 255, 0.2)',
          border: '1px solid var(--border-accent)'
        }}
      >
        <motion.div
          style={{ 
            x, y, opacity,
            position: 'absolute',
            zIndex: 20,
            display: 'flex',
            width: 'fit-content',
            userSelect: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.5rem',
            fontSize: '0.875rem',
            color: 'white',
            mixBlendMode: 'exclusion',
            pointerEvents: 'none'
          }}
        >
          <Play style={{ width: '1rem', height: '1rem', fill: 'white' }} /> Play
        </motion.div>
        
        {/* Placeholder video thumbnail loop */}
        <video
          autoPlay
          muted
          playsInline
          loop
          crossOrigin="anonymous"
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
        >
          {/* We use a sample URL for the demo. The user can replace this later. */}
          <source src="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
};

// --- Popover Overlay ---
const VideoPopOver = ({ setShowVideoPopOver }) => {
  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 101,
      display: 'flex',
      height: '100vh',
      width: '100vw',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: '100%',
          background: 'rgba(5, 5, 8, 0.9)',
          backdropFilter: 'blur(12px)',
          cursor: 'pointer'
        }}
        onClick={() => setShowVideoPopOver(false)}
      />
      <motion.div
        initial={{ clipPath: "inset(43.5% 43.5% 33.5% 43.5%)", opacity: 0 }}
        animate={{ clipPath: "inset(0 0 0 0)", opacity: 1 }}
        exit={{
          clipPath: "inset(43.5% 43.5% 33.5% 43.5%)",
          opacity: 0,
          transition: {
            duration: 1,
            type: "spring",
            stiffness: 100,
            damping: 20,
            opacity: { duration: 0.2, delay: 0.8 },
          },
        }}
        transition={{
          duration: 1,
          type: "spring",
          stiffness: 100,
          damping: 20,
        }}
        style={{
          position: 'relative',
          aspectRatio: '16/9',
          width: '100%',
          maxWidth: '1280px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <VideoPlayerWrapper style={{ width: "100%", height: "100%", background: 'black', borderRadius: '12px', overflow: 'hidden' }}>
          <VideoPlayerContent
            src="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            autoPlay
            crossOrigin="anonymous"
            slot="media"
            style={{ width: "100%", height: "100%", objectFit: 'cover' }}
          />

          <span
            onClick={() => setShowVideoPopOver(false)}
            style={{
              position: 'absolute',
              right: '1rem',
              top: '1rem',
              zIndex: 10,
              cursor: 'pointer',
              borderRadius: '50%',
              padding: '0.25rem',
              background: 'rgba(0,0,0,0.5)',
              display: 'flex'
            }}
          >
            <Plus style={{ width: '1.5rem', height: '1.5rem', transform: 'rotate(45deg)', color: 'white' }} />
          </span>

          <VideoPlayerControlBar 
            style={{
              position: 'absolute',
              bottom: '0',
              left: '50%',
              display: 'flex',
              width: '100%',
              maxWidth: '1280px',
              transform: 'translateX(-50%)',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem 2.5rem',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)'
            }}
          >
            <VideoPlayerPlayButton style={{ height: '2rem', background: 'transparent' }} />
            <VideoPlayerTimeRange style={{ background: 'transparent', flex: 1, margin: '0 1rem' }} />
            <VideoPlayerMuteButton style={{ width: '2rem', height: '2rem', background: 'transparent' }} />
          </VideoPlayerControlBar>
        </VideoPlayerWrapper>
      </motion.div>
    </div>
  );
};
