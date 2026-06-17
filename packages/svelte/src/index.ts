import { initOmniConsole, OmniConsoleOptions } from 'omniconsole';

export function omniconsole(node: HTMLElement, options?: OmniConsoleOptions) {
  const instance = initOmniConsole(options);
  
  return {
    destroy() {
      instance?.destroy();
    },
  };
}
