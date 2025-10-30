import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { TouchableOpacity } from "react-native";
import { Box, Card, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import type { Availability } from "@/types";

const DAYS = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

interface AvailabilityCardProps {
	availability: Availability;
	isOwner?: boolean;
	onMenuPress?: () => void;
}

export function AvailabilityCard({
	availability,
	isOwner,
	onMenuPress,
}: AvailabilityCardProps) {
	const theme = useTheme<Theme>();

	return (
		<Card variant="elevated" marginBottom="s">
			<Box flexDirection="row" alignItems="flex-start">
				<Box flex={1}>
					<Box flexDirection="row" alignItems="center" marginBottom="s">
						<Ionicons
							name="calendar-outline"
							size={18}
							color={theme.colors.primary}
							style={{ marginRight: theme.spacing.s }}
						/>
						<Text variant="body" fontWeight="600">
							{availability.isRecurring
								? `Every ${formatDay(availability.dayOfWeek)} · ${availability.timezone}`
								: `${formatDate(availability.date)} · ${availability.timezone}`}
						</Text>
					</Box>
					<Box flexDirection="row" alignItems="center">
						<Ionicons
							name="time-outline"
							size={16}
							color={theme.colors["accent-foreground"]}
							style={{ marginRight: theme.spacing.s }}
						/>
						<Text variant="body" color="foreground">
							{formatTime(availability.startTime)} -{" "}
							{formatTime(availability.endTime)}
						</Text>
					</Box>
					{availability.validFrom || availability.validUntil ? (
						<Text variant="caption" color="muted-foreground" marginTop="xs">
							Valid {formatDate(availability.validFrom)} -{" "}
							{formatDate(availability.validUntil)}
						</Text>
					) : null}
				</Box>
				{isOwner ? (
					<TouchableOpacity onPress={onMenuPress} style={{ padding: 4 }}>
						<Ionicons name="ellipsis-vertical" size={20} color="#666" />
					</TouchableOpacity>
				) : null}
			</Box>
		</Card>
	);
}

function formatDay(day?: number | null) {
	if (day == null || day < 0 || day > 6) return "One-time";
	return DAYS[day];
}

function formatDate(date?: string | null) {
	if (!date) return "n/a";
	const parsed = new Date(date);
	if (Number.isNaN(parsed.getTime())) return date;
	return parsed.toLocaleDateString();
}

function formatTime(time: string) {
	const [hours, minutes] = time.split(":");
	return `${hours}:${minutes}`;
}
