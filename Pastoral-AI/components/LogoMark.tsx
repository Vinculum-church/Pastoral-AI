import React from 'react';

/**
 * Símbolo do PastoriAI: cruz dentro do círculo (o "vitral") e, embaixo,
 * o cajado do pastor. Traço único, simples, legível até em 16px.
 */
const LogoMark: React.FC<{ size?: number; className?: string; title?: string }> = ({ size = 28, className = '', title }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth={3.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role={title ? 'img' : undefined}
    aria-label={title}
    aria-hidden={title ? undefined : true}
  >
    <circle cx="24" cy="17" r="12" />
    <path d="M24 9.5v15M18 15h12" />
    {/* cajado: desce do círculo e termina no gancho do pastor */}
    <path d="M24 29v9.5a4.5 4.5 0 0 1-9 0" />
  </svg>
);

export default LogoMark;
