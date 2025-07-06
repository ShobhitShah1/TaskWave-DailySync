import { DocumentPickerResponse } from '@react-native-documents/picker';
import React from 'react';

import AttachFile from '../Components/AttachFile';

interface DocumentPickerProps {
  selectedDocuments: DocumentPickerResponse[];
  onHandelAttachmentClick: () => void;
  onRemoveDocument: (index: number) => void;
  themeColor: string;
}

const DocumentPicker: React.FC<DocumentPickerProps> = ({
  selectedDocuments,
  onHandelAttachmentClick,
  onRemoveDocument,
  themeColor,
}) => {
  return (
    <AttachFile
      themeColor={themeColor}
      onRemoveDocument={onRemoveDocument}
      selectedDocuments={selectedDocuments}
      onHandelAttachmentClick={onHandelAttachmentClick}
    />
  );
};

export default DocumentPicker;
