'use client';
import React, { useState, useEffect } from 'react';
import { Heart, Instagram, Facebook } from 'lucide-react';




// Function to get headline based on time of day
const getTimeBasedMessage = () => {
  const hour = new Date().getHours();
  
  if (hour >= 10 && hour < 12) {
    return {
      headline: "Sssh! It's nap time",
      subtext: "Purrfect Love will be up soon"
    };
  } else if (hour >= 12 && hour < 16) {
    return {
      headline: "Sssh! It's nap time",
      subtext: "Purrfect Love will be up soon"
    };
  } else if (hour >= 16 && hour < 18) {
    return {
      headline: "It's zoomies time!",
      subtext: "Purrfect Love will be up soon"
    };
  } else if (hour >= 18 && hour < 22) {
    return {
      headline: "It's dinner time!",
      subtext: "Purrfect Love will be up soon"
    };
  } else if (hour >= 22 && hour < 24) {
    return {
      headline: "It's late night zoomies time!",
      subtext: "Purrfect Love will be up soon"
    };
  } else if (hour >= 0 && hour < 4) {
    return {
      headline: "Ssshh it's sleepy time",
      subtext: "Purrfect Love will be up soon"
    };
  } else if (hour >= 4 && hour < 7) {
    return {
      headline: "It's breakfast time!",
      subtext: "Purrfect Love will be up soon"
    };
  } else if (hour >= 7 && hour < 10) {
    return {
      headline: "It's second breakfast time!",
      subtext: "Purrfect Love will be up soon"
    };
  }
};

export default function ComingSoon() {
  const [message, setMessage] = useState(getTimeBasedMessage());

  useEffect(() => {
    // Update message every minute to check if time period changed
    const interval = setInterval(() => {
      setMessage(getTimeBasedMessage());
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        backgroundColor: '#2a4674',
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        overflow: 'hidden',
        position: 'relative',
        margin: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Animated paw prints in background */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.1 }}>
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              fontSize: '4rem',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          >
            🐾
          </div>
        ))}
      </div>

      <div style={{ maxWidth: '64rem', width: '100%', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <img
              src="/purrfectlove/logo.png"
              alt="Purrfect Love Logo"
              style={{ width: '200px', height: 'auto', maxWidth: '100%' }}
            />
          </div>

          {/* Logo/Title Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h1
              style={{
                color: '#ffc544',
                fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
                fontWeight: 'bold',
                margin: 0,
              }}
            >
              {message.headline}
            </h1>
            <p
              style={{
                color: '#ffc544',
                fontSize: 'clamp(1.5rem, 5vw, 3rem)',
                fontWeight: 'bold',
                margin: 0,
              }}
            >
              {message.subtext}
            </p>
          </div>

          {/* Contact Info */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', paddingTop: '2rem' }}>
            <a
              href="https://www.instagram.com/purrfectlove.bangalore/"
              target="_blank"
              rel="noopener noreferrer"
              className="instagram-link"
              style={{
                color: '#9ca3af',
                transition: 'color 0.2s',
              }}
              aria-label="Follow us on Instagram"
            >
              <Instagram style={{ width: '2rem', height: '2rem' }} />
            </a>
            <a
              href="https://www.facebook.com/share/1PEQcywwe2/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              className="instagram-link"
              style={{
                color: '#9ca3af',
                transition: 'color 0.2s',
              }}
              aria-label="Follow us on Facebook"
            >
              <Facebook style={{ width: '2rem', height: '2rem' }} />
            </a>
          </div>

          {/* Footer */}
          <div style={{ paddingTop: '3rem' }}>
            <p
              style={{
                color: '#9ca3af',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                margin: 0,
              }}
            >
              Made with <Heart style={{ width: '1rem', height: '1rem', color: '#ffc544' }} fill="#ffc544" /> for cats
              and cat lovers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}