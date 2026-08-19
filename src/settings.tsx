import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { findByProps } from "@vendetta/metro";

const { ScrollView, View, Text, Image, Slider, Alert } = RN;
const { FormRow, FormSwitchRow, FormInput } = Forms;

storage.SnowPerformance ??= false;
storage.customImage ??= "https://cdn.bwlok.dev/snowflake.png";
storage.particleSize ??= 12;

const styles = stylesheet.createThemedStyleSheet({
    versionText: {
        fontSize: 15,
        color: semanticColors.TEXT_NORMAL,
        textAlign: "center",
        fontWeight: "600",
        lineHeight: 22,
    },
    titleText: {
        fontSize: 14,
        fontWeight: "600",
        color: semanticColors.TEXT_MUTED,
    },
    titleContainer: {
        marginBottom: 8,
        marginHorizontal: 0,
        marginTop: 8,
        gap: 4,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    titleLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    container: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    image: {
        width: 72,
        height: 72,
        marginTop: 20,
        marginLeft: 16,
        borderRadius: 12,
    },
    title: {
        flexDirection: "column",
    },
    name: {
        fontSize: 28,
        paddingTop: 20,
        paddingLeft: 16,
        paddingRight: 20,
        color: semanticColors.HEADER_PRIMARY,
        fontWeight: "700",
    },
    author: {
        fontSize: 14,
        paddingLeft: 16,
        color: semanticColors.HEADER_SECONDARY,
    },
    sliderContainer: {
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    sliderLabel: {
        fontSize: 16,
        color: semanticColors.TEXT_NORMAL,
        marginBottom: 10,
        fontWeight: "500",
    },
    sliderValue: {
        fontSize: 13,
        color: semanticColors.TEXT_MUTED,
        textAlign: "right",
        marginTop: 6,
    },
});

function BetterTableRowGroup({
    title,
    icon,
    children,
    padding = false,
}: React.PropsWithChildren<{
    title?: string;
    icon?: number;
    padding?: boolean;
}>) {
    const groupStyles = stylesheet.createThemedStyleSheet({
        main: {
            backgroundColor: semanticColors.CARD_PRIMARY_BG,
            borderColor: semanticColors.BORDER_FAINT,
            borderWidth: 1,
            borderRadius: 16,
            overflow: "hidden",
            flex: 1,
        },
        icon: {
            width: 16,
            height: 16,
            marginTop: 1.5,
            tintColor: semanticColors.TEXT_MUTED,
        },
    });

    return (
        <RN.View style={{ marginHorizontal: 16, marginTop: 16 }}>
            {title && (
                <RN.View style={styles.titleContainer}>
                    <RN.View style={styles.titleLeft}>
                        {icon && (
                            <RN.Image
                                style={groupStyles.icon}
                                source={icon}
                                resizeMode="cover"
                            />
                        )}
                        <RN.Text style={styles.titleText}>{title.toUpperCase()}</RN.Text>
                    </RN.View>
                </RN.View>
            )}
            <RN.View style={groupStyles.main}>
                {padding ? (
                    <RN.View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
                        {children}
                    </RN.View>
                ) : (
                    children
                )}
            </RN.View>
        </RN.View>
    );
}

async function pickImageFromPhone() {
    try {
        // Try common locations of image pickers
        const ImagePicker =
            findByProps("launchImageLibrary") ||
            findByProps("showImagePicker") ||
            RN.NativeModules?.ImagePickerManager;

        if (ImagePicker?.launchImageLibrary) {
            ImagePicker.launchImageLibrary(
                {
                    mediaType: "photo",
                    includeBase64: true,
                    quality: 0.75,
                    maxWidth: 512,
                    maxHeight: 512,
                    selectionLimit: 1,
                },
                (res: any) => {
                    if (res?.didCancel || res?.errorCode) return;

                    const asset = res.assets?.[0] || res;
                    if (asset?.base64) {
                        const mime = asset.type || "image/png";
                        storage.customImage = `data:\( {mime};base64, \){asset.base64}`;
                        // tiny trick to force UI update
                        storage.particleSize = storage.particleSize;
                    } else {
                        Alert.alert("Error", "Could not read the selected image.");
                    }
                }
            );
            return;
        }

        // Fallback
        Alert.alert(
            "Pick from phone",
            "Your client does not expose a full gallery picker to plugins.\n\n" +
                "Easy alternatives:\n" +
                "• Upload the image somewhere (Imgur, Discord, etc.) and paste the direct link\n" +
                "• Convert the image to base64 online and paste the full data:image/... string into the URL field",
            [{ text: "Got it" }]
        );
    } catch (e) {
        console.error("[Tekku Snow] Image picker error:", e);
        Alert.alert("Error", "Failed to open image picker.");
    }
}

export default function Settings() {
    useProxy(storage);

    const previewUri = storage.customImage || "https://cdn.bwlok.dev/snowflake.png";

    return (
        <ScrollView style={{ flex: 1, backgroundColor: semanticColors.BACKGROUND_PRIMARY }}>
            {/* Header */}
            <View style={styles.container}>
                <Image
                    source={{ uri: previewUri }}
                    style={styles.image}
                    resizeMode="contain"
                />
                <View style={styles.title}>
                    <Text style={styles.name}>Tekku Snow</Text>
                    <Text style={styles.author}>by Tekku</Text>
                </View>
            </View>

            {/* Appearance */}
            <BetterTableRowGroup title="Appearance">
                <FormInput
                    title="Custom Image URL / Data URI"
                    placeholder="https://... or data:image/png;base64,..."
                    value={storage.customImage}
                    onChange={(v: string) => {
                        storage.customImage = (v || "").trim() || "https://cdn.bwlok.dev/snowflake.png";
                    }}
                />

                <FormRow
                    label="Pick image from phone / gallery"
                    subLabel="Converts image to base64 and stores it inside the plugin"
                    leading={<FormRow.Icon source={getAssetIDByName("ic_image")} />}
                    onPress={pickImageFromPhone}
                />

                <View style={styles.sliderContainer}>
                    <Text style={styles.sliderLabel}>Particle Size</Text>
                    <Slider
                        style={{ width: "100%", height: 40 }}
                        minimumValue={4}
                        maximumValue={48}
                        step={1}
                        value={storage.particleSize}
                        onValueChange={(v) => {
                            storage.particleSize = Math.round(v);
                        }}
                        minimumTrackTintColor={semanticColors.TEXT_BRAND}
                        maximumTrackTintColor={semanticColors.BACKGROUND_MODIFIER_ACCENT}
                        thumbTintColor={semanticColors.TEXT_BRAND}
                    />
                    <Text style={styles.sliderValue}>
                        {storage.particleSize}px  •  restart / reload plugin required
                    </Text>
                </View>
            </BetterTableRowGroup>

            {/* Performance */}
            <BetterTableRowGroup>
                <FormSwitchRow
                    label="Enable Performance mode"
                    subLabel="Uses simple circles instead of images. Requires restart"
                    value={storage.SnowPerformance}
                    onValueChange={(v) => {
                        storage.SnowPerformance = v;
                    }}
                />
            </BetterTableRowGroup>

            {/* More */}
            <BetterTableRowGroup title="More">
                <FormRow
                    label="Reset to default snowflake"
                    leading={<FormRow.Icon source={getAssetIDByName("ic_refresh")} />}
                    onPress={() => {
                        storage.customImage = "https://cdn.bwlok.dev/snowflake.png";
                        storage.particleSize = 12;
                    }}
                />
                <FormRow
                    label="Original plugin source"
                    leading={
                        <FormRow.Icon source={getAssetIDByName("img_account_sync_github_white")} />
                    }
                    trailing={<FormRow.Icon source={getAssetIDByName("ic_launch")} />}
                    onPress={() =>
                        RN.Linking.openURL(
                            "https://github.com/bwlok/revenge-plugins/tree/master/plugins/LetItSnow"
                        )
                    }
                />
            </BetterTableRowGroup>

            <RN.View style={{ height: 20 }} />
            <RN.Text style={styles.versionText}>Tekku Snow • v1.1.0</RN.Text>
            <RN.View style={{ height: 40 }} />
        </ScrollView>
    );
}
