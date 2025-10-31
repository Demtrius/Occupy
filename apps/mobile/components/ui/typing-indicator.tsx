import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { Box } from "./restyle-components";

export function TypingIndicator() {
	const dot1 = useRef(new Animated.Value(0.3)).current;
	const dot2 = useRef(new Animated.Value(0.3)).current;
	const dot3 = useRef(new Animated.Value(0.3)).current;

	useEffect(() => {
		const animateDot = (dot: Animated.Value, delay: number) => {
			Animated.loop(
				Animated.sequence([
					Animated.timing(dot, {
						toValue: 1,
						duration: 400,
						delay,
						useNativeDriver: false,
					}),
					Animated.timing(dot, {
						toValue: 0.3,
						duration: 400,
						useNativeDriver: false,
					}),
				]),
			).start();
		};

		animateDot(dot1, 0);
		animateDot(dot2, 200);
		animateDot(dot3, 400);
	}, [dot1, dot2, dot3]);

	return (
		<Box
			backgroundColor="muted"
			padding="m"
			borderRadius="l"
			borderBottomLeftRadius="s"
			alignSelf="flex-start"
			maxWidth="80%"
			flexDirection="row"
			alignItems="center"
			marginHorizontal="s"
			marginVertical="xs"
		>
			<Animated.Text style={{ opacity: dot1, fontSize: 20, color: "gray" }}>
				•
			</Animated.Text>
			<Animated.Text
				style={{
					opacity: dot2,
					fontSize: 20,
					color: "gray",
					marginHorizontal: 2,
				}}
			>
				•
			</Animated.Text>
			<Animated.Text style={{ opacity: dot3, fontSize: 20, color: "gray" }}>
				•
			</Animated.Text>
		</Box>
	);
}
