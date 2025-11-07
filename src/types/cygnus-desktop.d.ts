declare global {
  interface Window {
    cygnusDesktop?: {
      variant?: string;
      config?: {
        apiBaseUrl?: string;
      };
    };
  }
}

export {};
