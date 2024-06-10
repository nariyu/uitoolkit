interface Window {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gtag?: (type: string, trackingId: string, params: any) => void;
  FB?: {
    ui: (options: { method: "share"; href: string }) => void;
  };
}
