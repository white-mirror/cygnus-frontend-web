declare global {
  interface Window {
    cygnusDesktop?: {
      config?: {
        apiBaseUrl?: string;
      };
    };
  }
}

export {};
