import { requireNativeView } from 'expo';
import * as React from 'react';

import { SendMessageViewProps } from './SendMessage.types';

const NativeView: React.ComponentType<SendMessageViewProps> = requireNativeView('SendMessage');

export default function SendMessageView(props: SendMessageViewProps) {
  return <NativeView {...props} />;
}
