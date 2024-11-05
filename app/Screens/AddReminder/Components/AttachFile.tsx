import React, { FC, memo, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { DocumentPickerResponse } from "react-native-document-picker";
import AssetsPath from "../../../Global/AssetsPath";
import { FONTS, SIZE } from "../../../Global/Theme";
import useThemeColors from "../../../Theme/useThemeMode";
import ImagePreviewModal from "../../../Components/ImagePreviewModal";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";

interface AttachFileProps {
  themeColor: string;
  selectedDocuments: DocumentPickerResponse[];
  onHandelAttachmentClick: () => void;
  onRemoveDocument: (index: number) => void;
}

const AttachFile: FC<AttachFileProps> = ({
  themeColor,
  selectedDocuments,
  onHandelAttachmentClick,
  onRemoveDocument,
}) => {
  let imageIndexCounter = 0;

  const colors = useThemeColors();
  const [showFilePreview, setShowFilePreview] = useState({
    isVisible: false,
    index: -1,
  });

  const containerStyle = useMemo(
    () => [
      styles.container,
      { marginBottom: selectedDocuments.length === 0 ? 15 : 10 },
    ],
    [selectedDocuments.length]
  );

  const attachmentIconViewStyle = useMemo(
    () => [styles.attachmentIconView, { backgroundColor: themeColor }],
    [themeColor]
  );

  const documentPreviews = useMemo(
    () =>
      selectedDocuments.map((document: DocumentPickerResponse, index) => {
        const isImage = document.type?.startsWith("image");
        const documentStyle = isImage
          ? styles.fullImage
          : styles.attachmentIconSmall;

        const imageIndex: number | null = isImage ? imageIndexCounter++ : null;

        const onPressDoc = () => {
          if (document.type?.startsWith("image") && imageIndex != null) {
            setShowFilePreview({ isVisible: true, index: imageIndex });
          }
        };

        const onRemove = () => {
          onRemoveDocument(index);
        };

        return (
          <React.Fragment key={document.uri}>
            <Animated.View
              style={styles.documentPreview}
              exiting={FadeOut}
              entering={FadeIn}
              layout={LinearTransition.springify(300)}
            >
              <Pressable
                onPress={onPressDoc}
                onLongPress={onRemove}
                key={document.uri}
                style={styles.imageButton}
              >
                <Image
                  resizeMode={isImage ? "cover" : "contain"}
                  source={
                    isImage
                      ? { uri: `file://${document.uri}` }
                      : AssetsPath.ic_attachment
                  }
                  tintColor={isImage ? undefined : themeColor}
                  style={documentStyle}
                />
              </Pressable>
            </Animated.View>

            {/* <Pressable style={styles.cancelButton} onPress={onRemove}>
              <Text style={styles.cancelText}>×</Text>
            </Pressable> */}
          </React.Fragment>
        );
      }),
    [selectedDocuments, themeColor]
  );

  const imageUrls = useMemo(() => {
    return (
      selectedDocuments &&
      selectedDocuments
        .filter((doc) => doc.type?.startsWith("image") && doc.uri)
        .map((doc) => doc.uri)
    );
  }, [selectedDocuments]);

  return (
    <View>
      <View style={containerStyle}>
        <View style={styles.flexView}>
          <Text style={[styles.attachmentText, { color: colors.text }]}>
            Attach File:
          </Text>
          <Animated.View>
            <Pressable
              onPress={onHandelAttachmentClick}
              style={attachmentIconViewStyle}
            >
              <Image
                resizeMode="contain"
                style={styles.attachmentIcon}
                source={AssetsPath.ic_attachment}
              />
            </Pressable>
          </Animated.View>
        </View>
      </View>

      {selectedDocuments.length !== 0 && (
        <ScrollView
          horizontal
          removeClippedSubviews={true}
          style={styles.previewContainer}
          contentContainerStyle={styles.scrollContent}
          showsHorizontalScrollIndicator={false}
        >
          {documentPreviews}
        </ScrollView>
      )}

      <ImagePreviewModal
        isVisible={showFilePreview.isVisible}
        onClose={() => setShowFilePreview({ isVisible: false, index: -1 })}
        images={imageUrls}
        initialIndex={showFilePreview.index}
      />
    </View>
  );
};

export default memo(AttachFile);

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    overflow: "visible",
    justifyContent: "space-between",
    borderRadius: SIZE.listBorderRadius,
  },
  flexView: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  attachmentText: {
    fontFamily: FONTS.Medium,
    fontSize: 19,
  },
  attachmentIconView: {
    width: 33,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  attachmentIcon: {
    width: 18,
    height: 18,
  },
  previewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
    marginTop: 5,
  },
  scrollContent: {
    gap: 10,
  },
  documentPreview: {
    width: 65,
    height: 65,
    backgroundColor: "#f8d7da",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  attachmentIconSmall: {
    width: 40,
    height: 40,
  },
  imageButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: 8,
  },

  cancelButton: {
    position: "absolute",
    top: -5,
    zIndex: 9999,
    right: -5,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f00",
    borderRadius: 10,
  },
  cancelText: {
    color: "#fff",
    fontSize: 18,
    lineHeight: 20,
  },
});
