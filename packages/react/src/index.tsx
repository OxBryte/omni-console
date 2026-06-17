import React, { useEffect } from 'react';
import { initOmniConsole, OmniConsoleOptions } from 'omniconsole';

export interface OmniConsoleProps {
  options?: OmniConsoleOptions;
}

export const OmniConsole: React.FC<OmniConsoleProps> = ({ options }) => {
  useEffect(() => {
    const consoleInstance = initOmniConsole(options);
    return () => {
      consoleInstance?.destroy();
    };
  }, [options]);

  return null;
};

export function useOmniConsole(options?: OmniConsoleOptions) {
  useEffect(() => {
    const consoleInstance = initOmniConsole(options);
    return () => {
      consoleInstance?.destroy();
    };
  }, [options]);
}
