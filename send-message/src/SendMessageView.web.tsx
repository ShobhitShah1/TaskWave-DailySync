import * as React from 'react';

import { SendMessageViewProps } from './SendMessage.types';

export default function SendMessageView(props: SendMessageViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
