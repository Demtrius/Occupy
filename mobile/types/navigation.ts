import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";

export type RootStackParamList = {
  Landing: undefined;
  SignIn: undefined;
  Register: undefined;
  SignInBusiness: undefined;
  RegisterBusiness: undefined;
  Home: undefined;
  Feed: undefined;
  Search: undefined;
  Notifications: undefined;
  Profile: { userId?: string };
  ViewUser: { userId: number };
  Cliques: undefined;
  CliqueCreate: { id?: number };
  CliqueDetail: { id: number };
  PostDetail: { id: number };
  MessageDetail: { messageId: number };
  BookingCreate: { serviceId: number };
  BookingDetail: { id: number };
  ServiceCreate: { cliqueId: number };
  AvailabilityCreate: { cliqueId: number };
  ReviewCreate: { bookingId: number };
  HomeTab: undefined;
  SearchTab: undefined;
  CliquesTab: undefined;
  PostCreateTab: undefined;
  NotificationsTab: undefined;
};

export type ScreenNavigationProp<T extends keyof RootStackParamList> =
  StackNavigationProp<RootStackParamList, T>;

export type ScreenRouteProp<T extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  T
>;
