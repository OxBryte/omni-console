import { App } from 'vue';
import { initOmniConsole, OmniConsoleOptions } from 'omniconsole';

export const OmniConsolePlugin = {
  install(app: App, options?: OmniConsoleOptions) {
    const instance = initOmniConsole(options);
    
    // Attach to global properties for usage in templates or scripts
    app.config.globalProperties.$omniconsole = instance;

    // Hook unmount to clear the console overlay DOM
    const originalUnmount = app.unmount;
    app.unmount = function () {
      instance?.destroy();
      originalUnmount.apply(this);
    };
  },
};
