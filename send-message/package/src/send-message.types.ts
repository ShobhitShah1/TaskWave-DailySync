export type ChangeEventPayload = {
  value: string;
};

export type SendMessageModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
};

export type SendMessageViewProps = {
  url: string;
  onLoad?: (event: { nativeEvent: { url: string } }) => void;
};
