import Header from '@Screens/AddReminder/Components/Header';
import React from 'react';

interface AlarmHeaderProps {
  onBackPress: () => void;
  title?: string;
  themeColor: string;
  textColor: string;
  style: any;
}

const AlarmHeader: React.FC<AlarmHeaderProps> = ({
  onBackPress,
  title = 'Alarm',
  themeColor,
  textColor,
  style,
}) => {
  return (
    <Header
      onBackPress={onBackPress}
      title={title}
      themeColor={themeColor}
      textColor={textColor}
      style={style}
    />
  );
};

export default AlarmHeader;
