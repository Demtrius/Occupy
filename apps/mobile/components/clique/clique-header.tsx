import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { Image } from "expo-image";
import { useMemo } from "react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Box, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import type { Clique } from "@/types";

interface CliqueHeaderProps {
	clique: Clique;
	membersCount: number;
	isOwner: boolean;
	membershipStatus: "joined" | "pending" | "none";
	isLoadingAction: boolean;
	onJoin: () => void;
	onLeave: () => void;
}

export function CliqueHeader({
	clique,
	membersCount,
	isOwner,
	membershipStatus,
	isLoadingAction,
	onJoin,
	onLeave,
}: CliqueHeaderProps) {
	const theme = useTheme<Theme>();

	const { label, variant, disabled, onPress } = useMemo(() => {
		if (isOwner) {
			return {
				label: "",
				variant: "secondary" as const,
				disabled: true,
				onPress: undefined,
			};
		}
		switch (membershipStatus) {
			case "joined":
				return {
					label: "Leave Clique",
					variant: "secondary" as const,
					disabled: isLoadingAction,
					onPress: onLeave,
				};
			case "pending":
				return {
					label: "Request Pending",
					variant: "secondary" as const,
					disabled: true,
					onPress: undefined,
				};
			default:
				return {
					label: "Join Clique",
					variant: "primary" as const,
					disabled: isLoadingAction,
					onPress: onJoin,
				};
		}
	}, [isOwner, membershipStatus, isLoadingAction, onJoin, onLeave]);

	return (
		<Box padding="m" backgroundColor="background">
			<Box flexDirection="row" alignItems="center">
				<BackButton />
				<Box flexDirection="row" alignItems="center" flex={1} marginLeft="m">
					<Box
						width={40}
						height={40}
						borderRadius="l"
						overflow="hidden"
						backgroundColor="muted"
						marginRight="s"
					>
						{clique.imageUrl ? (
							<Image
								source={{ uri: clique.imageUrl }}
								style={{ width: "100%", height: "100%" }}
								contentFit="cover"
							/>
						) : (
							<Box
								flex={1}
								alignItems="center"
								justifyContent="center"
								backgroundColor="secondary"
							>
								<Ionicons
									name="people-outline"
									size={20}
									color={theme.colors["muted-foreground"]}
								/>
							</Box>
						)}
					</Box>
					<Box flex={1}>
						<Text variant="small-header" numberOfLines={1}>
							{clique.name}
						</Text>
						<Text variant="caption" color="muted-foreground">
							{membersCount} member{membersCount === 1 ? "" : "s"}
						</Text>
					</Box>
				</Box>
				{!isOwner && label ? (
					<Button
						variant={variant}
						onPress={onPress}
						disabled={disabled}
						textProps={{
							color:
								variant === "secondary" ? "foreground" : "primary-foreground",
						}}
						style={{
							paddingHorizontal: theme.spacing.m,
							paddingVertical: theme.spacing.s,
							minHeight: null,
							borderRadius: theme.borderRadii.l,
						}}
					>
						{label}
					</Button>
				) : null}
			</Box>
		</Box>
	);
}
