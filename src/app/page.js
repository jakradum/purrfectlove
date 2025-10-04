import React from 'react';
import { Heart, Instagram } from 'lucide-react';
import { Lato } from 'next/font/google';

const lato = Lato({ 
  weight: ['400', '700'],
  subsets: ['latin'] 
});

export default function ComingSoon() {
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
        margin: 0
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
          {/* <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <img 
              src="/logo.png" 
              alt="Purrfect Love Logo" 
              style={{ width: '200px', height: 'auto', maxWidth: '100%' }}
            />
          </div> */}

          {/* Sleeping Cat */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <img 
              src="/sleeping cat.png" 
              alt="Sleeping cat" 
              style={{ width: '300px', height: 'auto', maxWidth: '90%' }}
            />
          </div>
          
          {/* Logo/Title Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h1 
              style={{ 
                color: '#ffc544', 
                fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
                fontWeight: 'bold',
                margin: 0
              }}
            >
              Sssh! It's nap time
            </h1>
            <p 
              style={{ 
                color: '#ffc544',
                fontSize: 'clamp(1.5rem, 5vw, 3rem)',
                fontWeight: 'bold',
                margin: 0
              }}
            >
              Purrfect Love will be up soon
            </p>
          </div>

          {/* Coming Soon Badge */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div 
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid #ffc544',
                borderRadius: '9999px',
                padding: '0.75rem 2rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }} 
            >
              <p 
                style={{ 
                  color: '#ffc544',
                  fontWeight: 'bold',
                  fontSize: '1.125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  justifyContent: 'center',
                  margin: 0
                }}
              >
                <Heart style={{ width: '1.25rem', height: '1.25rem' }} fill="#ffc544" />
                Coming Soon
                <Heart style={{ width: '1.25rem', height: '1.25rem' }} fill="#ffc544" />
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '2rem' }}>
            <a
              href="https://www.instagram.com/purrfectlove.bangalore/"
              target="_blank"
              rel="noopener noreferrer"
              className="instagram-link"
              style={{ 
                color: '#9ca3af',
                transition: 'color 0.2s'
              }}
              aria-label="Follow us on Instagram"
            >
              <Instagram style={{ width: '2rem', height: '2rem' }} />
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
                margin: 0
              }}
            >
              Made with <Heart style={{ width: '1rem', height: '1rem', color: '#ffc544' }} fill="#ffc544" /> for cats and cat lovers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}