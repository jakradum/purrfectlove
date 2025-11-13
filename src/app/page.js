import React from 'react';
import { Outfit, Lora } from 'next/font/google';

const outfit = Outfit({ 
  subsets: ['latin'],
  weight: ['400', '600', '700']
});

const lora = Lora({ 
  subsets: ['latin'],
  weight: ['400', '600']
});

export default function ComingSoon() {
  return (
    <div
      style={{
        backgroundColor: '#F6F4F0',
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        margin: 0,
      }}
    >
      <div style={{ 
        maxWidth: '350px', 
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        alignItems: 'center'
      }}>
        <img
          src="/logo.svg"
          alt="Purrfect Love - Cat Adoption & Rehab"
          style={{
            width: '100%',
            maxWidth: '320px',
            height: 'auto',
          }}
        />
        
        <h1 
          className={outfit.className}
          style={{
            fontSize: '1.75rem',
            fontWeight: '600',
            color: '#2A2A2A',
            margin: 0,
            textTransform: 'lowercase'
          }}
        >
          welcome to purrfect love
        </h1>
        
        <p 
          className={lora.className}
          style={{
            fontSize: '1rem',
            fontWeight: '400',
            color: '#6B6B6B',
            lineHeight: '1.7',
            margin: 0
          }}
        >
          purrfect love is a cat adoption and rehab collective based out of Bangalore and Stuttgart. this page is having a nap, we'll clean up and be ready soon!
        </p>
      </div>
    </div>
  );
}