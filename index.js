import { before } from "@vendetta/patcher";
import { React, ReactNative } from "@vendetta/metro/common";
import { General } from "@vendetta/ui/components";
import settings from "./settings.js";
import { storage } from "@vendetta/plugin";

const { View, Animated, Dimensions, Easing, Image } = ReactNative;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
    Dimensions.get("window");

storage.SnowPerformance ??= false;
storage.customImage ??= "https://cdn.bwlok.dev/snowflake.png";
storage.particleSize ??= 12;

const USE_SNOWFLAKE_IMAGE = !storage.SnowPerformance;
const IMAGE_URI =
    storage.customImage || "https://cdn.bwlok.dev/snowflake.png";
const BASE_SIZE = Math.max(
    4,
    Math.min(48, Number(storage.particleSize) || 12)
);

let patches = [];
const persistentParticles = [];
let initialized = false;

function createParticle(index, startFromCurrent = false) {
    const startY = startFromCurrent
        ? Math.random() * SCREEN_HEIGHT
        : -50;

    const animValue = new Animated.Value(startY);
    const rotationValue = USE_SNOWFLAKE_IMAGE
        ? new Animated.Value(0)
        : null;

    const x = Math.random() * SCREEN_WIDTH;

    let size;

    if (USE_SNOWFLAKE_IMAGE) {
        size = BASE_SIZE + Math.random() * (BASE_SIZE * 0.55);
    } else {
        size =
            BASE_SIZE * 0.4 +
            Math.random() * (BASE_SIZE * 0.5);
    }

    const duration = 4000 + Math.random() * 6000;
    const opacity = USE_SNOWFLAKE_IMAGE
        ? 0.55 + Math.random() * 0.45
        : 1;

    const rotation = Math.random() * 360;
    const shouldRotate =
        USE_SNOWFLAKE_IMAGE && Math.random() > 0.35;

    const rotationSpeed = 3500 + Math.random() * 9000;
    const rotationDirection =
        Math.random() > 0.5 ? 1 : -1;

    return {
        id: index,
        x,
        size,
        duration,
        animValue,
        rotationValue,
        startY,
        opacity,
        rotation,
        shouldRotate,
        rotationSpeed,
        rotationDirection,
        color: "white",
    };
}

function startRotationAnimation(particle) {
    if (
        !USE_SNOWFLAKE_IMAGE ||
        !particle.shouldRotate ||
        !particle.rotationValue
    ) {
        return;
    }

    const rotate = () => {
        particle.rotationValue.setValue(0);

        Animated.timing(particle.rotationValue, {
            toValue: particle.rotationDirection * 360,
            duration: particle.rotationSpeed,
            useNativeDriver: true,
            easing: Easing.linear,
        }).start(({ finished }) => {
            if (finished) rotate();
        });
    };

    rotate();
}

function startParticleAnimation(particle) {
    if (USE_SNOWFLAKE_IMAGE) {
        startRotationAnimation(particle);
    }

    const animate = () => {
        particle.animValue.setValue(-60);

        Animated.timing(particle.animValue, {
            toValue: SCREEN_HEIGHT + 60,
            duration: particle.duration,
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished) animate();
        });
    };

    Animated.timing(particle.animValue, {
        toValue: SCREEN_HEIGHT + 60,
        duration:
            particle.duration *
            ((SCREEN_HEIGHT + 60 - particle.startY) /
                (SCREEN_HEIGHT + 120)),
        useNativeDriver: true,
    }).start(({ finished }) => {
        if (finished) animate();
    });
}

function initializeParticles() {
    if (initialized) return;

    initialized = true;

    for (let i = 0; i < 75; i++) {
        const particle = createParticle(i, true);

        persistentParticles.push(particle);
        startParticleAnimation(particle);
    }
}

const ParticleItem = React.memo(({ particle }) => {
    if (USE_SNOWFLAKE_IMAGE) {
        const animatedRotation = particle.rotationValue
            ? particle.rotationValue.interpolate({
                  inputRange: [0, 360],
                  outputRange: [
                      `${particle.rotation}deg`,
                      `${particle.rotation + 360}deg`,
                  ],
              })
            : `${particle.rotation}deg`;

        return React.createElement(
            Animated.View,
            {
                style: {
                    position: "absolute",
                    left: particle.x,
                    top: 0,
                    width: particle.size,
                    height: particle.size,
                    opacity: particle.opacity,
                    transform: [
                        {
                            translateY: particle.animValue,
                        },
                        {
                            rotate: particle.shouldRotate
                                ? animatedRotation
                                : `${particle.rotation}deg`,
                        },
                    ],
                },
            },
            React.createElement(Image, {
                source: { uri: IMAGE_URI },
                style: {
                    width: "100%",
                    height: "100%",
                },
                resizeMode: "contain",
            })
        );
    }

    return React.createElement(Animated.View, {
        style: {
            position: "absolute",
            left: particle.x,
            top: 0,
            width: particle.size,
            height: particle.size,
            borderRadius: particle.size / 2,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            transform: [
                {
                    translateY: particle.animValue,
                },
            ],
        },
    });
});

const FallingParticles = () => {
    React.useEffect(() => {
        initializeParticles();
    }, []);

    return React.createElement(
        View,
        {
            pointerEvents: "none",
            style: {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
            },
        },
        persistentParticles.map((p) =>
            React.createElement(ParticleItem, {
                key: p.id,
                particle: p,
            })
        )
    );
};

export default {
    onLoad: () => {
        initializeParticles();

        patches.push(
            before("render", General.View, (args) => {
                const [wrapper] = args;

                if (
                    !wrapper ||
                    !Array.isArray(wrapper.style)
                ) {
                    return;
                }

                const hasFlexOne = wrapper.style.some(
                    (s) => s?.flex === 1
                );

                if (!hasFlexOne) return;

                let child = wrapper.children;

                if (Array.isArray(child)) {
                    child = child.find(
                        (c) =>
                            c?.type?.name ===
                            "NativeStackViewInner"
                    );
                }

                if (
                    child?.type?.name !==
                    "NativeStackViewInner"
                ) {
                    return;
                }

                const routes =
                    child?.props?.state?.routeNames;

                if (
                    !routes?.includes("main") ||
                    !routes?.includes("modal")
                ) {
                    return;
                }

                const currentChildren = Array.isArray(
                    wrapper.children
                )
                    ? wrapper.children
                    : [wrapper.children];

                wrapper.children = [
                    ...currentChildren,
                    React.createElement(
                        FallingParticles,
                        {
                            key: "tekku-snow-overlay",
                        }
                    ),
                ];
            })
        );
    },

    onUnload: () => {
        for (const unpatch of patches) {
            unpatch();
        }

        patches = [];
    },

    settings,
};
