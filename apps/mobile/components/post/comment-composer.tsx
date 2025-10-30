import { useTheme } from "@shopify/restyle";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Animated,
	Easing,
	Pressable,
	type TextInput,
	type TextStyle,
} from "react-native";
import {
	type EdgeInsets,
	useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Box, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";

export interface ReplyContextSummary {
	label: string;
}

interface CommentComposerProps {
	value: string;
	onChange: (next: string) => void;
	onSubmit: () => void;
	isSubmitting: boolean;
	inputRef: React.RefObject<TextInput | null>;
	replyContext: ReplyContextSummary | null;
	onCancelReply: () => void;
}

export function CommentComposer({
	value,
	onChange,
	onSubmit,
	isSubmitting,
	inputRef,
	replyContext,
	onCancelReply,
}: CommentComposerProps) {
	const theme = useTheme<Theme>();
	const insets = useSafeAreaInsets();
	const bottomInset = useMemo(
		() => resolveBottomInset(insets, theme),
		[insets, theme],
	);
	const [isFocused, setIsFocused] = useState(false);
	const collapsedHeight = 56;
	const expandedHeight = 120;
	const animatedHeight = useRef(new Animated.Value(collapsedHeight)).current;

	useEffect(() => {
		Animated.timing(animatedHeight, {
			toValue: isFocused ? expandedHeight : collapsedHeight,
			duration: 250,
			easing: Easing.out(Easing.cubic),
			useNativeDriver: false,
		}).start();
	}, [animatedHeight, isFocused]);

	const placeholder = replyContext
		? `Reply to ${replyContext.label}`
		: "Share your thoughts...";

	const inputStyle = useMemo<TextStyle>(
		() => ({
			paddingTop: theme.spacing.s,
			height: "100%",
			flex: 1,
		}),
		[theme.spacing.s],
	);

	const handleFocus = useCallback(() => {
		setIsFocused(true);
	}, []);

	const handleBlur = useCallback(() => {
		setIsFocused(false);
	}, []);

	return (
		<Box
			paddingTop="m"
			borderRadius="xl"
			paddingHorizontal="m"
			borderWidth={1}
			borderColor="border"
			borderBottomColor="background"
			backgroundColor="background"
			gap="m"
			shadowColor="ring"
			shadowOffset={{
				width: 0,
				height: -1,
			}}
			shadowOpacity={0.25}
			shadowRadius={8}
			elevation={5}
			style={{ paddingBottom: bottomInset }}
		>
			<Text variant="subheader">
				{replyContext ? "Add a reply" : "Leave a comment"}
			</Text>
			{replyContext ? (
				<Box
					flexDirection="row"
					alignItems="center"
					justifyContent="space-between"
				>
					<Text variant="caption" color="primary" fontWeight="600">
						@{replyContext.label}
					</Text>
					<Pressable onPress={onCancelReply} hitSlop={8}>
						<Text variant="caption" color="muted-foreground">
							Cancel
						</Text>
					</Pressable>
				</Box>
			) : null}
			<Animated.View
				style={{
					height: animatedHeight,
					width: "100%",
				}}
			>
				<Input
					ref={inputRef}
					value={value}
					onChangeText={onChange}
					placeholder={placeholder}
					multiline
					numberOfLines={isFocused ? 5 : 2}
					textAlignVertical="top"
					onFocus={handleFocus}
					onBlur={handleBlur}
					style={inputStyle}
					editable={!isSubmitting}
				/>
			</Animated.View>
			<Button onPress={onSubmit} disabled={isSubmitting || !value.trim()}>
				{isSubmitting ? "Posting..." : "Post Comment"}
			</Button>
		</Box>
	);
}

function resolveBottomInset(insets: EdgeInsets, theme: Theme): number {
	const extra = Math.max(insets.bottom, theme.spacing.s);
	return theme.spacing.m + extra;
}
