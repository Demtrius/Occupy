import type { components } from "./generated";

// Auth types
export type LoginRequest = components["schemas"]["LoginRequest"];
export type TokenRead = components["schemas"]["TokenRead"];
export type UserCreate = components["schemas"]["UserCreate"];

// User types
export type User = components["schemas"]["User"];
export type UserFollow = components["schemas"]["UserFollow"];
export type UserUpdate = components["schemas"]["UserUpdate"];

// Follow types
export type Follow = components["schemas"]["Follow"];
export type FollowStatus = components["schemas"]["FollowStatus"];
export type FollowingStatus = components["schemas"]["FollowingStatus"];

// Clique types
export type Clique = components["schemas"]["Clique"];
export type CliqueCreate = components["schemas"]["CliqueCreate"];
export type CliqueUpdate = components["schemas"]["CliqueUpdate"];
export type CliqueMember = components["schemas"]["CliqueMember"];
export type CliqueInvite = components["schemas"]["CliqueInvite"];
export type CliqueInviteCreate = components["schemas"]["CliqueInviteCreate"];

// Post types
export type Post = components["schemas"]["Post"];
export type PostAuthorSummary = components["schemas"]["PostAuthorSummary"];
export type PostCliqueSummary = components["schemas"]["PostCliqueSummary"];
export type PostCreate = components["schemas"]["PostCreate"];
export type PostUpdate = components["schemas"]["PostUpdate"];
export type Comment = components["schemas"]["Comment"];
export type CommentCreate = components["schemas"]["CommentCreate"];

// Media types
export type MediaCreate = components["schemas"]["MediaCreate"];

// Booking types
export type Booking = components["schemas"]["Booking"];
export type BookingServiceSummary =
	components["schemas"]["BookingServiceSummary"];
export type BookingCliqueSummary =
	components["schemas"]["BookingCliqueSummary"];
export type BookingUserSummary = components["schemas"]["BookingUserSummary"];
export type BookingCreate = components["schemas"]["BookingCreate"];
export type BookingReschedule = components["schemas"]["BookingReschedule"];
export type BookingStatus = components["schemas"]["BookingStatus"];

// Review types
export type Review = components["schemas"]["Review"];
export type ReviewCreate = components["schemas"]["ReviewCreate"];

// Notification types
export type Notification = components["schemas"]["Notification"];
export type NotificationType = components["schemas"]["NotificationType"];

// Occupation types
export type Occupation = components["schemas"]["Occupation"];
export type OccupationCreate = components["schemas"]["OccupationCreate"];

// Service types
export type Service = components["schemas"]["Service"];
export type ServiceCreate = components["schemas"]["ServiceCreate"];

// Availability types
export type Availability = components["schemas"]["Availability"];
export type AvailabilityCreate = components["schemas"]["AvailabilityCreate"];
export type AvailabilityUpdate = components["schemas"]["AvailabilityUpdate"];

// Chat types
export type Chat = components["schemas"]["Chat"];
export type Message = components["schemas"]["Message"];
export type MessageCreate = components["schemas"]["MessageCreate"];

// Search types
export type SearchResult = components["schemas"]["SearchResult"]; // Not in generated

// Cursor pages
export type CursorPageBookings = components["schemas"]["CursorPageBookings"];
export type CursorPageCliqueMembers =
	components["schemas"]["CursorPageCliqueMembers"];
export type CursorPageCliques = components["schemas"]["CursorPageCliques"];
export type CursorPageFollows = components["schemas"]["CursorPageFollows"];
export type CursorPagePosts = components["schemas"]["CursorPagePosts"];
export type CursorPageReviews = components["schemas"]["CursorPageReviews"];
export type CursorPageUsers = components["schemas"]["CursorPageUsers"];
