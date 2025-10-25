import type { ImageProps } from "expo-image";
import { Image } from "expo-image";
import { Box, Text } from "./restyle-components";

interface AvatarProps extends Omit<ImageProps, "source"> {
	size?: number;
	source?: ImageProps["source"];
	fallback?: string;
	marginBottom?: "xs" | "s" | "m" | "l" | "xl" | "xxl";
}

export function Avatar({
	size = 80,
	source,
	fallback,
	marginBottom,
	style,
	...props
}: AvatarProps) {
	const avatarSize = { width: size, height: size };

	return (
		<Box
			width={size}
			height={size}
			borderRadius="xl"
			backgroundColor="muted"
			overflow="hidden"
			alignItems="center"
			justifyContent="center"
			marginBottom={marginBottom}
		>
			{source ? (
				<Image
					source={source}
					style={[avatarSize, style]}
					placeholder={require("@/assets/images/partial-react-logo.png")}
					contentFit="cover"
					{...props}
				/>
			) : (
				<Box
					width={size}
					height={size}
					alignItems="center"
					justifyContent="center"
					backgroundColor="primary"
				>
					<Text variant="body" color="primary-foreground">
						{fallback || "?"}
					</Text>
				</Box>
			)}
		</Box>
	);
}
