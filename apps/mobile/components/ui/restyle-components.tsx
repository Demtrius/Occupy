import {
	createBox,
	createRestyleComponent,
	createText,
	createVariant,
	type VariantProps,
} from "@shopify/restyle";
import type React from "react";
import { Pressable, TextInput } from "react-native";
import type { Theme } from "@/config/theme";

export const Box = createBox<Theme>();
export const Text = createText<Theme>();

export const Button = createRestyleComponent<
	VariantProps<Theme, "buttonVariants"> &
		React.ComponentProps<typeof Pressable>,
	Theme
>(
	[
		createVariant({
			themeKey: "buttonVariants",
			defaults: {
				minHeight: 52,
				borderRadius: "m",
				paddingHorizontal: "l",
				paddingVertical: "m",
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: "primary",
				color: "primary-foreground",
			},
		}),
	],
	Pressable,
);

export const Input = createRestyleComponent<
	VariantProps<Theme, "inputVariants"> & React.ComponentProps<typeof TextInput>,
	Theme
>(
	[
		createVariant({
			themeKey: "inputVariants",
			defaults: {
				minHeight: 44,
				borderRadius: "m",
				paddingHorizontal: "m",
				paddingVertical: "s",
				backgroundColor: "card",
				color: "foreground",
				borderWidth: 1,
				borderColor: "border",
				shadowColor: "ring",
				shadowOffset: {
					width: 0,
					height: 2,
				},
				shadowOpacity: 0.12,
				shadowRadius: 4,
				elevation: 2,
			},
		}),
	],
	TextInput,
);

export const Card = createRestyleComponent<
	VariantProps<Theme, "cardVariants"> & React.ComponentProps<typeof Box>,
	Theme
>(
	[
		createVariant({
			themeKey: "cardVariants",
			defaults: {
				borderRadius: "l",
				padding: "m",
				paddingBottom: "s",
				backgroundColor: "card",
				borderWidth: 1,
				borderColor: "border",
			},
		}),
	],
	Box,
);
