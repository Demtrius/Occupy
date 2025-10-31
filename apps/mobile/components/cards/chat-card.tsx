import { useRouter } from "expo-router";
import { Pressable } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { Box, Text } from "@/components/ui/restyle-components";
import { useUserQuery } from "@/hooks/use-users";
import { formatRelativeTimestamp } from "@/lib/date";
import type { Chat, User } from "@/types";

function ChatCard({
	chat,
	me,
	lastMessage,
}: {
	chat: Chat;
	me: User | undefined;
	lastMessage: any;
}) {
	const partnerId = me?.isBusinessPage
		? chat.clientUserId
		: chat.businessUserId;
	const { data: partner } = useUserQuery(partnerId);
	const isUnread =
		lastMessage &&
		!(lastMessage as any).readAt &&
		lastMessage.senderUserId !== me?.id;
	const timeText = lastMessage
		? formatRelativeTimestamp(lastMessage.sentAt)
		: "No messages";
	const router = useRouter();

	return (
		<Pressable onPress={() => router.push(`/chat/${chat.id}`)}>
			<Box
				backgroundColor="card"
				borderRadius="m"
				padding="m"
				marginBottom="s"
				borderWidth={1}
				borderColor="border"
			>
				<Box flexDirection="row" alignItems="center">
					<Avatar
						size={40}
						source={
							partner?.profileImageUrl
								? { uri: partner.profileImageUrl }
								: undefined
						}
						fallback={partner?.fullName?.[0]?.toUpperCase()}
					/>
					<Box flex={1} marginLeft="s">
						<Text variant="body" fontWeight="600" numberOfLines={1}>
							{partner?.fullName || "Loading..."}
						</Text>
						<Text variant="caption" color="muted-foreground" numberOfLines={1}>
							{lastMessage?.body || "No messages yet"}
						</Text>
					</Box>
					<Box alignItems="flex-end">
						<Text variant="caption" color="muted-foreground">
							{timeText}
						</Text>
						{isUnread && (
							<Box
								width={8}
								height={8}
								borderRadius="xl"
								backgroundColor="primary"
								marginTop="xs"
							/>
						)}
					</Box>
				</Box>
			</Box>
		</Pressable>
	);
}

export { ChatCard };
