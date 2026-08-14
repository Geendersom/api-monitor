type MockDataBannerProps = {
  visible: boolean;
};

export const MockDataBanner = ({ visible }: MockDataBannerProps) => {
  if (!visible) {
    return null;
  }

  return (
    <div className="mock-banner" role="status">
      Dados mockados de desenvolvimento — não refletem a API real.
    </div>
  );
};
