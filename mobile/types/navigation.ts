// Navigation Types

export type RootStackParamList = {
  Landing: undefined;
  SignIn: undefined;
  Register: undefined;
  SignInBusiness: undefined;
  RegisterBusiness: undefined;
  Home: undefined;
  Feed: undefined;
  Search: undefined;
  ViewUser: { id: number };
  Cliques: undefined;
  Clique: { id: number };
  CliqueDetail: { id: number };
  CreateClique: undefined;
  Post: undefined;
  PostDetail: { id: number };
  Notifications: undefined;
  MessageDetail: { id: number };
  Profile: undefined;
  BookingCreate: { serviceId: number };
  BookingDetail: { id: number };
  ServiceCreate: { cliqueId: number };
  AvailabilityCreate: { cliqueId: number };
  ReviewCreate: { bookingId: number };
};

export type TabParamList = {
  Home: undefined;
  SearchTab: undefined;
  CliquesTab: undefined;
  Post: undefined;
  NotificationsTab: undefined;
  Profile: undefined;
};
